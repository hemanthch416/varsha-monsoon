import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { callGateway, type ChatMessage } from "../_shared/ai-gateway.ts";

const LANG_NAMES: Record<string, string> = { en: "English", hi: "Hindi (हिन्दी)", kn: "Kannada (ಕನ್ನಡ)" };

const BodySchema = z.object({ message: z.string().trim().min(1).max(2000) });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await anon.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Load personalization context: profile + last 10 history messages + active alerts.
    const [profileRes, historyRes, alertsRes] = await Promise.all([
      supabase.from("profiles").select("city, locality, household_size, has_elderly, has_children, has_pets, housing_type, language").eq("id", user.id).maybeSingle(),
      supabase.from("chat_history").select("role, message").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("alerts").select("severity, region, title, message").in("status", ["before", "during"]).order("starts_at", { ascending: false }).limit(5),
    ]);

    const profile = profileRes.data;
    const langName = LANG_NAMES[profile?.language ?? "en"] ?? "English";
    const history = (historyRes.data ?? []).reverse();
    const alerts = alertsRes.data ?? [];

    const householdContext = profile
      ? `Household profile:
- Location: ${profile.locality ?? "?"}, ${profile.city ?? "India"}
- Size: ${profile.household_size}, elderly: ${profile.has_elderly}, children: ${profile.has_children}, pets: ${profile.has_pets}
- Housing: ${profile.housing_type ?? "?"}`
      : "Household profile unavailable.";

    const alertContext = alerts.length
      ? `Currently active alerts in the area:\n${alerts.map(a => `- [${a.severity}] ${a.region}: ${a.title} — ${a.message}`).join("\n")}`
      : "No active alerts.";

    const system = `You are Varsha, a calm, practical monsoon preparedness assistant for households in India.

Use the household profile and active alerts to personalize every answer — do not give generic advice. Reference the user's specific housing type, family composition, and locality when relevant. If a question is unrelated to safety, weather, or preparedness, gently redirect.

${householdContext}

${alertContext}

CRITICAL LANGUAGE INSTRUCTION: Write your entire response in ${langName}. Use natural, warm phrasing. You may use short markdown (bold, lists) but keep responses concise (under 200 words unless the user asks for detail).`;

    const messages: ChatMessage[] = [
      { role: "system", content: system },
      ...history.map((m): ChatMessage => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.message })),
      { role: "user", content: parsed.data.message },
    ];

    const reply = await callGateway(apiKey, {
      model: "google/gemini-2.5-flash",
      messages,
      temperature: 0.6,
    });

    // Persist both sides.
    await supabase.from("chat_history").insert([
      { user_id: user.id, role: "user", message: parsed.data.message },
      { user_id: user.id, role: "assistant", message: reply },
    ]);

    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("chat-assistant error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
