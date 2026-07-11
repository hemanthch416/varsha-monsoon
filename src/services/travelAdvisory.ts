import { fetchWeather, type WeatherData } from "./weather";
import { findFloodProneMatch, type FloodProneEntry } from "./floodProneAreas";
import type { Severity } from "@/types";
import { severityRank } from "@/utils/severity";

export interface TravelAssessment {
  origin: string;
  destination: string;
  rating: Severity;
  headline: string;
  summary: string;
  recommendations: string[];
  hazards: string[];
  weather: WeatherData | null;
  floodMatch: FloodProneEntry | null;
  destinationNotFound: boolean;
}

// Cross-reference live weather at the destination with the static flood-prone
// dataset to produce a safety rating + concrete recommendations.
export async function assessRoute(origin: string, destination: string): Promise<TravelAssessment> {
  const floodMatch = findFloodProneMatch(destination);

  let weather: WeatherData | null = null;
  let destinationNotFound = false;
  try {
    weather = await fetchWeather(destination);
    if (!weather) destinationNotFound = true;
  } catch {
    weather = null;
  }

  const weatherSeverity = topWeatherSeverity(weather);
  const floodSeverity: Severity = floodMatch?.historical_severity ?? "normal";

  // Overall rating = max of weather + historical flood risk (bumped when both present)
  let rating: Severity = maxSeverity(weatherSeverity, floodSeverity);
  if (weatherSeverity !== "normal" && floodSeverity !== "normal") {
    rating = bumpSeverity(rating);
  }

  const recommendations = buildRecommendations(rating, floodMatch, weather);
  const hazards = buildHazards(floodMatch, weather);

  return {
    origin,
    destination,
    rating,
    headline: headlineFor(rating, destination),
    summary: summaryFor(rating, weather, floodMatch),
    recommendations,
    hazards,
    weather,
    floodMatch,
    destinationNotFound,
  };
}

function topWeatherSeverity(w: WeatherData | null): Severity {
  if (!w || w.warnings.length === 0) return "normal";
  return w.warnings.reduce<Severity>((top, cur) =>
    severityRank[cur.severity] > severityRank[top] ? cur.severity : top
  , "normal");
}

function maxSeverity(a: Severity, b: Severity): Severity {
  return severityRank[a] >= severityRank[b] ? a : b;
}

function bumpSeverity(s: Severity): Severity {
  const order: Severity[] = ["normal", "watch", "warning", "severe", "emergency"];
  return order[Math.min(order.length - 1, order.indexOf(s) + 1)];
}

function headlineFor(rating: Severity, destination: string): string {
  switch (rating) {
    case "emergency":
    case "severe": return `Avoid non-essential travel to ${destination}`;
    case "warning": return `Travel with caution to ${destination}`;
    case "watch": return `${destination}: minor monsoon disruptions likely`;
    default: return `${destination} looks clear right now`;
  }
}

function summaryFor(rating: Severity, w: WeatherData | null, f: FloodProneEntry | null): string {
  const parts: string[] = [];
  if (w) {
    const rain24 = w.hourly.reduce((s, h) => s + h.rainMm, 0);
    parts.push(`Currently ${w.current.condition.toLowerCase()}, ~${rain24.toFixed(0)}mm of rain forecast in the next 24 hours.`);
  } else {
    parts.push("Live weather could not be fetched for this destination.");
  }
  if (f) parts.push(f.notes);
  if (rating === "normal" && !f) parts.push("No historical flood-hotspots on file for this destination.");
  return parts.join(" ");
}

function buildHazards(f: FloodProneEntry | null, w: WeatherData | null): string[] {
  const hazards: string[] = [];
  if (w) w.warnings.forEach(x => hazards.push(x.title));
  if (f) f.known_hotspots.slice(0, 4).forEach(h => hazards.push(`Flood hotspot: ${h}`));
  return hazards;
}

function buildRecommendations(rating: Severity, f: FloodProneEntry | null, w: WeatherData | null): string[] {
  const recs: string[] = [];
  if (rating === "severe" || rating === "emergency") {
    recs.push("Postpone all non-essential travel until conditions ease.");
    recs.push("If travel is unavoidable, share live location with a contact and carry emergency supplies.");
  } else if (rating === "warning") {
    recs.push("Delay departure to daylight hours if possible; check road-closure sources before leaving.");
    recs.push("Avoid underpasses, subways, and low-lying stretches — they flood fastest.");
  } else if (rating === "watch") {
    recs.push("Carry rain gear and allow extra buffer time.");
    recs.push("Keep phone fully charged and note two alternate routes.");
  } else {
    recs.push("Standard monsoon caution — check forecasts on the day of travel.");
  }

  if (f) {
    recs.push(`Local hotspots to avoid: ${f.known_hotspots.slice(0, 3).join(", ")}.`);
  }
  if (w && w.hourly.slice(0, 6).reduce((s, h) => s + h.rainMm, 0) > 20) {
    recs.push("Expect reduced visibility and slower highway speeds in the next 6 hours.");
  }
  recs.push("Cross-check road status with the state traffic police handle and Google Maps live traffic.");
  return recs;
}
