// Shared Lovable AI Gateway provider for edge functions.
// Uses OpenAI-compatible chat completions endpoint with LOVABLE_API_KEY.
export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GatewayOptions {
  model: string;
  messages: ChatMessage[];
  response_format?: { type: "json_object" };
  temperature?: number;
}

export async function callGateway(apiKey: string, opts: GatewayOptions): Promise<string> {
  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("AI gateway returned no content");
  return content;
}
