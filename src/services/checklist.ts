import { supabase } from "@/integrations/supabase/client";
import type { ChecklistItem } from "@/types";
import { defaultChecklist } from "./mockData";

interface ChecklistRow { id: string; user_id: string; items: ChecklistItem[] }

export async function getOrCreateChecklist(userId: string): Promise<ChecklistRow> {
  const { data, error } = await supabase
    .from("checklists")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as unknown as ChecklistRow;

  const { data: created, error: insertErr } = await supabase
    .from("checklists")
    .insert({ user_id: userId, items: defaultChecklist })
    .select()
    .single();
  if (insertErr) throw insertErr;
  return created as unknown as ChecklistRow;
}

export async function saveChecklist(id: string, items: ChecklistItem[]): Promise<void> {
  const { error } = await supabase.from("checklists").update({ items }).eq("id", id);
  if (error) throw error;
}
