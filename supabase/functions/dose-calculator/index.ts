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
      drug?: unknown; age?: unknown; weight?: unknown;
      creatinine?: unknown; indication?: unknown;
      hepatic?: unknown; pregnancy?: unknown; notes?: unknown;
    }>(req, 8_000);

    const drug = requireString(body.drug, "Drug", 2, 200);
    const age = typeof body.age === "string" || typeof body.age === "number" ? String(body.age) : "";
    const weight = typeof body.weight === "string" || typeof body.weight === "number" ? String(body.weight) : "";
    const creatinine = typeof body.creatinine === "string" || typeof body.creatinine === "number" ? String(body.creatinine) : "";
    const indication = typeof body.indication === "string" ? body.indication : "";
    const hepatic = typeof body.hepatic === "string" ? body.hepatic : "Normal";
    const pregnancy = typeof body.pregnancy === "string" ? body.pregnancy : "Not applicable";
    const notes = typeof body.notes === "string" ? body.notes : "";

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) return jsonResponse({ error: "AI service not configured" }, 500);

    const prompt = `You are a clinical pharmacologist. Calculate the precise dose for this patient.

DRUG: ${drug}
PATIENT:
- Age: ${age || "Not specified"}
- Weight: ${weight || "Not specified"} kg
- Serum Creatinine: ${creatinine || "Not specified"} mg/dL
- Indication: ${indication || "Not specified"}
- Hepatic status: ${hepatic}
- Pregnancy/Lactation: ${pregnancy}
- Additional notes: ${notes || "None"}

RULES:
1. If creatinine is provided, calculate eGFR using CKD-EPI formula and adjust dose accordingly
2. Show the EXACT dose for THIS patient — not a range unless clinically required
3. Name Indian brand equivalents (e.g. Metformin → Glycomet, Glucophage; Atorvastatin → Atorva, Lipitor)
4. Flag if drug is CONTRAINDICATED for this patient
5. Include monitoring parameters that a busy Indian GP can actually perform
6. Be specific about timing — with food/empty stomach, morning/night

Return ONLY valid JSON (no markdown):
{
  "drug_generic": "generic name",
  "indication": "indication for this patient",
  "egfr_calculated": "calculated eGFR if creatinine provided, else null",
  "ckd_stage": "CKD stage if applicable",
  "status": "Safe|Use with Caution|Dose Adjustment Required|Contraindicated",
  "recommended_dose": {
    "dose": "exact dose with units e.g. 500 mg",
    "route": "PO/IV/SC/IM/Topical",
    "frequency": "OD/BD/TID/QID/weekly",
    "timing": "with food / empty stomach / at bedtime / etc",
    "duration": "duration if applicable",
    "max_daily_dose": "maximum daily dose"
  },
  "dose_adjustment": "specific adjustment made for this patient and why",
  "contraindicated": false,
  "contraindication_reason": "if contraindicated, why",
  "indian_brands": [
    {"brand": "brand name", "manufacturer": "company", "available_strength": "strength", "approx_cost": "₹X per tablet/vial"}
  ],
  "monitoring": [
    {"parameter": "what to monitor", "frequency": "how often", "target": "target value"}
  ],
  "important_interactions": ["key interaction to watch for"],
  "patient_counseling": ["key point to tell this patient"],
  "evidence_basis": "guideline or reference supporting this dose"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
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
      return jsonResponse({ error: "Failed to calculate dose" }, 500);
    }

    parsed.input = { drug, age, weight, creatinine, indication, hepatic, pregnancy };

    const qid = await logQuery(admin, {
      userId, toolType: "clinical_chat",
      queryText: `Dose: ${drug} for ${indication || "patient"}`,
      responseData: parsed,
    });

    return jsonResponse(withQueryId(parsed, qid));
  } catch (err) {
    return handleHttpError(err, "Dose calculator error");
  }
});
