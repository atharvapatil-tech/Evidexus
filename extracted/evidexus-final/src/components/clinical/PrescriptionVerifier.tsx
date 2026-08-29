import { useState } from "react";
import { Loader2, ShieldCheck, AlertTriangle, ClipboardList, FileCheck, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryTracker } from "@/hooks/useQueryTracker";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

type Med = {
  name?: string;
  dose?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  indication_assumed?: string;
};

type Check = {
  category: string;
  severity: "Critical" | "High" | "Moderate" | "Low" | "Info";
  drugs_involved?: string[];
  issue: string;
  recommendation: string;
  evidence?: string;
};

type Verification = {
  overall_verdict: string;
  overall_score: string;
  summary: string;
  parsed_medications: Med[];
  checks: Check[];
  missing_information: string[];
  suggested_revised_prescription: string[];
  monitoring_plan: string[];
  patient_counseling_points: string[];
  confidence: "High" | "Medium" | "Low";
};

const verdictTone: Record<string, string> = {
  "Safe to dispense": "bg-emerald-50 text-emerald-900 border-emerald-200",
  "Needs minor revision": "bg-amber-50 text-amber-900 border-amber-200",
  "Needs major revision": "bg-orange-50 text-orange-900 border-orange-200",
  "Do NOT dispense": "bg-rose-50 text-rose-900 border-rose-200",
};

const severityTone: Record<Check["severity"], string> = {
  Critical: "bg-rose-50 text-rose-900 border-rose-300",
  High: "bg-orange-50 text-orange-900 border-orange-300",
  Moderate: "bg-amber-50 text-amber-900 border-amber-200",
  Low: "bg-sky-50 text-sky-900 border-sky-200",
  Info: "bg-muted text-foreground border-border",
};

const examplePrescription = `1. Tab. Amoxicillin-Clavulanate 625 mg PO TID x 7 days
2. Tab. Diclofenac 50 mg PO BID x 5 days
3. Tab. Pantoprazole 40 mg PO OD x 7 days`;

const exampleContext = `45F, 62 kg, eGFR 38 mL/min/1.73m² (CKD3b), hypertension on amlodipine 5 mg OD, no known drug allergy. Indication: dental abscess.`;

const PrescriptionVerifier = () => {
  const [prescription, setPrescription] = useState("");
  const [patientContext, setPatientContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Verification | null>(null);
  const { checkLimit, logQuery } = useQueryTracker();

  const handleVerify = async () => {
    if (!prescription.trim()) {
      toast.error("Paste a prescription to verify.");
      return;
    }
    const allowed = await checkLimit();
    if (!allowed) return;

    setIsLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("prescription-verifier", {
        body: { prescription: prescription.trim(), patientContext: patientContext.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as Verification);
      await logQuery("content_analysis", `Rx verify: ${prescription.trim().slice(0, 80)}`, data);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = () => {
    setPrescription(examplePrescription);
    setPatientContext(exampleContext);
  };

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="px-5 py-8 max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground italic leading-tight mb-2 flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          Prescription Verifier
        </h1>
        <p className="text-sm text-muted-foreground italic mb-6">
          Cross-check your prescription from every clinical perspective — dose, interactions, renal/hepatic adjustment, contraindications, stewardship, India context.
        </p>

        {/* Inputs */}
        <div className="space-y-3 mb-3">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-1.5 block">
              Prescription
            </label>
            <textarea
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder={"e.g.\n1. Tab. Amoxicillin 500 mg PO TID x 5 days\n2. Tab. Ibuprofen 400 mg PO BID x 3 days"}
              className="w-full min-h-[140px] border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-y"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-1.5 block">
              Patient context (optional)
            </label>
            <textarea
              value={patientContext}
              onChange={(e) => setPatientContext(e.target.value)}
              placeholder="age, sex, weight, eGFR, comorbidities, current meds, allergies, indication, pregnancy status…"
              className="w-full min-h-[80px] border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-y"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Button
            onClick={handleVerify}
            disabled={isLoading || !prescription.trim()}
            className="flex-1 h-12 bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm"
          >
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…</> : "Verify Prescription"}
          </Button>
          <button
            onClick={loadExample}
            className="text-xs px-3 h-12 border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            Try example
          </button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center gap-2 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-xs italic text-muted-foreground">Cross-checking against guidelines, interactions, organ function…</p>
          </div>
        )}

        {result && !isLoading && (
          <div className="space-y-5 animate-card-in">
            {/* Verdict banner */}
            <div className={`border p-5 ${verdictTone[result.overall_verdict] ?? "bg-muted border-border"}`}>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Verdict</span>
                <span className="text-[10px] uppercase tracking-wider font-bold">
                  {result.confidence} confidence
                </span>
              </div>
              <h2 className="font-serif text-xl md:text-2xl font-bold leading-tight mb-1">
                {result.overall_verdict}
              </h2>
              <p className="text-sm leading-relaxed">{result.summary}</p>
            </div>

            {/* Parsed medications */}
            {result.parsed_medications?.length > 0 && (
              <Section icon={<Pill className="h-4 w-4" />} title="Parsed Medications">
                <ul className="space-y-2">
                  {result.parsed_medications.map((m, i) => (
                    <li key={i} className="text-sm text-foreground border-l-2 border-border pl-3">
                      <span className="font-semibold">{m.name}</span>
                      {m.dose && <> · {m.dose}</>}
                      {m.route && <> · {m.route}</>}
                      {m.frequency && <> · {m.frequency}</>}
                      {m.duration && <> · {m.duration}</>}
                      {m.indication_assumed && (
                        <div className="text-xs italic text-muted-foreground mt-0.5">
                          Indication assumed: {m.indication_assumed}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Checks */}
            <Section icon={<AlertTriangle className="h-4 w-4 text-amber-700" />} title={`Cross-checks (${result.checks?.length ?? 0})`}>
              {result.checks?.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">No issues identified.</p>
              ) : (
                <ul className="space-y-2.5">
                  {result.checks.map((c, i) => (
                    <li key={i} className={`border p-3 ${severityTone[c.severity] ?? severityTone.Info}`}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-background/60 border">
                          {c.severity}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-bold">{c.category}</span>
                        {c.drugs_involved && c.drugs_involved.length > 0 && (
                          <span className="text-[10px] italic">· {c.drugs_involved.join(", ")}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-snug">{c.issue}</p>
                      <p className="text-sm mt-1.5"><span className="font-semibold">Action:</span> {c.recommendation}</p>
                      {c.evidence && (
                        <p className="text-[11px] italic mt-1 opacity-80">Source: {c.evidence}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Missing info */}
            {result.missing_information?.length > 0 && (
              <Section icon={<ClipboardList className="h-4 w-4" />} title="Missing information">
                <BulletList items={result.missing_information} />
              </Section>
            )}

            {/* Revised prescription */}
            {result.suggested_revised_prescription?.length > 0 && (
              <Section icon={<FileCheck className="h-4 w-4" />} title="Suggested revised prescription">
                <ol className="space-y-1.5 list-decimal list-inside">
                  {result.suggested_revised_prescription.map((line, i) => (
                    <li key={i} className="text-sm font-mono text-foreground">{line}</li>
                  ))}
                </ol>
              </Section>
            )}

            {/* Monitoring */}
            {result.monitoring_plan?.length > 0 && (
              <Section icon={<ClipboardList className="h-4 w-4" />} title="Monitoring plan">
                <BulletList items={result.monitoring_plan} />
              </Section>
            )}

            {/* Counseling */}
            {result.patient_counseling_points?.length > 0 && (
              <Section icon={<ClipboardList className="h-4 w-4" />} title="Patient counseling">
                <BulletList items={result.patient_counseling_points} />
              </Section>
            )}

            <MedicalDisclaimer />
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <section className="border border-border bg-card p-5">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-primary">{icon}</span>
      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-foreground">{title}</h3>
    </div>
    {children}
  </section>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5">
    {items.map((it, i) => (
      <li key={i} className="text-sm text-foreground flex gap-2">
        <span className="text-primary font-bold">·</span>
        <span>{it}</span>
      </li>
    ))}
  </ul>
);

export default PrescriptionVerifier;
