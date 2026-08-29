import { ExternalLink } from "lucide-react";

export type Source = {
  title: string;
  source?: string; // journal / guideline body
  authors?: string;
  year?: number | string;
  link?: string;
};

type Props = { sources: Source[] };

const SourcesList = ({ sources }: Props) => {
  if (!sources || sources.length === 0) return null;
  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h3 className="font-serif text-[20px] font-bold mb-5">Sources</h3>
      <ol className="space-y-4">
        {sources.map((s, i) => {
          const n = i + 1;
          return (
            <li
              key={n}
              id={`cite-${n}`}
              className="flex gap-3 transition-shadow rounded-md p-2 -mx-2"
            >
              <span className="shrink-0 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-[11px] font-semibold text-primary bg-[hsl(var(--primary-soft))] rounded-full">
                {n}
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-medium leading-snug text-foreground">{s.title}</p>
                <div className="mt-0.5 text-[12px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  {s.source && <span className="italic">{s.source}</span>}
                  {s.authors && <span>· {s.authors}</span>}
                  {s.year && <span>· {s.year}</span>}
                  {s.link && (
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5 ml-1"
                    >
                      view <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default SourcesList;
