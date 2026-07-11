import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";
import type { OnboardingInput, SettingsInput } from "@/utils/schemas";

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function completeOnboarding(userId: string, input: OnboardingInput): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...input, onboarded: true })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateSettings(userId: string, input: SettingsInput): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
