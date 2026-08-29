import { ExternalLink } from "lucide-react";
import SourcesList, { type Source } from "@/components/answer/SourcesList";

type LiteratureResult = {
  title: string;
  authors: string;
  journal: string;
  year: number;
  type: string;
  source: string;
  abstract: string;
  evidenceLevel: string;
  pmid: string | null;
};

type SearchResults = {
  query: string;
  totalResults: number;
  results: LiteratureResult[];
  summary: string;
};

const LiteratureAnswer = ({ data }: { data: SearchResults }) => {
  const sources: Source[] = data.results.map((r) => ({
    title: r.title,
    source: r.journal,
    authors: r.authors,
    year: r.year,
    link: r.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/` : undefined,
  }));

  return (
    <article className="prose-clinical animate-fade-up">
      <p className="text-[13px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-2">
        Literature search
      </p>
      <h1 className="font-serif text-[32px] md:text-[36px] font-bold leading-[1.15] mb-2 text-foreground">
        {data.query}
      </h1>
      <p className="text-[15px] text-muted-foreground italic mb-8">
        {data.totalResults} peer-reviewed result{data.totalResults === 1 ? "" : "s"} from PubMed
      </p>

      {data.summary && (
        <>
          <h2>Evidence synthesis</h2>
          <p>{data.summary}</p>
        </>
      )}

      <h2>Studies</h2>
      <ol className="space-y-5 not-prose">
        {data.results.map((r, i) => {
          const n = i + 1;
          return (
            <li key={n} className="border-t border-border pt-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-primary">
                  {r.type}
                </span>
                {r.evidenceLevel && (
                  <span className="text-[11px] text-muted-foreground">· Level {r.evidenceLevel}</span>
                )}
                <span className="text-[11px] text-muted-foreground">· {r.year}</span>
              </div>
              <h3 className="font-serif text-[18px] leading-snug font-bold mb-1.5 text-foreground">
                <a
                  href={`#cite-${n}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`cite-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="hover:text-primary transition-colors"
                >
                  {r.title}
                </a>
              </h3>
              <p className="text-[12px] italic text-muted-foreground mb-2">
                {r.authors} — {r.journal}
              </p>
              <p className="text-[14px] leading-relaxed text-foreground/90">{r.abstract}</p>
              {r.pmid && (
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
                >
                  PubMed <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </li>
          );
        })}
      </ol>

      <SourcesList sources={sources} />
    </article>
  );
};

export default LiteratureAnswer;
