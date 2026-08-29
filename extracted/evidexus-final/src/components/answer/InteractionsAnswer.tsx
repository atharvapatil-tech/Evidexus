import InlineCitations from "@/components/answer/InlineCitations";
import SourcesList, { type Source } from "@/components/answer/SourcesList";

type Interaction = {
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
};

const SEVERITY_LABEL: Record<string, string> = {
  Major: "Major",
  Moderate: "Moderate",
  Minor: "Minor",
  "None Known": "None known",
};

const InteractionsAnswer = ({ data }: { data: Interaction }) => {
  const sources: Source[] = (data.references ?? []).map((r) => ({ title: r }));
  const cites = sources.map((_, i) => i + 1);

  return (
    <article className="prose-clinical animate-fade-up">
      <p className="text-[13px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-2">
        Interaction check{data.interactionType ? ` · ${data.interactionType}` : ""}
      </p>
      <h1 className="font-serif text-[32px] md:text-[36px] font-bold leading-[1.15] mb-3 text-foreground">
        {data.itemA} <span className="italic text-muted-foreground">+</span> {data.itemB}
      </h1>

      {/* Severity strip — minimal, hairline only */}
      <div className="flex items-center gap-3 pb-6 mb-2 border-b border-border">
        <span className="eyebrow">Severity</span>
        <span className="font-serif text-[18px] font-bold text-foreground">
          {SEVERITY_LABEL[data.severity] ?? data.severity}
        </span>
        {data.evidenceLevel && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-[13px] text-muted-foreground">
              Evidence: {data.evidenceLevel}
            </span>
          </>
        )}
        {data.onsetTiming && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-[13px] text-muted-foreground">Onset: {data.onsetTiming}</span>
          </>
        )}
      </div>

      {data.summary && (
        <>
          <h2>Summary</h2>
          <InlineCitations as="p" text={data.summary} />
        </>
      )}

      {data.mechanism && (
        <>
          <h2>Mechanism</h2>
          <InlineCitations as="p" text={data.mechanism} citationsAfter={cites.slice(0, 2)} />
        </>
      )}

      {data.clinicalSignificance && (
        <>
          <h2>Clinical significance</h2>
          <p>{data.clinicalSignificance}</p>
        </>
      )}

      {data.management && (
        <>
          <h2>Management</h2>
          <InlineCitations as="p" text={data.management} citationsAfter={cites.slice(0, 1)} />
        </>
      )}

      {data.monitoring?.length > 0 && (
        <>
          <h2>Monitoring</h2>
          <ul>
            {data.monitoring.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </>
      )}

      {data.alternatives?.length > 0 && (
        <>
          <h2>Alternatives to consider</h2>
          <ul>
            {data.alternatives.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </>
      )}

      <SourcesList sources={sources} />
    </article>
  );
};

export default InteractionsAnswer;
