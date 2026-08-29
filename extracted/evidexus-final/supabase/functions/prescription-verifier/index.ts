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

const systemPrompt = `You are Evidexus Prescription Verifier — a structured cross-check engine for clinicians validating their own prescriptions before dispensing.

You receive: (1) a prescription (free text or structured), and optionally (2) patient context (age, sex, weight, eGFR/CKD stage, hepatic status, pregnancy/lactation, allergies, comorbidities, current medications, indication).

You must rigorously cross-check the prescription from EVERY relevant clinical perspective and return STRUCTURED JSON ONLY. Do not return prose.

Perspectives to evaluate (each line item):
1. Indication appropriateness — is the drug indicated for the stated condition? Is it first-line per guidelines?
2. Dose — is the dose correct for indication, age, weight, renal function (eGFR), hepatic function?
3. Frequency & duration — appropriate? Excessive/insufficient?
4. Route & formulation — appropriate route, form, strength?
5. Drug-drug interactions across the full prescription.
6. Drug-disease contraindications (e.g., NSAIDs in CKD, beta-blockers in severe asthma).
7. Drug-allergy conflicts.
8. Duplicate therapy / therapeutic class duplication.
9. Pregnancy / lactation safety (FDA category or current evidence).
10. Pediatric / geriatric safety, Beers criteria where relevant.
11. Renal / hepatic dose adjustments needed.
12. Monitoring required (labs, ECG, levels).
13. Missing essential co-prescription (e.g., PPI with chronic NSAID + steroid; calcium/vitamin D with bisphosphonate).
14. India context: is the drug commonly available in India? Brand-agnostic generic name? Banned/withdrawn in India?
15. Antimicrobial stewardship (if antibiotic): spectrum match, AMR concerns, ICMR AMR guidance.

EVIDENCE PRIORITIES: ICMR, NTEP, NACO, NCDC, MoHFW STG (India-first), then NICE, ACC/AHA, IDSA, NCCN, WHO, Cochrane, landmark RCTs. Never fabricate references.

Return ONLY this JSON shape:
{
  "overall_verdict": "Safe to dispense | Needs minor revision | Needs major revision | Do NOT dispense",
  "overall_score": "Excellent | Good | Acceptable | Poor | Unsafe",
  "summary": "1-2 sentence executive summary for the prescriber",
  "parsed_medications": [
    {
      "name": "<generic name>",
      "dose": "<dose with units>",
      "route": "<PO/IV/IM/SC/topical/etc>",
      "frequency": "<BID/TID/q8h/etc>",
      "duration": "<duration or 'ongoing'>",
      "indication_assumed": "<inferred indication if not stated>"
    }
  ],
  "checks": [
    {
      "category": "Dose | Indication | Interaction | Contraindication | Allergy | Duplicate | Renal | Hepatic | Pregnancy | Pediatric | Geriatric | Monitoring | Missing co-Rx | Availability (India) | Stewardship | Other",
      "severity": "Critical | High | Moderate | Low | Info",
      "drugs_involved": ["<drug name(s)>"] ,
      "issue": "<concise description of the problem>",
      "recommendation": "<exact suggested change or action>",
      "evidence": "<guideline / source name, e.g. ICMR AMR 2022, KDIGO 2024, Beers 2023>"
    }
  ],
  "missing_information": ["<patient data points that, if provided, would change the assessment>"],
  "suggested_revised_prescription": [
    "<each line of a corrected prescription, ready to copy>"
  ],
  "monitoring_plan": ["<labs / parameters / follow-up>"],
  "patient_counseling_points": ["<key counseling items in plain clinical language>"],
  "confidence": "High | Medium | Low"
}

If the input is not a prescription, set overall_verdict = "Do NOT dispense", confidence = "Low", and explain in summary.

Respond with valid JSON only.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admin, userId } = await requireAuth(req);
    await enforceUsageLimit(admin, userId);

    const { prescription, patientContext } = await parseJsonBody<{ prescription?: unknown; patientContext?: unknown }>(req, 18_000);
    const safePrescription = requireString(prescription, "Prescription", 5, 12_000);
    const safePatientContext = optionalString(patientContext, 4_000);

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return jsonResponse({ error: "AI service not configured" }, 500);
    }

    const userMessage = `PRESCRIPTION:\n${safePrescription}\n\nPATIENT CONTEXT:\n${safePatientContext ?? "(none provided — flag missing critical context in 'missing_information')"}\n\nVerify this prescription from every clinical perspective and return the structured JSON.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${geminiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (response.status === 429) return jsonResponse({ error: "Rate limit exceeded. Please wait and try again." }, 429);
    if (response.status === 402) return jsonResponse({ error: "Service credits exhausted." }, 402);
    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return jsonResponse({ error: "Verification service error" }, 500);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return jsonResponse({ error: "No verification generated" }, 500);

    const parsed = JSON.parse(extractJsonContent(content));
    const queryId = await logQuery(admin, {
      userId,
      toolType: "content_analysis",
      queryText: `Rx verify: ${safePrescription.slice(0, 200)}`,
      responseData: parsed,
    });

    return jsonResponse(withQueryId(parsed, queryId));
  } catch (error) {
    return handleHttpError(error, "Verification service error");
  }
});
