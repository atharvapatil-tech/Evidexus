import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryTracker } from "@/hooks/useQueryTracker";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

const ContentAnalysis = () => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const navigate = useNavigate();
  const { checkLimit, logQuery } = useQueryTracker();

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error("Please enter content to analyze");
      return;
    }

    const allowed = await checkLimit();
    if (!allowed) return;

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
          body: JSON.stringify({ content: content.trim() }),
        }
      );

      if (response.status === 429) { toast.error("Rate limited."); return; }
      if (response.status === 402) { toast.error("Service unavailable."); return; }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");

      await logQuery("content_analysis", content.trim(), data);
      setAnalysisResult(data);
    } catch (e) {
      console.error(e);
      toast.error("Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="px-5 py-8 max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight mb-2">
          Evidence Content Review
        </h1>
        <p className="text-sm text-muted-foreground italic mb-8">
          Synthesize complex clinical narratives and research abstracts into structured actionable insights.
        </p>

        {/* Input */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste medical text, study abstracts, or clinical observations here for monograph-grade analysis..."
          className="w-full min-h-[180px] border border-border bg-muted/30 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-y mb-4"
        />

        <Button
          onClick={handleAnalyze}
          disabled={isLoading || !content.trim()}
          className="w-full h-12 bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm"
        >
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...</> : "ANALYZE MANUSCRIPT"}
        </Button>

        {/* Results */}
        {analysisResult && (
          <div className="mt-10 space-y-8 animate-card-in">
            <p className="label-text">ANALYSIS RESULTS</p>

            {/* Executive Summary */}
            {analysisResult.summary && (
              <div>
                <p className="label-text mb-3 flex items-center gap-1.5">
                  <span className="text-accent">✦</span> EXECUTIVE SUMMARY
                </p>
                <p className="text-sm text-foreground leading-relaxed">{analysisResult.summary}</p>
              </div>
            )}

            {/* Key Findings */}
            {analysisResult.claims && analysisResult.claims.length > 0 && (
              <div>
                <p className="label-text mb-4">KEY FINDINGS & METRICS</p>
                <div className="space-y-6">
                  {analysisResult.claims.map((claim: any, i: number) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-2xl font-serif font-light text-muted-foreground/40 leading-none mt-1">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-foreground mb-1">{claim.claim || claim.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{claim.analysis || claim.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical Interpretation */}
            {analysisResult.overallAssessment && (
              <div className="bg-muted/30 border border-border p-6">
                <p className="label-text mb-3">CLINICAL INTERPRETATION</p>
                <blockquote className="text-sm text-foreground italic leading-relaxed">
                  "{analysisResult.overallAssessment}"
                </blockquote>
              </div>
            )}

            {/* Verified badge */}
            <div className="flex items-center gap-3 bg-primary text-white px-5 py-4 rounded-lg">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider">VERIFIED LOGIC</p>
                <p className="text-[10px] text-white/70">Cross-referenced with PubMed Library</p>
              </div>
            </div>

            <MedicalDisclaimer />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentAnalysis;
