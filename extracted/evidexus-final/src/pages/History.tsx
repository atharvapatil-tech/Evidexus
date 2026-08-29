import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TopBar from "@/components/shell/TopBar";
import PHIBanner from "@/components/shell/PHIBanner";

type Row = {
  id: string;
  tool_type: string;
  query_text: string;
  created_at: string;
};

const TOOL_LABEL: Record<string, string> = {
  clinical_chat: "Q&A",
  literature_search: "Literature",
  treatment_comparison: "Compare",
  drug_interaction: "Drugs",
  content_analysis: "Verify Rx",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "clinical_chat", label: "Q&A" },
  { id: "literature_search", label: "Literature" },
  { id: "treatment_comparison", label: "Compare" },
  { id: "drug_interaction", label: "Drugs" },
  { id: "content_analysis", label: "Verify Rx" },
];

const History = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("query_history")
        .select("id, tool_type, query_text, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (tool !== "all") q = q.eq("tool_type", tool);
      const { data, error } = await q;
      if (error) { toast.error("Failed to load history"); console.error(error); }
      else setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, [user, tool]);

  const grouped = useMemo(() => {
    const out: Record<string, Row[]> = {};
    rows.forEach((r) => {
      const day = new Date(r.created_at).toLocaleDateString(undefined, {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      });
      (out[day] ||= []).push(r);
    });
    return out;
  }, [rows]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PHIBanner />
      <TopBar />

      <main className="flex-1 px-5 md:px-8 py-10">
        <div className="max-w-[720px] mx-auto">
          <h1 className="font-serif text-[32px] font-bold mb-1">History</h1>
          <p className="text-[13px] text-muted-foreground mb-6">
            All past consultations. Click any item to reopen.
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setTool(f.id)}
                className={`pill ${tool === f.id ? "pill-active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-[13px] italic text-muted-foreground py-12 text-center">No consultations yet.</p>
          ) : (
            <div className="space-y-10">
              {Object.entries(grouped).map(([day, dayRows]) => (
                <div key={day}>
                  <p className="eyebrow mb-3">{day}</p>
                  <ul className="divide-y divide-border border-t border-b border-border">
                    {dayRows.map((r) => {
                      const time = new Date(r.created_at).toLocaleTimeString([], {
                        hour: "2-digit", minute: "2-digit",
                      });
                      return (
                        <li key={r.id}>
                          <button
                            onClick={() => navigate(`/answer/${r.id}`)}
                            className="w-full text-left py-4 px-1 hover:bg-muted/40 transition-colors flex items-start gap-4"
                          >
                            <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-primary bg-[hsl(var(--primary-soft))] rounded-full">
                              {TOOL_LABEL[r.tool_type] ?? r.tool_type}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] text-foreground font-medium leading-snug truncate">
                                {r.query_text}
                              </p>
                            </div>
                            <span className="shrink-0 text-[11px] text-muted-foreground">{time}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
