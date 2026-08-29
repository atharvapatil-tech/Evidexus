import { useState } from "react";
import { Navigate, Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQueryTracker } from "@/hooks/useQueryTracker";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClinicalSidebar } from "@/components/clinical/ClinicalSidebar";
import { Loader2, Stethoscope, BookOpen, Scale, FileText, ArrowRight, BarChart3, Clock, Shield, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ClinicalChat from "@/components/clinical/ClinicalChat";
import LiteratureSearch from "@/components/clinical/LiteratureSearch";
import TreatmentComparison from "@/components/clinical/TreatmentComparison";

const DashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { totalCount, monthlyByTool, remaining } = useQueryTracker();

  const consultations = (monthlyByTool["clinical_chat"] || 0) + (monthlyByTool["treatment_comparison"] || 0);
  const searches = (monthlyByTool["literature_search"] || 0) + (monthlyByTool["content_analysis"] || 0);

  const tools = [
    { icon: Stethoscope, title: "Clinical Q&A", desc: "Evidence-based clinical consultations", path: "/dashboard/clinical", color: "bg-primary/10 text-primary" },
    { icon: BookOpen, title: "Literature Search", desc: "Search real PubMed studies", path: "/dashboard/literature", color: "bg-evidence-strong/10 text-evidence-strong" },
    { icon: Scale, title: "Treatment Comparison", desc: "Side-by-side drug & treatment analysis", path: "/dashboard/compare", color: "bg-accent/10 text-accent" },
    { icon: FileText, title: "Content Analysis", desc: "Validate health claims in articles", path: "/dashboard/analyze", color: "bg-evidence-moderate/10 text-evidence-moderate" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto overflow-y-auto h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Clinical Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.email}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Consultations</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{consultations}</p>
          <p className="text-xs text-muted-foreground">This month</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-accent" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Searches</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{searches}</p>
          <p className="text-xs text-muted-foreground">Literature queries</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-evidence-strong" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Remaining Today</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{remaining}</p>
          <p className="text-xs text-muted-foreground">{remaining} of 5 free queries</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-4">Clinical Tools</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <button
            key={tool.title}
            onClick={() => navigate(tool.path)}
            className="text-left rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all group"
          >
            <div className={`h-10 w-10 rounded-xl ${tool.color} flex items-center justify-center mb-3`}>
              <tool.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">{tool.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{tool.desc}</p>
            <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
};

const ContentAnalysisPage = () => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      navigate("/results", { state: { analysis: data, originalContent: content.trim() } });
    } catch (e) {
      console.error(e);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Content Analysis</h1>
          <p className="text-sm text-muted-foreground">Analyze health claims in articles, videos, or text</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste article text, YouTube link, or health claims..."
          className="w-full min-h-[200px] rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y mb-4"
        />
        <Button onClick={handleAnalyze} disabled={isLoading || !content.trim()} className="w-full h-11">
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...</>
          ) : (
            <><SearchIcon className="h-4 w-4 mr-2" /> Analyze Content</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Supported: article text, blog content, YouTube links (via transcript), health claims
        </p>
      </div>
    </div>
  );
};

const HistoryPage = () => (
  <div className="p-6 max-w-4xl mx-auto text-center py-20">
    <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
    <h2 className="text-lg font-semibold text-foreground mb-2">Consultation History</h2>
    <p className="text-sm text-muted-foreground">Your past clinical queries will appear here.</p>
  </div>
);

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ClinicalSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-12 flex items-center border-b border-border bg-background px-4">
            <SidebarTrigger className="mr-3" />
            <span className="text-sm font-medium text-foreground">Evidexus Clinical Platform</span>
          </header>
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route index element={<DashboardOverview />} />
              <Route path="clinical" element={<ClinicalChat />} />
              <Route path="literature" element={<LiteratureSearch />} />
              <Route path="compare" element={<TreatmentComparison />} />
              <Route path="analyze" element={<ContentAnalysisPage />} />
              <Route path="history" element={<HistoryPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
