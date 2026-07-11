// Strict CORS helper. Instead of a wide-open "*", we return the request's
// Origin only if it matches an allowlist. Non-browser callers (no Origin
// header) get no ACAO — they must use the service role directly.
//
// The allowlist covers:
//   • Lovable preview + published domains
//   • localhost dev
//   • Optional extra origins from the ALLOWED_ORIGINS env var (comma-separated)

const STATIC_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(?::\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.dev$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
];

function extraOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (STATIC_PATTERNS.some(re => re.test(origin))) return true;
  return extraOrigins().includes(origin);
}

// Build headers scoped to the request's origin. Always safe to spread into
// any response (including errors).
export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const allow = isAllowedOrigin(origin) ? origin! : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "3600",
  };
}

export function jsonResponse(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
