import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { callGateway } from "../_shared/ai-gateway.ts";
import { buildCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit, serviceClient } from "../_shared/rateLimit.ts";

const LANG_NAMES: Record<string, string> = {
  en: "English", hi: "Hindi (हिन्दी)", kn: "Kannada (ಕನ್ನಡ)",
};

// Client body is intentionally tiny — the profile is loaded server-side.
const BodySchema = z.object({
  regenerate: z.boolean().optional().default(false),
});

const ProfileSchema = z.object({
  city: z.string().nullable(),
  locality: z.string().nullable(),
  household_size: z.number().int(),
  has_elderly: z.boolean(),
  has_children: z.boolean(),
  has_pets: z.boolean(),
  housing_type: z.string().nullable(),
  language: z.string(),
});

const PlanSchema = z.object({
  immediate_actions: z.array(z.string()).min(1),
  essential_supplies: z.array(z.string()).min(1),
  evacuation_considerations: z.array(z.string()).min(1),
  communication_plan: z.array(z.string()).min(1),
  household_specific_notes: z.array(z.string()).min(1),
});

const MAX_REQUESTS_PER_MINUTE = 3;

function stableStringify(obj: Record<string, unknown>): string {
  return JSON.stringify(Object.keys(obj).sort().reduce((a, k) => { a[k] = obj[k]; return a; }, {} as Record<string, unknown>));
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function buildPrompt(profile: z.infer<typeof ProfileSchema>): string {
  const langName = LANG_NAMES[profile.language] ?? "English";
  return `You are Varsha, a monsoon preparedness expert for households in India.

Generate a personalized monsoon preparedness plan for this household. Respond ONLY with valid JSON matching this exact schema — no prose, no code fences:

{
  "immediate_actions": string[],
  "essential_supplies": string[],
  "evacuation_considerations": string[],
  "communication_plan": string[],
  "household_specific_notes": string[]
}

Household profile:
- Location: ${profile.locality ?? "unknown"}, ${profile.city ?? "India"}
- Household size: ${profile.household_size} people
- Elderly members: ${profile.has_elderly ? "yes" : "no"}
- Children: ${profile.has_children ? "yes" : "no"}
- Pets: ${profile.has_pets ? "yes" : "no"}
- Housing type: ${profile.housing_type ?? "unspecified"}

CRITICAL LANGUAGE INSTRUCTION: Write EVERY string in the response entirely in ${langName}. Do not mix languages. Keep JSON keys in English.`;
}

async function generateAndParse(apiKey: string, profile: z.infer<typeof ProfileSchema>): Promise<z.infer<typeof PlanSchema>> {
  const raw = await callGateway(apiKey, {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: "You output only valid JSON matching the requested schema." },
      { role: "user", content: buildPrompt(profile) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });
  const parsed = JSON.parse(raw);
  return PlanSchema.parse(parsed);
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, cors);

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("generate-preparedness-plan: LOVABLE_API_KEY missing");
      return jsonResponse({ error: "Service unavailable" }, 503, cors);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401, cors);

    const rawText = await req.text();
    if (rawText.length > 2000) return jsonResponse({ error: "Payload too large" }, 413, cors);
    let bodyJson: unknown;
    try { bodyJson = JSON.parse(rawText || "{}"); }
    catch { return jsonResponse({ error: "Invalid JSON" }, 400, cors); }

    const parsedBody = BodySchema.safeParse(bodyJson);
    if (!parsedBody.success) {
      return jsonResponse({ error: "Invalid request", fields: parsedBody.error.flatten().fieldErrors }, 400, cors);
    }
    const forceRegen = parsedBody.data.regenerate;

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes, error: userErr } = await anon.auth.getUser();
    if (userErr || !userRes?.user) return jsonResponse({ error: "Unauthorized" }, 401, cors);
    const user = userRes.user;

    const svc = serviceClient();

    // Rate limit: plan generation is expensive → 3/min per user.
    const rl = await checkRateLimit(svc, user.id, "generate-preparedness-plan", MAX_REQUESTS_PER_MINUTE);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again in a moment." }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json", "Retry-After": String(rl.retryAfterSeconds) },
      });
    }

    // Load profile from DB — never trust a client-sent profile.
    const { data: profileRow, error: profileErr } = await svc
      .from("profiles")
      .select("city, locality, household_size, has_elderly, has_children, has_pets, housing_type, language")
      .eq("id", user.id)
      .maybeSingle();
    if (profileErr) {
      console.error("profile load error:", profileErr.message);
      return jsonResponse({ error: "Could not load profile" }, 500, cors);
    }
    if (!profileRow) return jsonResponse({ error: "Profile not found" }, 404, cors);

    const profile = ProfileSchema.parse(profileRow);
    const hash = await sha256(stableStringify({
      city: profile.city, locality: profile.locality, household_size: profile.household_size,
      has_elderly: profile.has_elderly, has_children: profile.has_children, has_pets: profile.has_pets,
      housing_type: profile.housing_type,
    }));

    if (!forceRegen) {
      const { data: cached } = await svc
        .from("preparedness_plans")
        .select("plan")
        .eq("user_id", user.id).eq("profile_hash", hash).eq("language", profile.language)
        .maybeSingle();
      if (cached) return jsonResponse({ plan: cached.plan, cached: true }, 200, cors);
    }

    // Generate — one retry on parse failure, then error.
    let plan: z.infer<typeof PlanSchema> | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2 && !plan; attempt++) {
      try {
        plan = await generateAndParse(apiKey, profile);
      } catch (e) {
        lastErr = e;
        console.error(`Plan attempt ${attempt + 1} failed:`, e instanceof Error ? e.message : e);
      }
    }
    if (!plan) {
      // Do NOT return upstream error details to the client.
      return jsonResponse({ error: "Could not generate a valid plan. Please try again shortly." }, 502, cors);
    }
    void lastErr;

    await svc.from("preparedness_plans").upsert({
      user_id: user.id, profile_hash: hash, language: profile.language, plan,
    }, { onConflict: "user_id,profile_hash,language" });

    return jsonResponse({ plan, cached: false }, 200, cors);
  } catch (err) {
    console.error("generate-preparedness-plan error:", err instanceof Error ? err.message : err);
    return jsonResponse({ error: "Something went wrong. Please try again." }, 500, cors);
  }
});
