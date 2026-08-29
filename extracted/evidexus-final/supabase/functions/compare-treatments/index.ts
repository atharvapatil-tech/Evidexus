import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  enforceUsageLimit,
  extractJsonContent,
  handleHttpError,
  jsonResponse,
  logQuery,
  optionalString,
  parseJsonBody,
  requireAuth,
  requireString,
  withQueryId,
} from "../_shared/security.ts";

const systemPrompt = `You are a clinical treatment comparison engine. Compare two treatments/drugs/interventions and return structured evidence-based comparison.

Return a JSON object with this structure:
{
  "treatmentA": {
    "name": "Treatment A name",
    "category": "Drug class or intervention type",
    "evidenceLevel": "Strong | Moderate | Weak | Limited",
    "efficacy": 0-100,
    "safetyProfile": "Favorable | Acceptable | Concerning | Poor",
    "pros": ["list of evidence-based advantages"],
    "cons": ["list of evidence-based disadvantages"],
    "keyStudies": ["Landmark trial or guideline names"],
    "guidelineRecommendation": "First-line | Second-line | Alternative | Not recommended",
    "commonDosing": "Standard dosing if applicable",
    "interactions": ["Key drug interactions"],
    "contraindications": ["Major contraindications"],
    "costCategory": "Low | Medium | High | Very High"
  },
  "treatmentB": {
    same structure as treatmentA
  },
  "headToHead": {
    "superiorityData": "Summary of head-to-head comparison data if available",
    "preferredIn": "Clinical scenarios where one is preferred over the other",
    "equivalence": "Areas where treatments show similar outcomes",
    "keyDifferences": ["Most clinically significant differences"]
  },
  "clinicalContext": "2-3 sentence summary for the clinician making this decision",
  "guidelines": ["Relevant clinical guidelines that address this comparison"]
}

Use clinically accurate information. Reference real guidelines and studies. Be balanced and evidence-based.

Respond with valid JSON only.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admin, userId } = await requireAuth(req);
    await enforceUsageLimit(admin, userId);

    const { treatmentA, treatmentB, condition } = await parseJsonBody<{ treatmentA?: unknown; treatmentB?: unknown; condition?: unknown }>(req, 4_000);
    const safeTreatmentA = requireString(treatmentA, "First treatment", 1, 150);
    const safeTreatmentB = requireString(treatmentB, "Second treatment", 1, 150);
    const safeCondition = optionalString(condition, 200);

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return jsonResponse({ error: "AI service not configured" }, 500);
    }

    const prompt = safeCondition
      ? `Compare ${safeTreatmentA} vs ${safeTreatmentB} for the treatment of ${safeCondition}. Provide a structured clinical comparison.`
      : `Compare ${safeTreatmentA} vs ${safeTreatmentB}. Provide a structured clinical comparison.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${geminiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (response.status === 429) return jsonResponse({ error: "Rate limit exceeded" }, 429);
    if (response.status === 402) return jsonResponse({ error: "Service credits exhausted" }, 402);
    if (!response.ok) return jsonResponse({ error: "Comparison failed" }, 500);

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return jsonResponse({ error: "No comparison generated" }, 500);

    const result = JSON.parse(extractJsonContent(content));
    const queryId = await logQuery(admin, {
      userId,
      toolType: "treatment_comparison",
      queryText: `${safeTreatmentA} vs ${safeTreatmentB}${safeCondition ? ` for ${safeCondition}` : ""}`,
      responseData: result,
    });

    return jsonResponse(withQueryId(result, queryId));
  } catch (error) {
    return handleHttpError(error, "Comparison failed. Please try again.");
  }
});
