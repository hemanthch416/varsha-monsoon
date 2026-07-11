import { supabase } from "@/integrations/supabase/client";
import type { Alert } from "@/types";

/**
 * Fetch the 20 most recent alerts, filtered to the user's city when provided.
 * Matches case-insensitively on `region` (e.g. city "Bengaluru" matches
 * regions "Bengaluru", "Bengaluru Urban", etc.). Returns an empty array when
 * nothing matches — callers should render an empty state.
 */
export async function listAlerts(city?: string | null): Promise<Alert[]> {
  let query = supabase
    .from("alerts")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(20);

  if (city && city.trim()) {
    query = query.ilike("region", `%${city.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Alert[];
}
