import { supabase } from "@/integrations/supabase/client";
import type { ChecklistItem, Profile } from "@/types";
import { buildPersonalizedChecklist } from "./personalizedChecklist";

export interface ChecklistRow { id: string; user_id: string; items: ChecklistItem[] }

// Reads the user's checklist. If none exists, seeds one from the profile so that
// household-specific items (elderly, children, pets, housing) are present out of the box.
export async function getOrCreateChecklist(userId: string, profile: Profile | null): Promise<ChecklistRow> {
  const { data, error } = await supabase
    .from("checklists")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as unknown as ChecklistRow;

  const seed = buildPersonalizedChecklist(profile);
  const { data: created, error: insertErr } = await supabase
    .from("checklists")
    .insert({ user_id: userId, items: seed as unknown as never })
    .select()
    .single();
  if (insertErr) throw insertErr;
  return created as unknown as ChecklistRow;
}

export async function saveChecklist(id: string, items: ChecklistItem[]): Promise<void> {
  const { error } = await supabase
    .from("checklists")
    .update({ items: items as unknown as never })
    .eq("id", id);
  if (error) throw error;
}

// Replaces the whole item list with a freshly generated personalized set.
// Used when the user changes household details and wants their checklist rebuilt.
export async function resetChecklistToPersonalized(id: string, profile: Profile | null): Promise<ChecklistItem[]> {
  const seed = buildPersonalizedChecklist(profile);
  await saveChecklist(id, seed);
  return seed;
}
