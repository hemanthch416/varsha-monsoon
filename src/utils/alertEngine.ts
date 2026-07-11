import type { Alert, AlertStatus, Severity } from "@/types";
import type { WeatherData, WeatherWarning } from "@/services/weather";
import { severityRank } from "./severity";

export interface AlertState {
  status: AlertStatus;
  severity: Severity;
  headline: string;
  description: string;
  // Countdown target for BEFORE state (ms epoch) or null
  eventStart: number | null;
  // Sources contributing to the state (for tooltip/debug)
  sourceIds: string[];
}

/**
 * Classify the overall alert state for a user by combining stored alerts with
 * live weather warnings.
 *
 * Precedence (highest wins):
 *  1. `during` — any active `during` alert or `severe`/`emergency` weather warning.
 *  2. `before` — any `before` alert or `watch`/`warning` weather warning.
 *  3. `after`  — an `after` alert whose `starts_at` is within the last 72 hours.
 *  4. Calm    — synthetic `before` state at `normal` severity.
 *
 * When multiple items contribute, the highest severity (via `severityRank`)
 * supplies the headline/description. `sourceIds` lists every contributor.
 */
export function deriveAlertState(
  alerts: Alert[],
  weather: WeatherData | null,
): AlertState {
  const now = Date.now();
  const active = alerts.filter(a => a.status !== "after");
  const during = active.filter(a => a.status === "during");
  const before = active.filter(a => a.status === "before");
  const after = alerts.filter(a => a.status === "after" && now - new Date(a.starts_at).getTime() < 72 * 3600_000);

  const weatherSevere = (weather?.warnings ?? []).filter(w => w.severity === "severe" || w.severity === "emergency");
  const weatherSoon = (weather?.warnings ?? []).filter(w => w.severity === "watch" || w.severity === "warning");

  if (during.length > 0 || weatherSevere.length > 0) {
    const top = pickMostSevere([...during.map(alertToWarning), ...weatherSevere]);
    return {
      status: "during",
      severity: top.severity,
      headline: top.title,
      description: top.message,
      eventStart: null,
      sourceIds: [...during.map(a => a.id), ...weatherSevere.map(w => w.id)],
    };
  }

  if (before.length > 0 || weatherSoon.length > 0) {
    const top = pickMostSevere([...before.map(alertToWarning), ...weatherSoon]);
    const nextAlert = before[0];
    return {
      status: "before",
      severity: top.severity,
      headline: top.title,
      description: top.message,
      eventStart: nextAlert ? new Date(nextAlert.starts_at).getTime() : now + 6 * 3600_000,
      sourceIds: [...before.map(a => a.id), ...weatherSoon.map(w => w.id)],
    };
  }

  if (after.length > 0) {
    const a = after[0];
    return {
      status: "after",
      severity: a.severity,
      headline: a.title,
      description: a.message,
      eventStart: null,
      sourceIds: after.map(x => x.id),
    };
  }

  return {
    status: "before",
    severity: "normal",
    headline: "Conditions are calm",
    description: "No active watches or warnings for your area. Keep your kit ready.",
    eventStart: null,
    sourceIds: [],
  };
}

function alertToWarning(a: Alert): WeatherWarning {
  return {
    id: a.id,
    severity: (a.severity === "normal" ? "watch" : a.severity) as WeatherWarning["severity"],
    title: a.title,
    message: a.message,
    windowHours: 24,
  };
}

function pickMostSevere(items: WeatherWarning[]): WeatherWarning {
  return items.reduce((top, cur) =>
    severityRank[cur.severity] > severityRank[top.severity] ? cur : top
  );
}

export function formatCountdown(target: number): string {
  const diff = target - Date.now();
  if (diff <= 0) return "imminent";
  const h = Math.floor(diff / 3600_000);
  const m = Math.floor((diff % 3600_000) / 60_000);
  if (h >= 24) return `in ${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
