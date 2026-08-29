import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import TopBar from "@/components/shell/TopBar";
import PHIBanner from "@/components/shell/PHIBanner";
import AnswerRenderer from "@/components/answer/AnswerRenderer";
import FollowUpBar from "@/components/answer/FollowUpBar";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryTracker } from "@/hooks/useQueryTracker";
import { runQuery } from "@/lib/runQuery";
import type { SearchMode } from "@/lib/searchModes";

const TOOL_TO_MODE: Record<string, SearchMode> = {
  clinical_chat: "qa",
  literature_search: "literature",
  treatment_comparison: "compare",
  drug_interaction: "interactions",
  content_analysis: "verify",
};

const FOLLOWUPS: Record<SearchMode, string[]> = {
  qa: ["What is the dose adjustment in renal impairment?", "What are the key contraindications?", "What monitoring is required?"],
  literature: ["Most recent meta-analysis", "Landmark RCTs in last 5 years", "Evidence in elderly patients"],
  compare: ["Cost-effectiveness comparison", "Safety in elderly", "Use in pregnancy"],
  interactions: ["What monitoring is needed?", "Safer alternatives", "Onset and offset of effect"],
  verify: ["Suggest pediatric-safe alternatives", "Renal dose adjustments", "Drug-drug interaction summary"],
};

const Answer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { checkLimit, fetchStats, logQuery } = useQueryTracker();

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<SearchMode>("qa");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      setLoading(true);
      const { data: row, error } = await supabase
        .from("query_history")
        .select("tool_type, query_text, response_data")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !row) { toast.error("Answer not found"); navigate("/"); return; }
      setMode(TOOL_TO_MODE[row.tool_type] ?? "qa");
      setQuery(row.query_text);
      setData(row.response_data);
      setLoading(false);
    })();
  }, [id, user, navigate]);

  const handleFollowUp = async (q: string) => {
    const allowed = await checkLimit();
    if (!allowed) return;
    setRunning(true);
    try {
      const indiaContext = localStorage.getItem("evidexus.indiaContext") === "true";
     const res = await runQuery(mode, q, { indiaContext });

if ("error" in res) {
  toast.error(res.error);
  return;
}

// 🔥 SAVE QUERY MANUALLY
const newId = await logQuery(mode as any, q, res.data);

if (newId) {
  await fetchStats();
  navigate(`/answer/${newId}`);
} else {
  toast.error("Could not save query");
}
    } finally {
      setRunning(false);
    }
  };

  if (authLoading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PHIBanner />
      <TopBar />

      <main className="flex-1 px-5 md:px-8 py-10">
        <div className="max-w-[720px] mx-auto">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground mb-6"
          >
            <ChevronLeft className="h-4 w-4" /> New search
          </button>

          {loading || !data ? (
            <FullScreenSpinner inline />
          ) : (
            <>
              <AnswerRenderer mode={mode} data={data} />
              <FollowUpBar
                mode={mode}
                isLoading={running}
                onSubmit={handleFollowUp}
                suggestions={FOLLOWUPS[mode]}
              />
              <MedicalDisclaimer />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const FullScreenSpinner = ({ inline }: { inline?: boolean }) => (
  <div className={`flex flex-col items-center gap-2 ${inline ? "py-20" : "min-h-screen justify-center"}`}>
    <Loader2 className="h-5 w-5 animate-spin text-primary" />
    <p className="text-[12px] italic text-muted-foreground">Retrieving evidence…</p>
  </div>
);

export default Answer;
