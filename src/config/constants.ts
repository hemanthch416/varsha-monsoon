/**
 * App-wide constants. Prefer these over inline magic numbers/strings so that
 * timing, thresholds, and copy are tuned in one place.
 */

// ─── Query caching / freshness ────────────────────────────────────────────
export const STALE_TIME_MS = {
  /** ~1 minute — for volatile lists (checklist items). */
  short: 60_000,
  /** ~5 minutes — for slow-changing lists (alerts, profile). */
  medium: 5 * 60_000,
  /** ~10 minutes — for expensive fetches (weather). */
  long: 10 * 60_000,
  /** Never auto-refetch — used for AI plans, cached by profile hash. */
  infinite: Infinity,
} as const;

// ─── Weather polling ──────────────────────────────────────────────────────
export const WEATHER_POLL_INTERVAL_MS = 15 * 60_000;
export const WEATHER_RETRY_COUNT = 4;
export const WEATHER_RETRY_BASE_MS = 30_000;
export const WEATHER_RETRY_MAX_MS = 5 * 60_000;

// ─── Alert state / recovery window ────────────────────────────────────────
/** How long after an event ends we still surface the "after" (recovery) state. */
export const RECOVERY_WINDOW_HOURS = 72;
/** BEFORE-state fallback lead time when no alert supplies a start time. */
export const DEFAULT_LEAD_TIME_HOURS = 6;
/** How often the dashboard countdown re-renders while in BEFORE state. */
export const COUNTDOWN_TICK_MS = 60_000;

// ─── Travel advisory ──────────────────────────────────────────────────────
export const TRAVEL_INPUT_DEBOUNCE_MS = 500;
export const TRAVEL_MIN_INPUT_LEN = 2;

// ─── Checklist ────────────────────────────────────────────────────────────
export const CHECKLIST_ITEM_MAX_LEN = 140;
/** Deterministic category order used when grouping checklist items. */
export const CHECKLIST_CATEGORY_ORDER = [
  "Essentials", "Power", "Documents", "Health", "Safety",
  "Contacts", "Elderly", "Children", "Pets", "Home", "Custom",
] as const;

// ─── Chat / assistant ─────────────────────────────────────────────────────
export const CHAT_HISTORY_LIMIT = 10;
