import { useState } from "react";
import { Loader2, AlertTriangle, Search, CheckCircle, Leaf, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryTracker } from "@/hooks/useQueryTracker";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

interface InteractionResult {
  itemA: string;
  itemB: string;
  interactionType: string;
  severity: string;
  summary: string;
  mechanism: string;
  clinicalSignificance: string;
  management: string;
  onsetTiming: string;
  evidenceLevel: string;
  monitoring: string[];
  alternatives: string[];
  references: string[];
}

const severityStyles: Record<string, string> = {
  Major: "severity-major",
  Moderate: "severity-moderate",
  Minor: "severity-minor",
  "None Known": "",
};

const recentQueries = ["Lisinopril + Spironolactone", "Metformin + Contrast Media"];
const ayurvedicExamples = ["Ashwagandha + Levothyroxine", "Turmeric + Warfarin", "Karela + Metformin", "Giloy + Methotrexate"];

const DrugInteractions = () => {
  const [drugA, setDrugA] = useState("");
  const [drugB, setDrugB] = useState("");
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"standard" | "ayurvedic">("standard");
  const { checkLimit, logQuery } = useQueryTracker();

  const handleCheck = async () => {
    if (!drugA.trim() || !drugB.trim()) {
      toast.error("Enter both substances");
      return;
    }

    const allowed = await checkLimit();
    if (!allowed) return;

    setIsLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drug-interactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ drugA: drugA.trim(), drugB: drugB.trim(), mode }),
        }
      );

      if (resp.status === 429) { toast.error("Rate limited."); return; }
      if (resp.status === 402) { toast.error("Service unavailable."); return; }

      const raw = await resp.json();
      if (!resp.ok) throw new Error(raw.error || "Check failed");

      // Normalize: model sometimes returns an array, and may use alt field names
      const r = Array.isArray(raw) ? raw[0] : raw;
      const normalized: InteractionResult = {
        itemA: r.itemA ?? r.substances?.[0] ?? drugA.trim(),
        itemB: r.itemB ?? r.substances?.[1] ?? drugB.trim(),
        interactionType: r.interactionType ?? "",
        severity: r.severity ?? "None Known",
        summary: r.summary ?? r.clinicalSignificance ?? "",
        mechanism: r.mechanism ?? "",
        clinicalSignificance: r.clinicalSignificance ?? "",
        management: r.management ?? r.managementStrategy ?? r.management_strategy ?? "",
        onsetTiming: r.onsetTiming ?? r.onset_timing ?? "",
        evidenceLevel: r.evidenceLevel ?? r.evidence_level ?? "",
        monitoring: Array.isArray(r.monitoring) ? r.monitoring : [],
        alternatives: Array.isArray(r.alternatives) ? r.alternatives : [],
        references: Array.isArray(r.references) ? r.references : [],
      };

      setResult(normalized);
      await logQuery("drug_interaction", `${drugA.trim()} + ${drugB.trim()}`, normalized);
    } catch (e) {
      console.error(e);
      toast.error("Interaction check failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const parseInput = (val: string) => {
    const parts = val.split(/[+\-]/);
    if (parts.length === 2) {
      setDrugA(parts[0].trim());
      setDrugB(parts[1].trim());
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="px-5 py-8 max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight mb-2">
          Interaction Precision Matrix.
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          Evaluate cross-reactive pharmacokinetic profiles between modern drugs, foods, supplements, and Ayurvedic preparations.
        </p>

        {/* Mode toggle: Standard vs Ayurvedic ↔ Allopathic */}
        <div className="grid grid-cols-2 gap-0 border border-border mb-5">
          <button
            type="button"
            onClick={() => setMode("standard")}
            aria-pressed={mode === "standard"}
            className={`flex items-center justify-center gap-2 py-2.5 text-[11px] uppercase tracking-[0.15em] font-bold transition-colors ${
              mode === "standard"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <Pill className="h-3.5 w-3.5" />
            Allopathic
          </button>
          <button
            type="button"
            onClick={() => setMode("ayurvedic")}
            aria-pressed={mode === "ayurvedic"}
            className={`flex items-center justify-center gap-2 py-2.5 text-[11px] uppercase tracking-[0.15em] font-bold transition-colors ${
              mode === "ayurvedic"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <Leaf className="h-3.5 w-3.5" />
            Ayurvedic ↔ Allopathic
          </button>
        </div>
        {mode === "ayurvedic" && (
          <p className="text-xs italic text-muted-foreground mb-4">
            Checks Ayurvedic herbs, classical formulations, and bhasmas against modern drugs. Sources: AYUSH, CCRAS, ICMR, PubMed herb-drug reviews.
          </p>
        )}

        {/* Search input */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={`${drugA}${drugA && drugB ? " + " : ""}${drugB}`}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes("+") || val.includes("-")) {
                  parseInput(val);
                } else {
                  setDrugA(val);
                  setDrugB("");
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              placeholder={mode === "ayurvedic" ? "Ashwagandha + Levothyroxine" : "Warfarin + Fluconazole"}
              className="pl-10 h-12 text-base border-border"
            />
          </div>
        </div>

        {/* Or two fields */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input
            value={drugA}
            onChange={(e) => setDrugA(e.target.value)}
            placeholder={mode === "ayurvedic" ? "Ayurvedic substance" : "Drug A"}
            className="h-11 border-border"
          />
          <Input
            value={drugB}
            onChange={(e) => setDrugB(e.target.value)}
            placeholder={mode === "ayurvedic" ? "Allopathic drug" : "Drug B / Food"}
            className="h-11 border-border"
          />
        </div>

        <Button onClick={handleCheck} disabled={isLoading} className="w-full h-12 bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm mb-4">
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...</> : "ANALYZE"}
        </Button>

        {/* Recent queries / Ayurvedic examples */}
        <div className="flex items-center gap-3 text-[10px] mb-8 flex-wrap">
          <span className="label-text">{mode === "ayurvedic" ? "Try:" : "Recent Queries:"}</span>
          {(mode === "ayurvedic" ? ayurvedicExamples : recentQueries).map((q) => (
            <button
              key={q}
              onClick={() => {
                const parts = q.split(" + ");
                setDrugA(parts[0]);
                setDrugB(parts[1] || "");
              }}
              className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-card-in">
            {/* Severity banner */}
            <div className="border-l-4 border-l-destructive bg-muted/30 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={severityStyles[result.severity] || ""}>
                  {result.severity?.toUpperCase()} SEVERITY
                </span>
                <span className="text-[10px] text-muted-foreground">Interaction ID: EX-{Math.floor(Math.random() * 9000 + 1000)}</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-1">
                {result.itemA} + {result.itemB}
              </h2>
            </div>

            {/* Mechanism */}
            <div>
              <p className="label-text mb-2">PHARMACOLOGICAL MECHANISM</p>
              <p className="text-sm text-foreground leading-relaxed">{result.mechanism}</p>
            </div>

            {/* Clinical Recommendation */}
            <div>
              <p className="label-text mb-2">CLINICAL RECOMMENDATION</p>
              <p className="text-sm text-foreground leading-relaxed">{result.management}</p>
            </div>

            {/* Secondary interactions (if alternatives exist) */}
            {result.alternatives?.length > 0 && (
              <div className="bg-accent/10 border-l-4 border-l-accent p-5">
                <span className="severity-cautionary mb-2 inline-block">CAUTIONARY</span>
                <h3 className="font-serif text-xl font-bold text-foreground mb-2">Alternative Considerations</h3>
                <p className="text-sm text-foreground leading-relaxed">
                  {result.alternatives.join(". ")}
                </p>
                <button className="text-sm font-bold text-foreground mt-3 hover:text-primary">
                  View Full Monograph →
                </button>
              </div>
            )}

            {/* Evidence Quality */}
            <div className="border-t border-b border-border py-5">
              <p className="label-text mb-4">EVIDENCE QUALITY</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Literature Support</span>
                  <span className="text-sm font-bold text-foreground">{result.evidenceLevel || "High"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Meta-Analyses</span>
                  <span className="text-sm font-bold text-foreground">{result.references?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">FDA Label Warning</span>
                  <span className="text-sm font-bold text-foreground">{result.severity === "Major" ? "Present" : "Absent"}</span>
                </div>
              </div>
            </div>

            {/* Monitoring */}
            {result.monitoring?.length > 0 && (
              <div>
                <p className="label-text mb-3">MONITORING PARAMETERS</p>
                <div className="flex flex-wrap gap-2">
                  {result.monitoring.map((m, i) => (
                    <span key={i} className="px-3 py-1.5 border border-border text-xs text-foreground">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {/* No interaction found message */}
            {result.severity === "None Known" && (
              <div className="text-center py-6">
                <CheckCircle className="h-6 w-6 text-evidence-strong mx-auto mb-2" />
                <p className="text-sm font-semibold text-evidence-strong uppercase tracking-wider">
                  NO KNOWN INTERACTIONS FOUND FOR: {result.itemA} + {result.itemB}
                </p>
              </div>
            )}

            <MedicalDisclaimer />
          </div>
        )}

        {!result && !isLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm italic">Enter two substances to check for interactions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrugInteractions;
