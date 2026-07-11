import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { assessRoute } from "./travelAdvisory";

vi.mock("./weather", () => ({
  fetchWeather: vi.fn(),
}));

import { fetchWeather, type WeatherData } from "./weather";

const mockedFetchWeather = fetchWeather as unknown as Mock;

const makeWeather = (over: Partial<WeatherData> = {}): WeatherData => ({
  location: { latitude: 0, longitude: 0, name: "Mumbai", country: "IN" },
  current: {
    tempC: 27,
    humidity: 80,
    windKph: 30,
    rainfallMm: 10,
    weatherCode: 63,
    condition: "Heavy rain",
    time: new Date().toISOString(),
  },
  hourly: Array.from({ length: 24 }, () => ({ time: "", rainMm: 2, precipProb: 60 })),
  warnings: [],
  fetchedAt: new Date().toISOString(),
  ...over,
});

describe("assessRoute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 'normal' rating for clear weather + unlisted destination", async () => {
    mockedFetchWeather.mockResolvedValue(
      makeWeather({ hourly: Array.from({ length: 24 }, () => ({ time: "", rainMm: 0, precipProb: 0 })) }),
    );
    const r = await assessRoute("Home", "Jaisalmer");
    expect(r.rating).toBe("normal");
    expect(r.floodMatch).toBeNull();
    expect(r.headline).toMatch(/clear/i);
  });

  it("uses flood-prone historical severity for known cities with calm weather", async () => {
    mockedFetchWeather.mockResolvedValue(
      makeWeather({ hourly: Array.from({ length: 24 }, () => ({ time: "", rainMm: 0, precipProb: 0 })) }),
    );
    const r = await assessRoute("Home", "Mumbai");
    expect(r.floodMatch?.city).toBe("Mumbai");
    expect(r.rating).toBe("severe");
    expect(r.hazards.some(h => h.startsWith("Flood hotspot:"))).toBe(true);
  });

  it("bumps severity when both weather and flood risk are present", async () => {
    mockedFetchWeather.mockResolvedValue(
      makeWeather({
        warnings: [{ id: "w1", severity: "warning", title: "Heavy rain likely", message: "…", windowHours: 24 }],
      }),
    );
    const r = await assessRoute("Home", "Bengaluru");
    // flood=warning, weather=warning => bump to severe
    expect(r.rating).toBe("severe");
    expect(r.recommendations.length).toBeGreaterThan(1);
  });

  it("marks destination not found when weather returns null", async () => {
    mockedFetchWeather.mockResolvedValue(null);
    const r = await assessRoute("Home", "Nowhereville");
    expect(r.destinationNotFound).toBe(true);
    expect(r.weather).toBeNull();
  });

  it("tolerates weather fetch errors gracefully", async () => {
    mockedFetchWeather.mockRejectedValue(new Error("network"));
    const r = await assessRoute("Home", "Mumbai");
    expect(r.weather).toBeNull();
    expect(r.rating).toBe("severe"); // still gets flood severity
  });
});
