import { supabase } from "@/integrations/supabase/client";
import type { SearchMode } from "@/lib/searchModes";

export type RunOptions = {
  indiaContext?: boolean;
  ayurvedicMode?: boolean;
  conversationContext?: string;
};

type SuccessResult = {
  ok: true;
  data: any;
  tool_type: string;
  query_id?: string | null;
};

export type RunResult = SuccessResult | { ok: false; error: string };

const QA_DEFAULTS = {
  clinical_summary: "Unable to generate structured clinical response.",
  first_line_treatment: "Consult primary literature or specialist.",
  alternatives: [] as string[],
  dosage: "Not available",
  contraindications: ["Review patient history before any treatment decision"],
  clinical_reasoning: "Insufficient evidence to generate reasoning.",
  india_context: "",
  evidence_note: "Evidence limited",
  confidence: "Low" as const,
};

function applyTrustLayer(data: any): any {
  const d = { ...data };
  d.clinical_summary = d.clinical_summary || QA_DEFAULTS.clinical_summary;
  d.first_line_treatment = d.first_line_treatment || QA_DEFAULTS.first_line_treatment;
  d.alternatives = Array.isArray(d.alternatives) ? d.alternatives : [];
  d.dosage = d.dosage || QA_DEFAULTS.dosage;
  d.contraindications =
    Array.isArray(d.contraindications) && d.contraindications.length > 0
      ? d.contraindications
      : QA_DEFAULTS.contraindications;
  d.clinical_reasoning = d.clinical_reasoning || QA_DEFAULTS.clinical_reasoning;
  d.india_context = d.india_context || QA_DEFAULTS.india_context;
  d.evidence_note = d.evidence_note || QA_DEFAULTS.evidence_note;
  d.confidence = ["High", "Moderate", "Low"].includes(d.confidence)
    ? d.confidence
    : "Low";
  return d;
}

function unpackResponse(data: any, tool_type: string): SuccessResult {
  if (data?.error) throw new Error(data.error);
  const { query_id = null, ...payload } = data ?? {};
  return { ok: true, data: payload, tool_type, query_id };
}

export async function runQuery(
  mode: SearchMode,
  query: string,
  opts: RunOptions = {},
): Promise<RunResult> {
  const q = query.trim();
  if (!q) return { ok: false, error: "Query is empty" };

  try {
    if (mode === "qa") {
      const { data, error } = await supabase.functions.invoke("clinical-chat", {
        body: {
          query: q,
          indiaContext: !!opts.indiaContext,
          conversationContext: opts.conversationContext,
        },
      });
      if (error) return { ok: false, error: error.message };
      const unpacked = unpackResponse(data, "clinical_chat");
      unpacked.data = applyTrustLayer(unpacked.data);
      return unpacked;
    }

    if (mode === "ddx") {
      // DDx has its own component that calls supabase directly
      // This path handles text-based DDx queries from the search bar
      const { data, error } = await supabase.functions.invoke("ddx-engine", {
        body: { symptoms: q, age: "", sex: "", duration: "", context: "" },
      });
      if (error) return { ok: false, error: error.message };
      return unpackResponse(data, "clinical_chat");
    }

    if (mode === "dose") {
      // Dose has its own component that calls supabase directly
      const { data, error } = await supabase.functions.invoke("dose-calculator", {
        body: { drug: q, indication: "", age: "", weight: "", creatinine: "" },
      });
      if (error) return { ok: false, error: error.message };
      return unpackResponse(data, "clinical_chat");
    }

    if (mode === "literature") {
      const { data, error } = await supabase.functions.invoke("literature-search", {
        body: { query: q },
      });
      if (error) return { ok: false, error: error.message };
      return unpackResponse(data, "literature_search");
    }

    if (mode === "compare") {
      const match = q.match(/^(.+?)\s+(?:vs\.?|versus|\|)\s+(.+?)(?:\s+for\s+(.+))?$/i);
      const treatmentA = match?.[1]?.trim() ?? q;
      const treatmentB = match?.[2]?.trim() ?? "";
      const condition = match?.[3]?.trim();
      if (!treatmentB) {
        return { ok: false, error: "Use the format: Drug A vs Drug B (optionally: for Condition)" };
      }
      const { data, error } = await supabase.functions.invoke("compare-treatments", {
        body: { treatmentA, treatmentB, condition },
      });
      if (error) return { ok: false, error: error.message };
      return unpackResponse(data, "treatment_comparison");
    }

    if (mode === "interactions") {
      const parts = q.split(/\s*[+&]\s*/);
      const drugA = parts[0]?.trim();
      const drugB = parts[1]?.trim();
      if (!drugA || !drugB) {
        return { ok: false, error: "Use the format: Drug A + Drug B" };
      }
      const { data, error } = await supabase.functions.invoke("drug-interactions", {
        body: { drugA, drugB, mode: opts.ayurvedicMode ? "ayurvedic" : "standard" },
      });
      if (error) return { ok: false, error: error.message };
      const unpacked = unpackResponse(data, "drug_interaction");
      const raw = Array.isArray(unpacked.data) ? unpacked.data[0] : unpacked.data;
      return {
        ...unpacked,
        data: {
          itemA: raw.itemA ?? drugA,
          itemB: raw.itemB ?? drugB,
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
        },
      };
    }

    if (mode === "verify") {
      const { data, error } = await supabase.functions.invoke("prescription-verifier", {
        body: { prescription: q, patientContext: "" },
      });
      if (error) return { ok: false, error: error.message };
      return unpackResponse(data, "content_analysis");
    }

    return { ok: false, error: "Unknown mode" };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Request failed" };
  }
}
