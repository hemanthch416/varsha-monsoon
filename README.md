# Varsha — A quiet guide through the monsoon

Varsha is a weather-aware preparedness companion for households in monsoon-affected
regions of India. It turns raw weather data and civic alerts into calm, personalised
guidance — before, during, and after severe weather events.

---

## What the app does

- **Personalised preparedness plans** generated from the household profile
  (locality, housing type, household size, elderly / children / pets flags) by a
  Gemini model running behind a Lovable Cloud edge function.
- **Weather-aware guidance** powered by Open-Meteo forecasts, blended with civic
  alerts to derive a single "state" (calm → watch → warning → severe → emergency).
- **Personalised emergency checklist** — items appear or disappear based on the
  household profile (medication + mobility for elderly, pet food + carrier for pets,
  sandbags for ground-floor homes). Persists to the database, supports custom items,
  and has a print/export view.
- **Travel advisories** — enter an origin and destination; the app cross-references
  live weather with a curated static dataset of flood-prone areas and returns a
  safety rating with specific recommendations.
- **Safety recommendations** combining rule-based logic (electrical safety during
  waterlogging, elderly heat/damp precautions, pet safety, food/water safety after
  flooding) with the AI assistant, and always shown alongside a plain-language
  disclaimer and the relevant emergency helplines (112, 108, 1077, 1078, 1916).
- **Multilingual assistance** — English, Hindi, Marathi, Tamil, Bengali. The
  assistant, plan generation, and UI language switch respect the user's choice, and
  `<html lang>` is kept in sync for screen readers.
- **Real-time alerts** — an `aria-live="assertive"` banner surfaces the highest
  severity alert for the user's region across every authenticated screen.

Every screen ships with loading, empty, and error states — no blank canvases.

---

## Architecture

| Layer            | Tech                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| Frontend         | React 18, Vite 5, TypeScript, Tailwind, shadcn/ui, framer-motion     |
| Data / caching   | TanStack Query (route-level `staleTime`, no window-focus refetch)    |
| Routing          | react-router-dom, all authenticated routes lazy-loaded               |
| Auth & database  | Lovable Cloud (Supabase Postgres + Auth) with RLS scoped to `auth.uid()` |
| Edge functions   | Deno on Lovable Cloud — `generate-preparedness-plan`, `chat-assistant` |
| AI               | Google Gemini via the Lovable AI Gateway (no client-side API key)    |
| Weather          | Open-Meteo forecast API (no key required)                            |
| Tests            | Vitest + Testing Library, jsdom, all network mocked                  |

### Data model (public schema, all RLS-scoped to `auth.uid()`)

- `profiles` — household profile, language, notification prefs
- `checklists` — per-user checklist items (jsonb)
- `preparedness_plans` — cached AI plans, keyed by profile hash + language
- `chat_history` — assistant conversation, user-scoped
- `alerts` — public read; write-blocked from clients (seeded / operator-managed)
- `rate_limits` — server-side only; enforced by edge functions

### Security posture

- No secrets in the client bundle. Gemini/AI keys live only as edge-function env
  vars managed by Lovable Cloud.
- RLS on every user-owned table; `alerts` is public-read-only.
- Every edge function validates input with Zod, applies per-user rate limits via
  `check_rate_limit`, and returns CORS restricted to the app origin.
- Prompt-injection guard on assistant + plan inputs.

### Accessibility

- WCAG AA colour contrast on all severity states (light + dark).
- `aria-live="assertive"` on the alert banner, `polite` on transition status.
- Full keyboard navigation with visible focus rings.
- Layout reflows cleanly at 200% browser zoom.

---

## Running locally

Prereqs: **Node 20+** and **bun** (or npm).

```bash
bun install
bun run dev          # http://localhost:8080
bun run test         # vitest, 23 tests
bun run build        # production bundle, code-split per route
```

The app expects the Lovable Cloud project variables in `.env` (auto-populated by
the Lovable environment):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

Edge-function secrets (`LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) are
managed by Lovable Cloud and are never present in the client bundle.

### Demo data

The migration `20260711080000_seed_demo_alert.sql` seeds two sample alerts so the
banner and dashboard render populated on first load. Onboarding creates a demo
profile per signed-in user; there is no shared demo account.

---

## How each requirement is met

| Requirement                                | Where it lives                                            |
| ------------------------------------------ | --------------------------------------------------------- |
| Personalised preparedness plans            | `supabase/functions/generate-preparedness-plan`, `src/pages/Dashboard.tsx` |
| Weather-aware guidance                     | `src/hooks/useWeather.ts`, `src/utils/alertEngine.ts`     |
| Emergency checklists                       | `src/services/personalizedChecklist.ts`, `src/pages/Checklist.tsx` |
| Travel advisories                          | `src/services/travelAdvisory.ts`, `src/services/floodProneAreas.ts`, `src/pages/Travel.tsx` |
| Safety recommendations                     | `src/services/safetyRules.ts`, `src/components/SafetyRecommendations.tsx` |
| Multilingual assistance                    | `src/utils/languages.ts`, `src/components/LanguageSwitcher.tsx`, edge-function prompts |
| Real-time alerts (before / during / after) | `src/components/AlertBanner.tsx`, `src/hooks/useAlertState.ts` |
| Disclaimer + official helplines            | `src/components/SafetyDisclaimer.tsx`, `src/components/EmergencyContacts.tsx` |

---

## License

MIT
