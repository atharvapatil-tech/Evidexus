import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_DAILY_LIMIT = 5;

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

type AuthContext = {
  admin: SupabaseClient;
  userId: string;
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function parseJsonBody<T>(req: Request, maxBytes: number): Promise<T> {
  const rawBody = await req.text();
  if (!rawBody || rawBody.trim().length === 0) {
    throw new HttpError(400, "Request body is required");
  }

  const bodyBytes = new TextEncoder().encode(rawBody).length;
  if (bodyBytes > maxBytes) {
    throw new HttpError(413, "Request payload too large.");
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new HttpError(400, "Malformed JSON body");
  }
}

export async function requireAuth(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Unauthorized");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new HttpError(500, "Authentication service is not configured");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await authClient.auth.getClaims(token);
  const userId = data?.claims?.sub;

  if (error || !userId || typeof userId !== "string") {
    throw new HttpError(401, "Unauthorized");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { admin, userId };
}

export async function enforceUsageLimit(admin: SupabaseClient, userId: string) {
  const { data: profile } = await admin
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.plan === "pro" || profile?.plan === "enterprise") {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await admin
    .from("query_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", today.toISOString());

  if (error) {
    throw new HttpError(500, "Unable to verify usage limits");
  }

  if ((count ?? 0) >= FREE_DAILY_LIMIT) {
    throw new HttpError(429, `Daily limit reached (${FREE_DAILY_LIMIT} queries/day). Upgrade to Pro for unlimited access.`);
  }
}

export async function logQuery(
  admin: SupabaseClient,
  params: {
    userId: string;
    toolType: string;
    queryText: string;
    responseData: Json | Record<string, unknown> | null;
  },
): Promise<string | null> {
  const { data, error } = await admin
    .from("query_history")
    .insert({
      user_id: params.userId,
      tool_type: params.toolType,
      query_text: params.queryText,
      response_data: params.responseData,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log query:", error.message);
    return null;
  }

  return data?.id ?? null;
}

export function requireString(value: unknown, fieldName: string, minLength: number, maxLength: number) {
  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} is required`);
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    throw new HttpError(400, `${fieldName} is required`);
  }

  if (trimmed.length > maxLength) {
    throw new HttpError(413, `${fieldName} is too long`);
  }

  return trimmed;
}

export function optionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) {
    throw new HttpError(413, "Optional text is too long");
  }
  return trimmed;
}

export function extractJsonContent(content: string) {
  return content.replace(/```json\n?|\n?```/g, "").trim();
}

export function withQueryId<T extends Record<string, unknown>>(payload: T, queryId: string | null) {
  return queryId ? { ...payload, query_id: queryId } : payload;
}

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

export function handleHttpError(error: unknown, fallbackMessage: string) {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.message }, error.status);
  }

  console.error(fallbackMessage, error);
  return jsonResponse({ error: fallbackMessage }, 500);
}
