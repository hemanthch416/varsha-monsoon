// Open-Meteo integration: no API key required.
// Two calls: geocoding (city → lat/lon) and forecast (current + hourly rainfall).

export interface GeoPoint {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  admin1?: string;
}

export interface WeatherData {
  location: GeoPoint;
  current: {
    tempC: number;
    humidity: number;
    windKph: number;
    rainfallMm: number;
    weatherCode: number;
    condition: string;
    time: string;
  };
  // Next 24h hourly rainfall (mm)
  hourly: { time: string; rainMm: number; precipProb: number }[];
  // Aggregate warnings derived from forecast
  warnings: WeatherWarning[];
  fetchedAt: string;
}

export interface WeatherWarning {
  id: string;
  severity: "watch" | "warning" | "severe" | "emergency";
  title: string;
  message: string;
  windowHours: number;
}

// WMO weather interpretation codes → short label.
// https://open-meteo.com/en/docs
const WMO: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  66: "Freezing rain", 67: "Heavy freezing rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Rain showers", 81: "Heavy showers", 82: "Violent showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm",
};

export function codeToCondition(code: number): string {
  return WMO[code] ?? "Unknown";
}

export async function geocodeCity(city: string): Promise<GeoPoint | null> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const json = await res.json();
  const r = json?.results?.[0];
  if (!r) return null;
  return {
    latitude: r.latitude,
    longitude: r.longitude,
    name: r.name,
    country: r.country,
    admin1: r.admin1,
  };
}

export async function fetchWeather(city: string): Promise<WeatherData | null> {
  const location = await geocodeCity(city);
  if (!location) return null;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code");
  url.searchParams.set("hourly", "precipitation,precipitation_probability,weather_code");
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("wind_speed_unit", "kmh");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const json = await res.json();

  const c = json.current;
  const hourlyTimes: string[] = json.hourly?.time ?? [];
  const hourlyPrecip: number[] = json.hourly?.precipitation ?? [];
  const hourlyProb: number[] = json.hourly?.precipitation_probability ?? [];

  // Slice to the next 24 entries starting from now
  const nowIdx = Math.max(0, hourlyTimes.findIndex(t => new Date(t).getTime() >= Date.now() - 30 * 60_000));
  const hourly = hourlyTimes.slice(nowIdx, nowIdx + 24).map((time, i) => ({
    time,
    rainMm: hourlyPrecip[nowIdx + i] ?? 0,
    precipProb: hourlyProb[nowIdx + i] ?? 0,
  }));

  const warnings = deriveWarnings(hourly, c.weather_code);

  return {
    location,
    current: {
      tempC: Math.round(c.temperature_2m),
      humidity: Math.round(c.relative_humidity_2m),
      windKph: Math.round(c.wind_speed_10m),
      rainfallMm: Number(c.precipitation ?? 0),
      weatherCode: c.weather_code,
      condition: codeToCondition(c.weather_code),
      time: c.time,
    },
    hourly,
    warnings,
    fetchedAt: new Date().toISOString(),
  };
}

// Simple heuristic: cumulative rainfall over rolling windows → severity band.
function deriveWarnings(
  hourly: { time: string; rainMm: number; precipProb: number }[],
  currentCode: number,
): WeatherWarning[] {
  const warnings: WeatherWarning[] = [];
  const next6 = hourly.slice(0, 6).reduce((s, h) => s + h.rainMm, 0);
  const next24 = hourly.reduce((s, h) => s + h.rainMm, 0);

  if (next6 >= 60 || next24 >= 200) {
    warnings.push({
      id: "extreme-rain",
      severity: "severe",
      title: "Extremely heavy rainfall expected",
      message: `~${next24.toFixed(0)}mm forecast in the next 24 hours. Avoid travel; move to higher ground if in a low-lying area.`,
      windowHours: 24,
    });
  } else if (next6 >= 30 || next24 >= 100) {
    warnings.push({
      id: "heavy-rain",
      severity: "warning",
      title: "Heavy rainfall warning",
      message: `~${next24.toFixed(0)}mm forecast in the next 24 hours. Expect waterlogging in low-lying areas.`,
      windowHours: 24,
    });
  } else if (next24 >= 30) {
    warnings.push({
      id: "moderate-rain",
      severity: "watch",
      title: "Moderate rainfall advisory",
      message: `~${next24.toFixed(0)}mm forecast in the next 24 hours. Carry rain gear; travel may slow.`,
      windowHours: 24,
    });
  }

  if ([95, 96, 99].includes(currentCode)) {
    warnings.push({
      id: "thunderstorm",
      severity: currentCode === 99 ? "severe" : "warning",
      title: "Thunderstorm activity",
      message: "Unplug non-essential electronics. Avoid open ground and tall isolated trees.",
      windowHours: 3,
    });
  }
  return warnings;
}
