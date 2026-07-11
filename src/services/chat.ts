import { supabase } from "@/integrations/supabase/client";
import type { ChatMessage } from "@/types";

export async function listChat(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function appendChat(userId: string, role: ChatMessage["role"], message: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_history")
    .insert({ user_id: userId, role, message })
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessage;
}
