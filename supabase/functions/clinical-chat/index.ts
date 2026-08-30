import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, enforceUsageLimit, handleHttpError, jsonResponse, logQuery, parseJsonBody, requireAuth, requireString, withQueryId } from "../_shared/security.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { admin, userId } = await requireAuth(req);
    await enforceUsageLimit(admin, userId);
    const body = await parseJsonBody<{ query?: unknown; indiaContext?: unknown; conversationContext?: unknown }>(req, 8_000);
    const safeQuery = requireString(body.query, "Query", 1, 2_000);
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) return jsonResponse({ error: "GEMINI_API_KEY not found in secrets" }, 500);

    console.log("Gemini key found, length:", geminiKey.length);
    console.log("Query:", safeQuery.slice(0, 50));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`;
    const geminiBody = {
      contents: [{ role: "user", parts: [{ text: `You are a clinical AI. Answer this medical question in JSON format with fields: clinical_summary, first_line_treatment, alternatives, dosage, contraindications, clinical_reasoning, india_context, confidence. Question: ${safeQuery}` }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody)
    });

    console.log("Gemini status:", res.status);
    const rawText = await res.text();
    console.log("Gemini raw (first 200):", rawText.slice(0, 200));

    if (!res.ok) return jsonResponse({ error: `Gemini API error: ${res.status}`, details: rawText.slice(0, 300) }, 500);

    const data = JSON.parse(rawText);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) return jsonResponse({ error: "Empty response from Gemini", raw: rawText.slice(0, 200) }, 500);

    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch {
      parsed = {
        clinical_summary: text.slice(0, 300),
        first_line_treatment: "See clinical summary above",
        alternatives: [], dosage: "Consult prescribing information",
        contraindications: [], clinical_reasoning: text.slice(0, 500),
        india_context: "", confidence: "Moderate",
        retrieved_evidence: [], evidence_summary: { total: 0, highest_level: "N/A", year_range: "N/A" }
      };
    }

    const payload = { query: safeQuery, confidence: parsed.confidence ?? "Moderate", clinical_summary: parsed.clinical_summary ?? "", first_line_treatment: parsed.first_line_treatment ?? "", alternatives: parsed.alternatives ?? [], dosage: parsed.dosage ?? "", contraindications: parsed.contraindications ?? [], clinical_reasoning: parsed.clinical_reasoning ?? "", india_context: parsed.india_context ?? "", evidence_note: "Evidence from AI synthesis", retrieved_evidence: [], evidence_summary: { total: 0, highest_level: "N/A", year_range: "N/A" }, suggested_follow_ups: [] };

    const qid = await logQuery(admin, { userId, toolType: "clinical_chat", queryText: safeQuery, responseData: payload });
    return jsonResponse(withQueryId(payload, qid));
  } catch (err) {
    console.error("clinical-chat error:", err);
    return handleHttpError(err, "Clinical AI service error");
  }
});
