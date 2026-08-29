import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const suggestions = [
  "Does turmeric cure cancer?",
  "Is ivermectin effective for COVID-19?",
  "Does vitamin D prevent depression?",
  "Is intermittent fasting safe for diabetics?",
];

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) {
      toast.error("Enter a medical evidence question");
      return;
    }

    if (!user) {
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ content: q }),
        }
      );

      if (response.status === 429) { toast.error("Rate limited. Try again shortly."); return; }
      if (response.status === 402) { toast.error("Service temporarily unavailable."); return; }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");

      navigate("/results", { state: { analysis: data, originalContent: q } });
    } catch {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative hero-gradient min-h-[80vh] flex items-center">
      <div className="hero-dots" />
      <div className="container max-w-3xl mx-auto px-6 py-24 relative z-10">
        <div className="text-center mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/70 mb-4">
            Evidence-Based Clinical Intelligence
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground mb-5 tracking-tight leading-[1.1]">
            Evidence over opinion.
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Ask any medical question. Get structured evidence from PubMed, systematic reviews, and clinical guidelines — not AI opinions.
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Ask a medical evidence question..."
              className="w-full h-14 pl-12 pr-32 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-premium text-primary-foreground h-10 px-5 rounded-lg text-sm font-medium"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Search <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></>
              )}
            </Button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
          <span className="text-xs text-muted-foreground mr-1">Try:</span>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setQuery(s); handleSearch(s); }}
              className="px-3 py-1.5 text-xs rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
