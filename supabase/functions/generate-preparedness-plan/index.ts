import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { callGateway } from "../_shared/ai-gateway.ts";

const LANG_NAMES: Record<string, string> = {
  en: "English", hi: "Hindi (हिन्दी)", kn: "Kannada (ಕನ್ನಡ)",
};

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

// Stable stringify to hash profile deterministically.
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
  "immediate_actions": string[],       // 4-6 concrete actions to take within 24-48 hours
  "essential_supplies": string[],       // 6-10 items with quantities tailored to household size
  "evacuation_considerations": string[],// 3-5 items considering housing type and locality
  "communication_plan": string[],       // 3-5 items (emergency contacts, meeting points, check-ins)
  "household_specific_notes": string[]  // 3-6 items tailored to elderly/children/pets/housing
}

Household profile:
- Location: ${profile.locality ?? "unknown"}, ${profile.city ?? "India"}
- Household size: ${profile.household_size} people
- Elderly members: ${profile.has_elderly ? "yes" : "no"}
- Children: ${profile.has_children ? "yes" : "no"}
- Pets: ${profile.has_pets ? "yes" : "no"}
- Housing type: ${profile.housing_type ?? "unspecified"}

CRITICAL LANGUAGE INSTRUCTION: Write EVERY string in the response entirely in ${langName}. Do not mix languages. Use natural, everyday phrasing a local resident would understand. Keep JSON keys in English (as in the schema).`;
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await anon.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const forceRegen = body?.regenerate === true;

    // Load profile from DB — do not trust client-sent profile.
    const { data: profileRow, error: profileErr } = await supabase
      .from("profiles")
      .select("city, locality, household_size, has_elderly, has_children, has_pets, housing_type, language")
      .eq("id", user.id)
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profileRow) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const profile = ProfileSchema.parse(profileRow);
    const hash = await sha256(stableStringify({
      city: profile.city, locality: profile.locality, household_size: profile.household_size,
      has_elderly: profile.has_elderly, has_children: profile.has_children, has_pets: profile.has_pets,
      housing_type: profile.housing_type,
    }));

    if (!forceRegen) {
      const { data: cached } = await supabase
        .from("preparedness_plans")
        .select("plan")
        .eq("user_id", user.id).eq("profile_hash", hash).eq("language", profile.language)
        .maybeSingle();
      if (cached) return new Response(JSON.stringify({ plan: cached.plan, cached: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate — one retry on parse failure, then error.
    let plan: z.infer<typeof PlanSchema> | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2 && !plan; attempt++) {
      try {
        plan = await generateAndParse(apiKey, profile);
      } catch (e) {
        lastErr = e;
        console.error(`Plan generation attempt ${attempt + 1} failed:`, e);
      }
    }
    if (!plan) {
      return new Response(JSON.stringify({ error: "Could not generate a valid plan. Please try again shortly.", details: String(lastErr) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("preparedness_plans").upsert({
      user_id: user.id, profile_hash: hash, language: profile.language, plan,
    }, { onConflict: "user_id,profile_hash,language" });

    return new Response(JSON.stringify({ plan, cached: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("generate-preparedness-plan error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
