import { useState } from "react";
import { Search, Loader2, ExternalLink, Filter, SlidersHorizontal, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryTracker } from "@/hooks/useQueryTracker";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

interface LiteratureResult {
  title: string;
  authors: string;
  journal: string;
  year: number;
  type: string;
  source: string;
  abstract: string;
  evidenceLevel: string;
  sampleSize: string;
  keyFindings: string;
  pmid: string | null;
  relevanceScore: number;
}

interface SearchResults {
  query: string;
  totalResults: number;
  results: LiteratureResult[];
  summary: string;
}

const trendingTopics = ["GLP-1 AGONISTS", "CAR T CELL THERAPY", "AMYLOID BETA"];

const LiteratureSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const { checkLimit, logQuery } = useQueryTracker();

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 3) {
      toast.error("Enter at least 3 characters to search");
      return;
    }

    const allowed = await checkLimit();
    if (!allowed) return;

    setIsLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/literature-search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ query: query.trim() }),
        }
      );

      if (resp.status === 429) { toast.error("Rate limited."); return; }
      if (resp.status === 402) { toast.error("Service unavailable."); return; }

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Search failed");

      setResults(data);
      await logQuery("literature_search", query.trim(), { totalResults: data.totalResults });
    } catch (e) {
      console.error(e);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResults = results?.results?.filter((r) =>
    filterType === "all" ? true : r.type === filterType
  );

  const studyTypes = results?.results
    ? [...new Set(results.results.map((r) => r.type))]
    : [];

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="px-5 py-8 max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight mb-2">
          Literature Repository
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Search through peer-reviewed journals, clinical trials, and systemic reviews with AI-powered synthesis.
        </p>

        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter clinical keywords..."
              className="pl-10 h-11 border-border"
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading} className="h-11 px-6 bg-primary text-primary-foreground font-semibold uppercase text-xs tracking-wider">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "SEARCH"}
          </Button>
        </div>

        {/* Trending */}
        <div className="flex items-center gap-3 mb-8 text-[10px]">
          <span className="label-text">TRENDING:</span>
          {trendingTopics.map((t) => (
            <button
              key={t}
              onClick={() => setQuery(t.toLowerCase())}
              className="font-semibold text-foreground uppercase tracking-wider hover:text-primary transition-colors"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Results */}
        {results && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="label-text mb-0.5">
                  SHOWING {filteredResults?.length || 0} RESULTS FOR
                </p>
                <p className="text-sm font-semibold text-foreground">"{results.query}"</p>
              </div>
              <div className="flex items-center gap-3">
                {studyTypes.length > 1 && (
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Filter className="h-3.5 w-3.5" /> FILTER
                  </button>
                )}
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> SORT
                </button>
              </div>
            </div>

            {/* Filter chips */}
            {studyTypes.length > 1 && (
              <div className="flex items-center gap-2 mb-6 overflow-x-auto">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors border ${
                    filterType === "all" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  All
                </button>
                {studyTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border ${
                      filterType === type ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {/* Result cards */}
            <div className="space-y-6">
              {filteredResults?.map((result, i) => (
                <article key={i} className="border-t border-border pt-6 animate-card-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="label-text text-primary">{result.type?.toUpperCase()}</span>
                      {result.evidenceLevel && (
                        <span className="label-text">· PHASE {result.evidenceLevel}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{result.year}</span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-foreground leading-snug mb-2">{result.title}</h3>

                  <p className="text-xs text-muted-foreground mb-4">
                    <em>{result.journal}</em>
                    {result.pmid && <span> · DOI: {result.pmid}</span>}
                  </p>

                  {/* AI Summary */}
                  <div className="bg-muted/50 border-l-2 border-accent p-4 mb-4">
                    <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> AI SUMMARY
                    </p>
                    <p className="text-sm text-foreground italic leading-relaxed">{result.abstract}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <button className="px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
                      READ SUMMARY
                    </button>
                    <button className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1">
                      DOWNLOAD PDF <span className="text-muted-foreground/50">📄</span>
                    </button>
                    {result.pmid && (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${result.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {filteredResults && filteredResults.length > 0 && (
              <div className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-border">
                {[1, 2, 3, "...", 12].map((p, i) => (
                  <button
                    key={i}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-semibold ${
                      p === 1 ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p === "..." ? "…" : p}
                  </button>
                ))}
                <button className="text-xs text-muted-foreground hover:text-foreground ml-2">›</button>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!results && !isLoading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm italic">Enter a clinical topic to search the literature</p>
          </div>
        )}

        {results && results.results.length > 0 && (
          <div className="mt-8">
            <MedicalDisclaimer />
          </div>
        )}
      </div>
    </div>
  );
};

export default LiteratureSearch;
