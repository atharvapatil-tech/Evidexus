import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useState } from "react";

type ToolType = "clinical_chat" | "literature_search" | "treatment_comparison" | "content_analysis" | "drug_interaction";

export function useQueryTracker() {
  const { user } = useAuth();
  const [todayCount, setTodayCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [monthlyByTool, setMonthlyByTool] = useState<Record<string, number>>({});

  const resetStats = useCallback(() => {
    setTodayCount(0);
    setTotalCount(0);
    setMonthlyByTool({});
  }, []);

  const fetchStats = useCallback(async () => {
    if (!user) { resetStats(); return; }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const [{ count: dailyCount }, { data: monthlyData }] = await Promise.all([
      supabase.from("query_history").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", today.toISOString()),
      supabase.from("query_history").select("tool_type, created_at").eq("user_id", user.id).gte("created_at", monthStart.toISOString()),
    ]);
    setTodayCount(dailyCount || 0);
    if (monthlyData) {
      setTotalCount(monthlyData.length);
      const byTool: Record<string, number> = {};
      monthlyData.forEach((q) => { byTool[q.tool_type] = (byTool[q.tool_type] || 0) + 1; });
      setMonthlyByTool(byTool);
    } else {
      setTotalCount(0);
      setMonthlyByTool({});
    }
  }, [resetStats, user]);

  useEffect(() => { void fetchStats(); }, [fetchStats]);

  const checkLimit = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    return true;
  }, [user]);

  const logQuery = useCallback(async (toolType: ToolType, queryText: string, responseData?: any) => {
    if (!user) return null;
    const { data, error } = await supabase.from("query_history").insert([{
      user_id: user.id,
      tool_type: toolType,
      query_text: queryText,
      response_data: responseData || {},
    }]).select().single();
    if (error) {
      console.error("Failed to save query:", error);
      return null;
    }
    return data.id;
  }, [user]);

  return {
    checkLimit,
    logQuery,
    todayCount,
    totalCount,
    monthlyByTool,
    remaining: 999,
    fetchStats,
  };
}
