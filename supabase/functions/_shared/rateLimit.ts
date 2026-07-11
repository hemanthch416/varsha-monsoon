import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

// Uses the SECURITY DEFINER check_rate_limit(_user_id, _endpoint, _max) function.
// Returns { allowed, retryAfterSeconds }. On DB failure we FAIL CLOSED — the
// caller gets a 503 rather than an unlimited allowance.
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  maxPerMinute: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    _user_id: userId,
    _endpoint: endpoint,
    _max: maxPerMinute,
  });
  if (error) {
    console.error("rate limit rpc error:", error.message);
    return { allowed: false, retryAfterSeconds: 60 };
  }
  const secondsToNextMinute = 60 - new Date().getSeconds();
  return { allowed: !!data, retryAfterSeconds: secondsToNextMinute };
}

// Convenience: build a service-role client for RPCs that need to bypass RLS.
export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
