import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryTracker } from "@/hooks/useQueryTracker";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

interface TreatmentData {
  name: string;
  category: string;
  evidenceLevel: string;
  efficacy: number;
  safetyProfile: string;
  pros: string[];
  cons: string[];
  keyStudies: string[];
  guidelineRecommendation: string;
  commonDosing: string;
  interactions: string[];
  contraindications: string[];
  costCategory: string;
}

interface ComparisonResult {
  treatmentA: TreatmentData;
  treatmentB: TreatmentData;
  headToHead: {
    superiorityData: string;
    preferredIn: string;
    equivalence: string;
    keyDifferences: string[];
  };
  clinicalContext: string;
  guidelines: string[];
}

const matrixRows = ["MECHANISM", "INDICATIONS", "SIDE EFFECTS", "GUIDELINE PREFERENCE", "COST EFFECTIVENESS"];

const TreatmentComparison = () => {
  const [treatmentA, setTreatmentA] = useState("");
  const [treatmentB, setTreatmentB] = useState("");
  const [condition, setCondition] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { checkLimit, logQuery } = useQueryTracker();

  const handleCompare = async () => {
    if (!treatmentA.trim() || !treatmentB.trim()) {
      toast.error("Please enter both treatments");
      return;
    }

    const allowed = await checkLimit();
    if (!allowed) return;

    setIsLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compare-treatments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            treatmentA: treatmentA.trim(),
            treatmentB: treatmentB.trim(),
            condition: condition.trim() || undefined,
          }),
        }
      );

      if (resp.status === 429) { toast.error("Rate limited."); return; }
      if (resp.status === 402) { toast.error("Service unavailable."); return; }

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Comparison failed");

      setResult(data);
      await logQuery("treatment_comparison", `${treatmentA.trim()} vs ${treatmentB.trim()}`, data);
    } catch (e) {
      console.error(e);
      toast.error("Comparison failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="px-5 py-8 max-w-2xl mx-auto">
        <p className="label-text mb-2">THERAPEUTIC ASSESSMENT TOOL</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
          Comparative Evidence Synthesis for Pharmaceutical Intervention
        </h1>
        <p className="text-sm text-muted-foreground italic mb-8">
          A rigorous side-by-side analysis of clinical parameters, efficacy markers, and guideline positioning based on current peer-reviewed literature.
        </p>

        {/* Inputs */}
        <div className="space-y-4 mb-8">
          <div>
            <p className="label-text mb-2">COMPARATOR I (PRIMARY)</p>
            <Input
              value={treatmentA}
              onChange={(e) => setTreatmentA(e.target.value)}
              placeholder="e.g. Semaglutide"
              className="h-12 text-base italic border-border placeholder:text-muted-foreground/50"
            />
            <p className="text-[10px] text-muted-foreground italic mt-1">Enter generic name of active molecule for database retrieval.</p>
          </div>
          <div>
            <p className="label-text mb-2">COMPARATOR II (SECONDARY)</p>
            <Input
              value={treatmentB}
              onChange={(e) => setTreatmentB(e.target.value)}
              placeholder="e.g. Tirzepatide"
              className="h-12 text-base italic border-border placeholder:text-muted-foreground/50"
            />
            <p className="text-[10px] text-muted-foreground italic mt-1">This item will populate the comparative matrix below.</p>
          </div>
          <Input
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="Condition (optional)"
            className="h-11 border-border"
          />
          <Button onClick={handleCompare} disabled={isLoading} className="w-full h-12 bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm">
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...</> : "COMPARE"}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8 animate-card-in">
            {/* Evidence Matrix */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground">Evidence Matrix</h2>
                  <p className="text-xs text-muted-foreground italic">Data synthesized from PubMed, Cochrane Library, and FDA Clinical Reviews.</p>
                </div>
                <button className="px-4 py-2 border border-primary text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-colors">
                  EXPORT DOSSIER
                </button>
              </div>

              <div className="border border-border overflow-hidden">
                {/* Header row */}
                <div className="grid grid-cols-3 border-b border-border bg-primary text-white">
                  <div className="p-3 text-[10px] font-bold uppercase tracking-wider">CLINICAL PARAMETER</div>
                  <div className="p-3 text-[10px] font-bold uppercase tracking-wider border-l border-white/20">{result.treatmentA.name}</div>
                  <div className="p-3 text-[10px] font-bold uppercase tracking-wider border-l border-white/20">{result.treatmentB.name}</div>
                </div>

                {/* Mechanism */}
                <div className="grid grid-cols-3 border-b border-border">
                  <div className="p-4 label-text self-start">MECHANISM</div>
                  <div className="p-4 text-sm text-foreground border-l border-border">{result.treatmentA.category}</div>
                  <div className="p-4 text-sm text-foreground border-l border-border">{result.treatmentB.category}</div>
                </div>

                {/* Efficacy */}
                <div className="grid grid-cols-3 border-b border-border">
                  <div className="p-4 label-text self-start">EFFICACY</div>
                  <div className="p-4 text-sm text-foreground border-l border-border font-semibold">{result.treatmentA.efficacy}%</div>
                  <div className="p-4 text-sm text-foreground border-l border-border font-semibold">{result.treatmentB.efficacy}%</div>
                </div>

                {/* Safety */}
                <div className="grid grid-cols-3 border-b border-border">
                  <div className="p-4 label-text self-start">SIDE EFFECTS</div>
                  <div className="p-4 text-sm text-foreground border-l border-border">
                    {result.treatmentA.cons.join(". ")}
                  </div>
                  <div className="p-4 text-sm text-foreground border-l border-border">
                    {result.treatmentB.cons.join(". ")}
                  </div>
                </div>

                {/* Guideline */}
                <div className="grid grid-cols-3 border-b border-border">
                  <div className="p-4 label-text self-start">GUIDELINE PREFERENCE</div>
                  <div className="p-4 text-sm text-foreground border-l border-border">
                    {result.headToHead.preferredIn && (
                      <span className="inline-block bg-primary text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-1">PRIMARY CHOICE</span>
                    )}
                    <br />
                    {result.treatmentA.guidelineRecommendation}
                  </div>
                  <div className="p-4 text-sm text-foreground border-l border-border">
                    {result.treatmentB.guidelineRecommendation}
                  </div>
                </div>

                {/* Cost */}
                <div className="grid grid-cols-3">
                  <div className="p-4 label-text self-start">COST EFFECTIVENESS</div>
                  <div className="p-4 text-sm text-foreground border-l border-border">{result.treatmentA.costCategory}</div>
                  <div className="p-4 text-sm text-foreground border-l border-border">{result.treatmentB.costCategory}</div>
                </div>
              </div>
            </div>

            {/* Expert Synthesis */}
            <div className="border-t border-border pt-8">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Expert Synthesis</h2>
              <p className="text-sm text-foreground leading-relaxed mb-4">{result.clinicalContext}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5" />
                <span className="italic">Reviewed by AI Clinical Pharmacology Engine</span>
              </div>
            </div>

            {/* Guidelines */}
            {result.guidelines.length > 0 && (
              <div className="bg-muted/30 border border-border p-5">
                <p className="label-text mb-3">REFERENCED GUIDELINES</p>
                <div className="flex flex-wrap gap-2">
                  {result.guidelines.map((g, i) => (
                    <span key={i} className="px-2.5 py-1 border border-border text-xs text-foreground">{g}</span>
                  ))}
                </div>
              </div>
            )}

            <MedicalDisclaimer />
          </div>
        )}

        {/* Empty state */}
        {!result && !isLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm italic">Enter two treatments to generate a comparative analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentComparison;
