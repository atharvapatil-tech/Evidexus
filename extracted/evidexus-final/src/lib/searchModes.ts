export type SearchMode = "qa" | "ddx" | "dose" | "literature" | "compare" | "interactions" | "verify";

export const MODE_META: Record<
  SearchMode,
  { label: string; placeholder: string; tool_type: string; example: string }
> = {
  qa: {
    label: "Q&A",
    placeholder: "Ask a clinical question…",
    tool_type: "clinical_chat",
    example: "Empirical antibiotics for sepsis (ICMR AMR)",
  },
  ddx: {
    label: "DDx",
    placeholder: "Describe symptoms for differential diagnosis…",
    tool_type: "clinical_chat",
    example: "Fever 5 days, joint pain, rash, thrombocytopenia",
  },
  dose: {
    label: "Dose",
    placeholder: "Drug name for patient-specific dosing…",
    tool_type: "clinical_chat",
    example: "Metformin for diabetic patient with CKD",
  },
  literature: {
    label: "Literature",
    placeholder: "Search peer-reviewed literature…",
    tool_type: "literature_search",
    example: "GLP-1 agonists cardiovascular outcomes",
  },
  compare: {
    label: "Compare",
    placeholder: "Compare two treatments — e.g. Semaglutide vs Tirzepatide",
    tool_type: "treatment_comparison",
    example: "Semaglutide vs Tirzepatide for T2DM",
  },
  interactions: {
    label: "Drugs",
    placeholder: "Check interactions — e.g. Warfarin + Fluconazole",
    tool_type: "drug_interaction",
    example: "Warfarin + Fluconazole",
  },
  verify: {
    label: "Verify Rx",
    placeholder: "Paste a prescription to verify…",
    tool_type: "content_analysis",
    example: "Tab Amoxicillin 500mg PO TID x 5 days",
  },
};

export const MODE_ORDER: SearchMode[] = ["qa", "ddx", "dose", "literature", "compare", "interactions", "verify"];
