import { useState, useRef, useEffect } from "react";
import { Loader2, Search, ExternalLink, AlertTriangle, ShieldCheck, FileText, Pill, BookOpen, Activity, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryTracker } from "@/hooks/useQueryTracker";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

type Evidence = { title: string; source: string; link: string };

type ClinicalResponse = {
  query: string;
  condition_summary: string;
  first_line_treatment: string[];
  alternatives: string[];
  dosage: string[];
  warnings: string[];
  clinical_reasoning: string;
  evidence: Evidence[];
  confidence: "High" | "Medium" | "Low";
};

const placeholders = [
  "Metformin dose adjustment in CKD stage 3",
  "First line treatment for resistant hypertension",
  "Management of acute gout attack",
  "Empirical therapy for community-acquired pneumonia",
];

const quickPrompts = [
  "Dengue management ICMR guidelines",
  "MDR-TB regimen NTEP India",
  "Empirical antibiotics for sepsis (ICMR AMR)",
  "Snakebite ASV protocol India",
  "Resistant hypertension first line",
];

const confidenceTone: Record<ClinicalResponse["confidence"], string> = {
  High: "bg-emerald-50 text-emerald-900 border-emerald-200",
  Medium: "bg-amber-50 text-amber-900 border-amber-200",
  Low: "bg-rose-50 text-rose-900 border-rose-200",
};

const ClinicalChat = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClinicalResponse | null>(null);
  const [indiaContext, setIndiaContext] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("evidexus.indiaContext") === "true";
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { checkLimit, logQuery } = useQueryTracker();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem("evidexus.indiaContext", String(indiaContext));
  }, [indiaContext]);

  const runQuery = async (text?: string) => {
    const q = (text ?? query).trim();
    if (!q) return;

    const allowed = await checkLimit();
    if (!allowed) return;

    setQuery(q);
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("clinical-chat", {
        body: { query: q, indiaContext },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as ClinicalResponse);
      await logQuery("clinical_chat", q, data);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Failed to retrieve clinical evidence.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runQuery();
    }
  };

  const reset = () => {
    setResult(null);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24">
      <div className="max-w-3xl w-full mx-auto px-5 pt-8">
        {/* Header / Search */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground italic leading-tight mb-2">
            Clinical Evidence Engine
          </h1>
          <p className="text-sm text-muted-foreground italic">
            Structured, evidence-backed answers for clinical decisions.
          </p>
        </div>

        {/* Search input */}
        <div className="border border-border bg-card shadow-sm">
          <div className="flex items-start gap-3 p-4">
            <Search className="h-5 w-5 text-muted-foreground mt-2 shrink-0" />
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholders[0]}
              className="flex-1 resize-none bg-transparent text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[44px] max-h-[140px]"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <div className="border-t border-border p-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIndiaContext((v) => !v)}
              aria-pressed={indiaContext}
              title="Prefer Indian guidelines (ICMR, NTEP, NACO, NCDC, MoHFW)"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] uppercase tracking-[0.15em] font-bold transition-colors ${
                indiaContext
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <MapPin className="h-3 w-3" />
              India context
            </button>
            <Button
              onClick={() => runQuery()}
              disabled={!query.trim() || isLoading}
              className="h-9 px-5 bg-primary text-primary-foreground font-semibold tracking-wider uppercase text-xs hover:bg-primary/90"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search Evidence"}
            </Button>
          </div>
        </div>

        {/* Quick prompts */}
        {!result && !isLoading && (
          <div className="mt-5 flex flex-wrap gap-2">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => runQuery(p)}
                className="text-xs px-3 py-1.5 border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="mt-10 flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm italic text-muted-foreground">Retrieving and structuring clinical evidence…</p>
          </div>
        )}

        {/* Result */}
        {result && !isLoading && (
          <div className="mt-8 space-y-5 animate-card-in">
            {/* Query echo + confidence */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1">Query</p>
                <p className="text-base font-medium text-foreground">{result.query}</p>
              </div>
              <div className={`shrink-0 border px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold ${confidenceTone[result.confidence]}`}>
                {result.confidence} Confidence
              </div>
            </div>

            {/* Condition Summary */}
            <Section icon={<FileText className="h-4 w-4" />} title="Condition Summary">
              <p className="text-sm leading-relaxed text-foreground">{result.condition_summary}</p>
            </Section>

            {/* First-line Treatment */}
            <Section icon={<Activity className="h-4 w-4" />} title="First-line Treatment">
              <BulletList items={result.first_line_treatment} emptyText="No first-line therapy identified." />
            </Section>

            {/* Alternatives */}
            <Section icon={<Pill className="h-4 w-4" />} title="Alternatives">
              <BulletList items={result.alternatives} emptyText="No alternatives listed." />
            </Section>

            {/* Dosage */}
            <Section icon={<Pill className="h-4 w-4" />} title="Dosage">
              <BulletList items={result.dosage} emptyText="Dosage not specified." mono />
            </Section>

            {/* Warnings */}
            <Section icon={<AlertTriangle className="h-4 w-4 text-amber-700" />} title="Warnings & Contraindications">
              {result.warnings.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">No specific warnings identified.</p>
              ) : (
                <ul className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-2 bg-amber-50/60 border border-amber-200 px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-700 mt-0.5 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Clinical Reasoning */}
            <Section icon={<BookOpen className="h-4 w-4" />} title="Clinical Reasoning">
              <p className="text-sm italic leading-relaxed text-foreground border-l-2 border-primary pl-4">
                {result.clinical_reasoning}
              </p>
            </Section>

            {/* Evidence */}
            <Section icon={<BookOpen className="h-4 w-4" />} title="Evidence">
              {result.evidence.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">No supporting references retrieved.</p>
              ) : (
                <ol className="space-y-3">
                  {result.evidence.map((ev, i) => (
                    <li key={i} className="border-l-2 border-border pl-4">
                      <p className="text-sm font-medium text-foreground leading-snug">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{ev.source}</span>
                        {ev.link && (
                          <a
                            href={ev.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            View source <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Section>

            {/* Verified badge */}
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 text-xs">
              <ShieldCheck className="h-4 w-4" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px]">Structured Clinical Output</p>
                <p className="text-primary-foreground/70 text-[10px]">Generated with low-temperature, evidence-anchored reasoning</p>
              </div>
            </div>

            <MedicalDisclaimer compact />

            <div className="pt-2">
              <Button variant="outline" onClick={reset} className="w-full h-10 text-xs uppercase tracking-wider">
                New Query
              </Button>
            </div>
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
      <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-foreground">{title}</h2>
    </div>
    {children}
  </section>
);

const BulletList = ({ items, emptyText, mono }: { items: string[]; emptyText: string; mono?: boolean }) => {
  if (items.length === 0) return <p className="text-sm italic text-muted-foreground">{emptyText}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className={`text-sm text-foreground flex gap-2 ${mono ? "font-mono" : ""}`}>
          <span className="text-primary font-bold">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

export default ClinicalChat;
