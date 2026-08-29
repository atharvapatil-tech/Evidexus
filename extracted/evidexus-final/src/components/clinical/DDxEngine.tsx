import { useState } from "react";
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PROB_COLOR: Record<string, string> = {
  High: "bg-red-100 text-red-800 border-red-200",
  Moderate: "bg-amber-100 text-amber-800 border-amber-200",
  Low: "bg-green-100 text-green-800 border-green-200",
};

const PRIORITY_COLOR: Record<string, string> = {
  Immediate: "text-red-600 font-bold",
  Urgent: "text-amber-600 font-semibold",
  Routine: "text-green-700",
};

type DDxResult = {
  symptoms: string;
  patient: { age: string; sex: string; duration: string; context: string };
  most_likely: Array<{
    rank: number; diagnosis: string; probability: string;
    percentage: number; reasoning: string;
    supporting_features: string[]; against: string[];
    india_relevance: string;
  }>;
  must_not_miss: Array<{
    diagnosis: string; why_critical: string; red_flag_present: boolean;
  }>;
  recommended_workup: Array<{
    test: string; rationale: string; priority: string;
    cost_in_india: string; available_district_level: boolean;
  }>;
  red_flags: string[];
  clinical_pearl: string;
  refer_if: string;
};

const DDxEngine = () => {
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [duration, setDuration] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DDxResult | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);

  const handleSubmit = async () => {
    if (!symptoms.trim() || symptoms.trim().length < 3) {
      toast.error("Please describe the patient's symptoms");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ddx-engine", {
        body: { symptoms: symptoms.trim(), age, sex, duration, context },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      setExpanded(0);
    } catch (e: any) {
      toast.error(e.message || "DDx generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-foreground">Differential Diagnosis</h1>
            <p className="text-[12px] text-muted-foreground">India-specific · Ranked by probability</p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder="Describe symptoms — e.g. fever 5 days, joint pain, rash, thrombocytopenia..."
            rows={3}
            disabled={loading}
            className="w-full px-4 py-3 text-[14px] border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input value={age} onChange={e => setAge(e.target.value)} placeholder="Age (years)" disabled={loading} className="text-[13px]" />
            <select value={sex} onChange={e => setSex(e.target.value)} disabled={loading}
              className="h-10 px-3 text-[13px] border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (e.g. 5 days)" disabled={loading} className="text-[13px]" />
            <Input value={context} onChange={e => setContext(e.target.value)} placeholder="Context (rural/urban, travel)" disabled={loading} className="text-[13px]" />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || symptoms.trim().length < 3}
            className="w-full h-11 bg-primary text-primary-foreground rounded-xl text-[14px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating differential…</> : "Generate DDx"}
          </button>
        </div>
      </div>

      {result && (
        <div className="p-6 space-y-6">
          {/* Red flags */}
          {result.red_flags?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-red-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Red Flags Present
              </p>
              <div className="space-y-1">
                {result.red_flags.map((r, i) => (
                  <p key={i} className="text-[13px] text-red-800 flex gap-2">
                    <span className="shrink-0 mt-0.5">·</span><span>{r}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Differential list */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Ranked Differentials
            </p>
            <div className="space-y-2">
              {result.most_likely?.map((dx, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-[13px] font-bold text-muted-foreground w-6 shrink-0">
                      {dx.rank}.
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-semibold text-foreground">{dx.diagnosis}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${PROB_COLOR[dx.probability] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {dx.probability} · {dx.percentage}%
                        </span>
                      </div>
                    </div>
                    {expanded === i ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>

                  {expanded === i && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      <p className="text-[14px] text-foreground leading-relaxed">{dx.reasoning}</p>

                      {dx.india_relevance && (
                        <p className="text-[13px] text-violet-800 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                          🇮🇳 {dx.india_relevance}
                        </p>
                      )}

                      {dx.supporting_features?.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-green-700 uppercase tracking-wide mb-1">Supporting</p>
                          <div className="flex flex-wrap gap-1.5">
                            {dx.supporting_features.map((f, j) => (
                              <span key={j} className="text-[12px] bg-green-50 text-green-800 border border-green-200 rounded-full px-2.5 py-0.5">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {dx.against?.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide mb-1">Against</p>
                          <div className="flex flex-wrap gap-1.5">
                            {dx.against.map((f, j) => (
                              <span key={j} className="text-[12px] bg-red-50 text-red-800 border border-red-200 rounded-full px-2.5 py-0.5">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Must not miss */}
          {result.must_not_miss?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Must Not Miss
              </p>
              <div className="space-y-2">
                {result.must_not_miss.map((m, i) => (
                  <div key={i} className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                    <p className="text-[14px] font-semibold text-amber-900 mb-1">{m.diagnosis}</p>
                    <p className="text-[13px] text-amber-800">{m.why_critical}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workup */}
          {result.recommended_workup?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Recommended Workup
              </p>
              <div className="space-y-2">
                {result.recommended_workup.map((w, i) => (
                  <div key={i} className="flex gap-3 border border-border rounded-xl p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-semibold text-foreground">{w.test}</span>
                        <span className={`text-[11px] ${PRIORITY_COLOR[w.priority] ?? ""}`}>{w.priority}</span>
                      </div>
                      <p className="text-[12px] text-muted-foreground">{w.rationale}</p>
                      {w.cost_in_india && (
                        <p className="text-[11px] text-muted-foreground mt-1">Cost: {w.cost_in_india} · {w.available_district_level ? "✓ District hospital" : "May need referral"}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Pearl */}
          {result.clinical_pearl && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Clinical Pearl</p>
              <p className="text-[14px] text-foreground leading-relaxed">{result.clinical_pearl}</p>
            </div>
          )}

          {/* Refer if */}
          {result.refer_if && (
            <div className="bg-muted/40 border border-border rounded-xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Refer If</p>
              <p className="text-[14px] text-foreground leading-relaxed">{result.refer_if}</p>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground text-center pb-2">
            Decision support only. Clinical judgment always takes precedence.
          </p>
        </div>
      )}
    </div>
  );
};

export default DDxEngine;
