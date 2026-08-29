import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";

type ToolType = "clinical_chat" | "literature_search" | "treatment_comparison" | "content_analysis" | "drug_interaction";

const FREE_DAILY_LIMIT = 5;

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
    if (!user) {
      resetStats();
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [{ count: dailyCount }, { data: monthlyData }] = await Promise.all([
      supabase
        .from("query_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString()),
      supabase
        .from("query_history")
        .select("tool_type, created_at")
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString()),
    ]);

    setTodayCount(dailyCount || 0);

    if (monthlyData) {
      setTotalCount(monthlyData.length);
      const byTool: Record<string, number> = {};
      monthlyData.forEach((query) => {
        byTool[query.tool_type] = (byTool[query.tool_type] || 0) + 1;
      });
      setMonthlyByTool(byTool);
    } else {
      setTotalCount(0);
      setMonthlyByTool({});
    }
  }, [resetStats, user]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const checkLimit = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    if (profile?.plan === "pro" || profile?.plan === "enterprise") return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("query_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString());

    if ((count || 0) >= FREE_DAILY_LIMIT) {
      toast.error(`Daily limit reached (${FREE_DAILY_LIMIT} queries/day). Upgrade to Pro for unlimited access.`);
      return false;
    }

    return true;
  }, [user]);

 const logQuery = useCallback(async (toolType: ToolType, queryText: string, responseData?: any) => {
  console.log("🔥 logQuery CALLED");

  if (!user) {
    console.log("❌ USER NULL");
    alert("User is null");
    return null;
  }

  console.log("✅ USER ID:", user.id);

  const { data, error } = await supabase
    .from("query_history")
    .insert([
      {
        user_id: user.id,
        tool_type: toolType,
        query_text: queryText,
        response_data: responseData || {},
      },
    ])
    .select();

  console.log("📦 INSERT DATA:", data);
  console.log("❌ INSERT ERROR:", error);

  if (error) {
    alert("Insert failed: " + error.message);
    return null;
  }

  alert("Insert success");
  return data?.[0]?.id;
}, [user]);
  const { data, error } = await supabase
    .from("query_history")
    .insert([
      {
        user_id: user.id,
        tool_type: toolType,
        query_text: queryText,
        response_data: responseData || {},
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Failed to save query:", error);
    toast.error("Could not save query");
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
    remaining: Math.max(0, FREE_DAILY_LIMIT - todayCount),
    fetchStats,
  };
}
