import { supabase } from "@/integrations/supabase/client";
import type { Alert } from "@/types";

/**
 * Fetch the 20 most recent alerts (any status).
 * Returns an empty array when the table has no rows — callers should render an
 * appropriate empty state rather than fall back to sample data.
 */
export async function listAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Alert[];
}
