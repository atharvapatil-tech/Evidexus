import InlineCitations from "@/components/answer/InlineCitations";

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

const SEVERITY_RANK: Record<Check["severity"], number> = {
  Critical: 0,
  High: 1,
  Moderate: 2,
  Low: 3,
  Info: 4,
};

const VerifyRxAnswer = ({ data }: { data: Verification }) => {
  const checks = [...(data.checks ?? [])].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );

  return (
    <article className="prose-clinical animate-fade-up">
      <p className="text-[13px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-2">
        Prescription verification
      </p>
      <h1 className="font-serif text-[32px] md:text-[36px] font-bold leading-[1.15] mb-2 text-foreground">
        {data.overall_verdict}
      </h1>
      <p className="text-[15px] text-muted-foreground italic mb-8">
        {data.confidence} confidence
      </p>

      {data.summary && (
        <>
          <h2>Executive summary</h2>
          <p>{data.summary}</p>
        </>
      )}

      {data.parsed_medications?.length > 0 && (
        <>
          <h2>Parsed medications</h2>
          <ol className="font-mono text-[13px] not-prose space-y-1.5 pl-5 list-decimal">
            {data.parsed_medications.map((m, i) => (
              <li key={i}>
                <span className="font-semibold">{m.name}</span>
                {m.dose && ` · ${m.dose}`}
                {m.route && ` · ${m.route}`}
                {m.frequency && ` · ${m.frequency}`}
                {m.duration && ` · ${m.duration}`}
                {m.indication_assumed && (
                  <div className="text-[12px] italic text-muted-foreground font-sans mt-0.5">
                    Indication assumed: {m.indication_assumed}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      {checks.length > 0 && (
        <>
          <h2>Cross-checks ({checks.length})</h2>
          <div className="not-prose space-y-5">
            {checks.map((c, i) => (
              <div key={i} className="border-t border-border pt-5">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-[11px] uppercase tracking-[0.15em] font-bold text-primary">
                    {c.severity}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                    · {c.category}
                  </span>
                  {c.drugs_involved && c.drugs_involved.length > 0 && (
                    <span className="text-[12px] italic text-muted-foreground">
                      · {c.drugs_involved.join(", ")}
                    </span>
                  )}
                </div>
                <p className="text-[15px] font-medium leading-snug text-foreground">{c.issue}</p>
                <p className="text-[14px] mt-1.5 text-foreground/90">
                  <span className="font-semibold">Action: </span>
                  {c.recommendation}
                </p>
                {c.evidence && (
                  <p className="text-[12px] italic text-muted-foreground mt-1">
                    <InlineCitations text={c.evidence} parseInline />
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {data.suggested_revised_prescription?.length > 0 && (
        <>
          <h2>Suggested revised prescription</h2>
          <ol className="font-mono text-[13px] not-prose space-y-1.5 pl-5 list-decimal">
            {data.suggested_revised_prescription.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </>
      )}

      {data.monitoring_plan?.length > 0 && (
        <>
          <h2>Monitoring plan</h2>
          <ul>
            {data.monitoring_plan.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </>
      )}

      {data.patient_counseling_points?.length > 0 && (
        <>
          <h2>Patient counseling</h2>
          <ul>
            {data.patient_counseling_points.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </>
      )}

      {data.missing_information?.length > 0 && (
        <>
          <h2>Missing information</h2>
          <ul>
            {data.missing_information.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
};

export default VerifyRxAnswer;
