import { supabase } from "@/integrations/supabase/client";
import type { PreparednessPlan } from "@/types";
import { preparednessPlanSchema } from "@/utils/schemas";

export async function fetchPreparednessPlan(regenerate = false): Promise<PreparednessPlan> {
  const { data, error } = await supabase.functions.invoke("generate-preparedness-plan", {
    body: { regenerate },
  });
  if (error) throw new Error(error.message ?? "Failed to fetch plan");
  if (!data?.plan) throw new Error("No plan returned");
  return preparednessPlanSchema.parse(data.plan);
}

export async function askAssistant(message: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("chat-assistant", { body: { message } });
  if (error) throw new Error(error.message ?? "Assistant failed");
  if (typeof data?.reply !== "string") throw new Error("Invalid reply");
  return data.reply;
}
