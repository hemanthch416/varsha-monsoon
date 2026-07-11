import { supabase } from "@/integrations/supabase/client";
import type { Alert } from "@/types";
import { mockAlerts } from "./mockData";

// Fetches active alerts; falls back to mock data when the alerts table is empty
// so the scaffolded app is never blank.
export async function listAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  const rows = (data ?? []) as Alert[];
  return rows.length > 0 ? rows : mockAlerts;
}
