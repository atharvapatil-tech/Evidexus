import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  enforceUsageLimit,
  extractJsonContent,
  handleHttpError,
  jsonResponse,
  logQuery,
  parseJsonBody,
  requireAuth,
  requireString,
  withQueryId,
} from "../_shared/security.ts";

const baseSystemPrompt = `You are a clinical drug interaction checker. Analyze interactions between two substances and return structured evidence-based information.

Return a JSON object with this exact structure:
{
  "itemA": "Name of first drug/substance",
  "itemB": "Name of second drug/substance/food",
  "interactionType": "Drug-Drug | Drug-Food | Drug-Supplement | Drug-Herb | Ayurvedic-Allopathic",
  "severity": "Major | Moderate | Minor | None Known",
  "summary": "One-sentence summary of the interaction",
  "mechanism": "Pharmacological mechanism (CYP450 induction/inhibition, P-gp, protein binding, additive pharmacodynamics, etc.)",
  "clinicalSignificance": "What this means for patient care in 2-3 sentences",
  "management": "Clinical recommendation for managing this interaction",
  "onsetTiming": "Immediate | Hours | Days | Weeks | Variable",
  "evidenceLevel": "Strong | Moderate | Limited",
  "monitoring": ["List of parameters to monitor"],
  "alternatives": ["Alternative drugs to consider if interaction is significant"],
  "references": ["Guideline or study references"]
}

Use clinically accurate, evidence-based information. Be specific about mechanisms. If no significant interaction exists, clearly state that. Respond with a SINGLE JSON OBJECT (not an array, not wrapped). Use EXACTLY the field names above (itemA, itemB, management — not substances/managementStrategy). Valid JSON only.`;

const ayurvedicSystemPrompt = `You are a clinical interaction checker specialized in AYURVEDIC ↔ ALLOPATHIC (modern pharmaceutical) interactions, with India clinical context.

Cover commonly co-prescribed Ayurvedic single herbs, classical formulations, and rasaushadhis with allopathic drugs. Examples to handle confidently:
- Ashwagandha (Withania somnifera) ↔ thyroid hormones, sedatives, immunosuppressants
- Brahmi (Bacopa monnieri) ↔ phenytoin, anticholinergics
- Guggulu / Triphala ↔ levothyroxine, statins, warfarin
- Turmeric / Curcumin ↔ warfarin, antiplatelets, tacrolimus
- Giloy (Tinospora cordifolia) ↔ immunosuppressants, methotrexate, hepatotoxic drugs
- Karela, Methi, Vijaysar, Jamun ↔ insulin/sulfonylureas (additive hypoglycemia)
- Arjuna ↔ digoxin, beta-blockers, antihypertensives
- Sarpagandha (reserpine) / Mukta vati ↔ antihypertensives, MAOIs
- Bhasmas (Swarna, Rajat, Loha, Yashada, Abhrak) ↔ heavy-metal load, hepatic/renal drugs
- Kanchnar / Kanchanar Guggulu ↔ thyroid medications
- Punarnava ↔ diuretics, lithium
- Liv-52 / Arogyavardhini ↔ hepatotoxic drugs

Always consider: herb-induced CYP modulation, additive pharmacodynamics (esp. hypoglycemia, sedation, bleeding, hypotension, immunosuppression), heavy-metal toxicity in bhasmas, hepatotoxicity, and pregnancy/lactation safety.

Return the SAME JSON structure as the standard checker, but:
- Set "interactionType" to "Ayurvedic-Allopathic" (or "Drug-Herb" if appropriate).
- In "mechanism", explain BOTH the modern pharmacological mechanism AND (only if clinically relevant) the Ayurvedic action.
- In "references", prefer: AYUSH Ministry, CCRAS, ICMR, PubMed reviews on herb-drug interactions, WHO traditional medicine monographs.
- If evidence is limited or only mechanistic/in-vitro, set "evidenceLevel" to "Limited" and say so in "clinicalSignificance".
- NEVER fabricate Sanskrit names or claim safety where evidence is absent — flag uncertainty.

Respond with valid JSON only.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admin, userId } = await requireAuth(req);
    await enforceUsageLimit(admin, userId);

    const { drugA, drugB, mode } = await parseJsonBody<{ drugA?: unknown; drugB?: unknown; mode?: unknown }>(req, 2_000);
    const safeDrugA = requireString(drugA, "First substance", 1, 120);
    const safeDrugB = requireString(drugB, "Second substance", 1, 120);

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return jsonResponse({ error: "AI service not configured" }, 500);
    }

    const isAyurvedic = mode === "ayurvedic";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${geminiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: isAyurvedic ? ayurvedicSystemPrompt : baseSystemPrompt },
          {
            role: "user",
            content: isAyurvedic
              ? `Check for interactions between Ayurvedic substance "${safeDrugA}" and allopathic drug "${safeDrugB}" (or vice versa). Provide a structured Ayurvedic-Allopathic interaction report.`
              : `Check for interactions between "${safeDrugA}" and "${safeDrugB}". Include drug-drug and drug-food interaction data. Provide a structured clinical interaction report.`,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (response.status === 429) return jsonResponse({ error: "Rate limit exceeded" }, 429);
    if (response.status === 402) return jsonResponse({ error: "Service credits exhausted" }, 402);
    if (!response.ok) return jsonResponse({ error: "Interaction check failed" }, 500);

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return jsonResponse({ error: "No interaction data generated" }, 500);

    const raw = JSON.parse(extractJsonContent(content));
    const result = {
      itemA: raw.itemA ?? raw.substances?.[0] ?? safeDrugA,
      itemB: raw.itemB ?? raw.substances?.[1] ?? safeDrugB,
      interactionType: raw.interactionType ?? "",
      severity: raw.severity ?? "None Known",
      summary: raw.summary ?? "",
      mechanism: raw.mechanism ?? "",
      clinicalSignificance: raw.clinicalSignificance ?? "",
      management: raw.management ?? raw.managementStrategy ?? "",
      onsetTiming: raw.onsetTiming ?? "",
      evidenceLevel: raw.evidenceLevel ?? "",
      monitoring: Array.isArray(raw.monitoring) ? raw.monitoring : [],
      alternatives: Array.isArray(raw.alternatives) ? raw.alternatives : [],
      references: Array.isArray(raw.references) ? raw.references : [],
    };

    const queryId = await logQuery(admin, {
      userId,
      toolType: "drug_interaction",
      queryText: `${safeDrugA} + ${safeDrugB}`,
      responseData: result,
    });

    return jsonResponse(withQueryId(result, queryId));
  } catch (error) {
    return handleHttpError(error, "Interaction check failed. Please try again.");
  }
});
