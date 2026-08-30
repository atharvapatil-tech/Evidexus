import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders, enforceUsageLimit, handleHttpError, jsonResponse,
  logQuery, parseJsonBody, requireAuth, requireString, withQueryId,
} from "../_shared/security.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { admin, userId } = await requireAuth(req);
    await enforceUsageLimit(admin, userId);

    const body = await parseJsonBody<{
      symptoms?: unknown; age?: unknown; sex?: unknown;
      duration?: unknown; context?: unknown;
    }>(req, 8_000);

    const symptoms = requireString(body.symptoms, "Symptoms", 3, 2000);
    const age = typeof body.age === "string" || typeof body.age === "number" ? String(body.age) : "";
    const sex = typeof body.sex === "string" ? body.sex : "";
    const duration = typeof body.duration === "string" ? body.duration : "";
    const context = typeof body.context === "string" ? body.context : "";

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) return jsonResponse({ error: "AI service not configured" }, 500);

    const prompt = `You are a senior clinician specialising in Indian medicine and tropical diseases.
Generate a ranked differential diagnosis for an Indian patient.

PATIENT:
- Symptoms: ${symptoms}
- Age: ${age || "Not specified"}
- Sex: ${sex || "Not specified"}
- Duration: ${duration || "Not specified"}
- Additional context: ${context || "None"}

CRITICAL RULES:
1. Apply Indian epidemiology first — dengue, malaria, typhoid, TB, chikungunya, scrub typhus, leptospirosis must be considered when relevant
2. Consider monsoon season diseases, vector-borne diseases, waterborne diseases common in India
3. Rank by actual probability for an Indian patient (not a Western patient)
4. Be specific — name the exact condition, not a category
5. Suggest tests available at district hospital level in India
6. Clinical pearl must be genuinely useful, not generic

Return ONLY valid JSON (no markdown, no preamble):
{
  "most_likely": [
    {
      "rank": 1,
      "diagnosis": "exact condition name",
      "probability": "High",
      "percentage": 75,
      "reasoning": "2-3 sentences explaining why this fits this specific patient",
      "supporting_features": ["symptom/sign that supports this"],
      "against": ["feature that argues against"],
      "india_relevance": "why prevalent in India / which season / which region"
    }
  ],
  "must_not_miss": [
    {
      "diagnosis": "serious/dangerous condition",
      "why_critical": "what happens if delayed",
      "red_flag_present": true
    }
  ],
  "recommended_workup": [
    {
      "test": "specific test name",
      "rationale": "what you expect to find",
      "priority": "Immediate|Urgent|Routine",
      "cost_in_india": "Low|Medium|High",
      "available_district_level": true
    }
  ],
  "red_flags": ["specific red flag present in this patient"],
  "clinical_pearl": "one genuinely useful insight a senior clinician would share for this case",
  "refer_if": "specific criteria for referral to higher centre"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2500 },
        }),
      }
    );

    if (!res.ok) return jsonResponse({ error: "AI service error" }, 500);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      return jsonResponse({ error: "Failed to parse differential" }, 500);
    }

    parsed.symptoms = symptoms;
    parsed.patient = { age, sex, duration, context };

    const qid = await logQuery(admin, {
      userId, toolType: "clinical_chat",
      queryText: `DDx: ${symptoms}`,
      responseData: parsed,
    });

    return jsonResponse(withQueryId(parsed, qid));
  } catch (err) {
    return handleHttpError(err, "DDx engine error");
  }
});
