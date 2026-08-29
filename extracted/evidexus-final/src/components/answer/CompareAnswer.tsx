import InlineCitations from "@/components/answer/InlineCitations";
import SourcesList, { type Source } from "@/components/answer/SourcesList";

type TreatmentData = {
  name: string;
  category: string;
  evidenceLevel: string;
  efficacy: number;
  safetyProfile: string;
  pros: string[];
  cons: string[];
  guidelineRecommendation: string;
  commonDosing: string;
  contraindications: string[];
  costCategory: string;
};

type ComparisonResult = {
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
};

const Row = ({ label, a, b }: { label: string; a: React.ReactNode; b: React.ReactNode }) => (
  <div className="grid grid-cols-[120px_1fr_1fr] md:grid-cols-[160px_1fr_1fr] gap-4 py-4 border-t border-border text-[14px]">
    <div className="eyebrow self-start pt-0.5">{label}</div>
    <div className="text-foreground leading-relaxed">{a}</div>
    <div className="text-foreground leading-relaxed">{b}</div>
  </div>
);

const CompareAnswer = ({ data }: { data: ComparisonResult }) => {
  const a = data.treatmentA;
  const b = data.treatmentB;
  const sources: Source[] = (data.guidelines ?? []).map((g) => ({ title: g }));
  const cites = sources.map((_, i) => i + 1);

  return (
    <article className="prose-clinical animate-fade-up">
      <p className="text-[13px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-2">
        Treatment comparison
      </p>
      <h1 className="font-serif text-[32px] md:text-[36px] font-bold leading-[1.15] mb-8 text-foreground">
        {a.name} <span className="italic text-muted-foreground">vs</span> {b.name}
      </h1>

      <h2>Clinical context</h2>
      <InlineCitations as="p" text={data.clinicalContext} citationsAfter={cites.slice(0, 2)} />

      <h2>Comparison matrix</h2>
      <div className="not-prose">
        <div className="grid grid-cols-[120px_1fr_1fr] md:grid-cols-[160px_1fr_1fr] gap-4 pb-3">
          <div></div>
          <div className="font-serif text-[16px] font-bold">{a.name}</div>
          <div className="font-serif text-[16px] font-bold">{b.name}</div>
        </div>
        <Row label="Mechanism" a={a.category} b={b.category} />
        <Row label="Efficacy" a={`${a.efficacy}%`} b={`${b.efficacy}%`} />
        <Row label="Safety" a={a.safetyProfile} b={b.safetyProfile} />
        <Row label="Guideline" a={a.guidelineRecommendation} b={b.guidelineRecommendation} />
        <Row label="Cost" a={a.costCategory} b={b.costCategory} />
        <Row
          label="Pros"
          a={<ul className="space-y-1">{a.pros?.map((p, i) => <li key={i}>· {p}</li>)}</ul>}
          b={<ul className="space-y-1">{b.pros?.map((p, i) => <li key={i}>· {p}</li>)}</ul>}
        />
        <Row
          label="Cons"
          a={<ul className="space-y-1">{a.cons?.map((p, i) => <li key={i}>· {p}</li>)}</ul>}
          b={<ul className="space-y-1">{b.cons?.map((p, i) => <li key={i}>· {p}</li>)}</ul>}
        />
      </div>

      <h2>Head-to-head</h2>
      <p>
        <strong>Superiority data:</strong> {data.headToHead.superiorityData}
      </p>
      <p>
        <strong>Preferred in:</strong> {data.headToHead.preferredIn}
      </p>
      {data.headToHead.keyDifferences?.length > 0 && (
        <>
          <h3>Key differences</h3>
          <ul>
            {data.headToHead.keyDifferences.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </>
      )}

      <SourcesList sources={sources} />
    </article>
  );
};

export default CompareAnswer;
