import { supabase } from "@/integrations/supabase/client";
import type { PreparednessPlan } from "@/types";
import { preparednessPlanSchema } from "@/utils/schemas";

/**
 * Invoke the `generate-preparedness-plan` edge function and validate the
 * returned JSON against `preparednessPlanSchema`. Set `regenerate` to bypass
 * the server-side cache keyed on the profile hash.
 *
 * @throws If the function errors, returns no plan, or the plan fails schema validation.
 */
export async function fetchPreparednessPlan(regenerate = false): Promise<PreparednessPlan> {
  const { data, error } = await supabase.functions.invoke("generate-preparedness-plan", {
    body: { regenerate },
  });
  if (error) throw new Error(error.message ?? "Failed to fetch plan");
  if (!data?.plan) throw new Error("No plan returned");
  return preparednessPlanSchema.parse(data.plan) as PreparednessPlan;
}

/**
 * Send a free-form message to the `chat-assistant` edge function and return
 * the assistant's reply. Chat history and household context are loaded
 * server-side; the client only sends the new message.
 */
export async function askAssistant(message: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("chat-assistant", { body: { message } });
  if (error) throw new Error(error.message ?? "Assistant failed");
  if (typeof data?.reply !== "string") throw new Error("Invalid reply");
  return data.reply;
}
