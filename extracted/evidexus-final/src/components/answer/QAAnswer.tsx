import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, Shield, Info, BookOpen, ExternalLink } from "lucide-react";

type Source = {
  title: string; authors?: string; journal?: string;
  year?: number | string; pmid?: string; url?: string;
  evidenceLevel?: string; studyType?: string;
};

type ClinicalResponse = {
  query?: string;
  clinical_summary: string;
  first_line_treatment: string;
  alternatives: string[];
  dosage: string;
  contraindications: string[];
  clinical_reasoning: string;
  india_context: string;
  evidence_note: string;
  evidence_level?: string;
  confidence: "High" | "Moderate" | "Low";
  sources?: Source[];
};

const CONFIDENCE_STYLE: Record<string, string> = {
  High: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Moderate: "bg-amber-100 text-amber-800 border-amber-300",
  Low: "bg-red-100 text-red-800 border-red-300",
};

const OXFORD_COLOR: Record<string, string> = {
  "I": "bg-emerald-100 text-emerald-800",
  "II": "bg-blue-100 text-blue-800",
  "III": "bg-yellow-100 text-yellow-800",
  "IV": "bg-orange-100 text-orange-800",
  "V": "bg-gray-100 text-gray-600",
};

const QAAnswer = ({ data }: { data: ClinicalResponse }) => {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const sources = data.sources ?? [];

  return (
    <article className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-2">
          Clinical Decision Support
        </p>
        {data.query && (
          <h1 className="text-[24px] md:text-[28px] font-bold leading-[1.2] mb-3 text-foreground">
            {data.query}
          </h1>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border ${CONFIDENCE_STYLE[data.confidence] ?? CONFIDENCE_STYLE.Low}`}>
            <Shield className="w-3 h-3" />
            {data.confidence} confidence
          </span>
          {data.evidence_level && (
            <span className="text-[11px] text-muted-foreground">
              {data.evidence_level}
            </span>
          )}
        </div>
      </div>

      {/* Clinical Summary */}
      <p className="text-[15px] leading-[1.7] text-foreground">
        {data.clinical_summary}
      </p>

      {/* First-line Treatment */}
      <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-4">
        <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-primary mb-1.5">
          First-line Treatment
        </p>
        <p className="text-[15px] text-foreground leading-relaxed">
          {data.first_line_treatment}
        </p>
      </div>

      {/* Dosage */}
      {data.dosage && data.dosage !== "Not available" && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground mb-2">
            Dosage
          </p>
          <div className="bg-muted/40 rounded-lg px-4 py-3 text-[14px] text-foreground leading-relaxed">
            {data.dosage}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {data.alternatives?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground mb-2">
            Alternatives
          </p>
          <div className="space-y-2">
            {data.alternatives.map((alt, i) => (
              <div key={i} className="flex gap-2 text-[14px] text-foreground leading-relaxed">
                <span className="text-muted-foreground mt-1 shrink-0">·</span>
                <span>{alt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contraindications */}
      {data.contraindications?.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-destructive mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Contraindications & Warnings
          </p>
          <div className="space-y-1.5">
            {data.contraindications.map((c, i) => (
              <div key={i} className="flex gap-2 text-[14px] text-destructive/90 leading-relaxed">
                <span className="mt-1 shrink-0">·</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* India Context */}
      {data.india_context && data.india_context !== "Not available for this query." && data.india_context !== "Not available." && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-violet-700 mb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            India Context
          </p>
          <p className="text-[14px] text-violet-900/80 leading-relaxed">
            {data.india_context}
          </p>
        </div>
      )}

      {/* Clinical Reasoning — expandable */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setReasoningOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:bg-muted/40 transition-colors"
        >
          Clinical Reasoning
          {reasoningOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {reasoningOpen && (
          <div className="px-4 pb-4 pt-3 text-[14px] leading-[1.75] text-foreground border-t border-border">
            {data.clinical_reasoning}
          </div>
        )}
      </div>

      {/* Evidence Note */}
      {data.evidence_note && (
        <p className="text-[12px] text-muted-foreground border-t border-border pt-4 leading-relaxed">
          <strong className="text-foreground/70 not-italic font-semibold">Evidence: </strong>
          {data.evidence_note}
        </p>
      )}

      {/* SOURCES — real PubMed articles */}
      {sources.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setSourcesOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Sources — {sources.length} PubMed articles
              </span>
            </div>
            {sourcesOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {sourcesOpen && (
            <div className="border-t border-border divide-y divide-border">
              {sources.map((s, i) => (
                <div key={s.pmid ?? i} className="px-4 py-3">
                  <div className="flex gap-3">
                    <span className="text-[11px] font-bold text-muted-foreground shrink-0 mt-0.5 w-5">
                      [{i + 1}]
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1.5 items-center">
                        {s.evidenceLevel && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${OXFORD_COLOR[s.evidenceLevel] ?? "bg-gray-100 text-gray-600"}`}>
                            Level {s.evidenceLevel}
                          </span>
                        )}
                        {s.studyType && (
                          <span className="text-[10px] text-muted-foreground">{s.studyType}</span>
                        )}
                        {s.year && (
                          <span className="text-[10px] text-muted-foreground">{s.year}</span>
                        )}
                      </div>
                      <p className="text-[13px] font-medium text-foreground leading-snug mb-1">
                        {s.title}
                      </p>
                      {(s.authors || s.journal) && (
                        <p className="text-[12px] text-muted-foreground mb-1.5">
                          {s.authors}{s.authors && s.journal ? " · " : ""}{s.journal}
                        </p>
                      )}
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline font-medium"
                        >
                          View on PubMed <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default QAAnswer;
