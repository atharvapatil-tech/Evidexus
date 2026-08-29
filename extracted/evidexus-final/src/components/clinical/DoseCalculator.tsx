import { useState } from "react";
import { Loader2, AlertTriangle, CheckCircle, Pill } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  "Safe": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", icon: CheckCircle },
  "Use with Caution": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", icon: AlertTriangle },
  "Dose Adjustment Required": { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", icon: AlertTriangle },
  "Contraindicated": { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", icon: AlertTriangle },
};

type DoseResult = {
  drug_generic: string; indication: string;
  egfr_calculated: string | null; ckd_stage: string | null;
  status: string; contraindicated: boolean; contraindication_reason: string;
  recommended_dose: {
    dose: string; route: string; frequency: string;
    timing: string; duration: string; max_daily_dose: string;
  };
  dose_adjustment: string;
  indian_brands: Array<{ brand: string; manufacturer: string; available_strength: string; approx_cost: string }>;
  monitoring: Array<{ parameter: string; frequency: string; target: string }>;
  important_interactions: string[];
  patient_counseling: string[];
  evidence_basis: string;
};

const DoseCalculator = () => {
  const [drug, setDrug] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [indication, setIndication] = useState("");
  const [hepatic, setHepatic] = useState("Normal");
  const [pregnancy, setPregnancy] = useState("Not applicable");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DoseResult | null>(null);

  const handleSubmit = async () => {
    if (!drug.trim()) { toast.error("Please enter a drug name"); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("dose-calculator", {
        body: { drug: drug.trim(), age, weight, creatinine, indication, hepatic, pregnancy, notes },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || "Dose calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = result ? (STATUS_STYLE[result.status] ?? STATUS_STYLE["Safe"]) : null;
  const StatusIcon = statusStyle?.icon ?? CheckCircle;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Pill className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-foreground">Dose Calculator</h1>
            <p className="text-[12px] text-muted-foreground">Patient-specific · Renal adjusted · Indian brands</p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            value={drug}
            onChange={e => setDrug(e.target.value)}
            placeholder="Drug name (generic or brand) e.g. Metformin, Amoxicillin..."
            disabled={loading}
            className="text-[14px] h-11"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
          <Input
            value={indication}
            onChange={e => setIndication(e.target.value)}
            placeholder="Indication (e.g. Type 2 diabetes, UTI, hypertension)"
            disabled={loading}
            className="text-[13px]"
          />

          <div className="grid grid-cols-3 gap-2">
            <Input value={age} onChange={e => setAge(e.target.value)} placeholder="Age (yrs)" disabled={loading} className="text-[13px]" />
            <Input value={weight} onChange={e => setWeight(e.target.value)} placeholder="Wt (kg)" disabled={loading} className="text-[13px]" />
            <Input value={creatinine} onChange={e => setCreatinine(e.target.value)} placeholder="Sr.Cr (mg/dL)" disabled={loading} className="text-[13px]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select value={hepatic} onChange={e => setHepatic(e.target.value)} disabled={loading}
              className="h-10 px-3 text-[13px] border border-border rounded-md bg-background text-foreground focus:outline-none">
              <option value="Normal">Hepatic: Normal</option>
              <option value="Mild impairment">Mild impairment</option>
              <option value="Moderate impairment">Moderate impairment</option>
              <option value="Severe impairment (Child-Pugh C)">Severe (Child-Pugh C)</option>
            </select>
            <select value={pregnancy} onChange={e => setPregnancy(e.target.value)} disabled={loading}
              className="h-10 px-3 text-[13px] border border-border rounded-md bg-background text-foreground focus:outline-none">
              <option value="Not applicable">Not pregnant</option>
              <option value="First trimester">1st trimester</option>
              <option value="Second trimester">2nd trimester</option>
              <option value="Third trimester">3rd trimester</option>
              <option value="Lactating">Lactating</option>
            </select>
          </div>

          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Other notes (allergies, comorbidities)" disabled={loading} className="text-[13px]" />

          <button
            onClick={handleSubmit}
            disabled={loading || !drug.trim()}
            className="w-full h-11 bg-primary text-primary-foreground rounded-xl text-[14px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Calculating…</> : "Calculate Dose"}
          </button>
        </div>
      </div>

      {result && statusStyle && (
        <div className="p-6 space-y-5">
          {/* Status badge */}
          <div className={`${statusStyle.bg} ${statusStyle.border} border rounded-xl p-4 flex items-center gap-3`}>
            <StatusIcon className={`h-5 w-5 ${statusStyle.text} shrink-0`} />
            <div>
              <p className={`text-[15px] font-bold ${statusStyle.text}`}>{result.status}</p>
              {result.dose_adjustment && (
                <p className={`text-[13px] ${statusStyle.text} mt-0.5 opacity-80`}>{result.dose_adjustment}</p>
              )}
            </div>
          </div>

          {/* Contraindicated */}
          {result.contraindicated && result.contraindication_reason && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-4">
              <p className="text-[11px] font-bold text-red-700 uppercase tracking-widest mb-1">⛔ Contraindicated</p>
              <p className="text-[14px] text-red-900">{result.contraindication_reason}</p>
            </div>
          )}

          {/* Recommended dose */}
          {!result.contraindicated && result.recommended_dose && (
            <div className="border border-primary/20 bg-primary/5 rounded-xl p-4">
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3">Recommended Dose</p>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Dose</p>
                  <p className="text-[16px] font-bold text-foreground">{result.recommended_dose.dose}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Route</p>
                  <p className="text-[14px] font-semibold text-foreground">{result.recommended_dose.route}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Frequency</p>
                  <p className="text-[14px] font-semibold text-foreground">{result.recommended_dose.frequency}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Timing</p>
                  <p className="text-[14px] text-foreground">{result.recommended_dose.timing}</p>
                </div>
                {result.recommended_dose.duration && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Duration</p>
                    <p className="text-[14px] text-foreground">{result.recommended_dose.duration}</p>
                  </div>
                )}
                {result.recommended_dose.max_daily_dose && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Max Daily</p>
                    <p className="text-[14px] text-foreground">{result.recommended_dose.max_daily_dose}</p>
                  </div>
                )}
              </div>
              {(result.egfr_calculated || result.ckd_stage) && (
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <p className="text-[12px] text-primary">
                    {result.egfr_calculated && `eGFR: ${result.egfr_calculated} mL/min/1.73m²`}
                    {result.ckd_stage && ` · ${result.ckd_stage}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Indian brands */}
          {result.indian_brands?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                🇮🇳 Indian Brands
              </p>
              <div className="space-y-2">
                {result.indian_brands.map((b, i) => (
                  <div key={i} className="flex items-start justify-between border border-border rounded-xl p-3">
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{b.brand}</p>
                      <p className="text-[12px] text-muted-foreground">{b.manufacturer} · {b.available_strength}</p>
                    </div>
                    <span className="text-[13px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg shrink-0 ml-2">
                      {b.approx_cost}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monitoring */}
          {result.monitoring?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Monitoring
              </p>
              <div className="space-y-2">
                {result.monitoring.map((m, i) => (
                  <div key={i} className="flex gap-3 border border-border rounded-xl p-3">
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-foreground">{m.parameter}</p>
                      <p className="text-[12px] text-muted-foreground">{m.frequency}{m.target ? ` · Target: ${m.target}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactions */}
          {result.important_interactions?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Key Interactions
              </p>
              <div className="space-y-1.5">
                {result.important_interactions.map((inter, i) => (
                  <p key={i} className="text-[13px] text-foreground flex gap-2">
                    <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>{inter}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Patient counseling */}
          {result.patient_counseling?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Patient Counseling Points
              </p>
              <div className="space-y-1.5">
                {result.patient_counseling.map((pt, i) => (
                  <p key={i} className="text-[13px] text-foreground flex gap-2">
                    <span className="text-primary shrink-0 mt-0.5">·</span>{pt}
                  </p>
                ))}
              </div>
            </div>
          )}

          {result.evidence_basis && (
            <p className="text-[11px] text-muted-foreground border-t border-border pt-4">
              <strong className="text-foreground/60">Evidence: </strong>{result.evidence_basis}
            </p>
          )}

          <p className="text-[11px] text-muted-foreground text-center pb-2">
            Dose calculator for decision support only. Always verify with current prescribing information.
          </p>
        </div>
      )}
    </div>
  );
};

export default DoseCalculator;
