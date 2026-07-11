import { describe, it, expect, vi, beforeEach } from "vitest";
import { assessRoute } from "./travelAdvisory";

vi.mock("./weather", () => ({
  fetchWeather: vi.fn(),
}));

import { fetchWeather } from "./weather";

const makeWeather = (over: Partial<Awaited<ReturnType<typeof fetchWeather>>> = {}) => ({
  location: "Mumbai",
  current: { condition: "Heavy rain", tempC: 27, rainMm: 10, windKph: 30 },
  hourly: Array.from({ length: 24 }, () => ({ time: "", rainMm: 2, tempC: 27 })),
  warnings: [],
  ...over,
} as any);

describe("assessRoute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 'normal' rating for clear weather + unlisted destination", async () => {
    (fetchWeather as any).mockResolvedValue(makeWeather({ hourly: Array(24).fill({ time: "", rainMm: 0, tempC: 27 }) }));
    const r = await assessRoute("Home", "Jaisalmer");
    expect(r.rating).toBe("normal");
    expect(r.floodMatch).toBeNull();
    expect(r.headline).toMatch(/clear/i);
  });

  it("uses flood-prone historical severity for known cities with calm weather", async () => {
    (fetchWeather as any).mockResolvedValue(makeWeather({ hourly: Array(24).fill({ time: "", rainMm: 0, tempC: 27 }) }));
    const r = await assessRoute("Home", "Mumbai");
    expect(r.floodMatch?.city).toBe("Mumbai");
    expect(r.rating).toBe("severe");
    expect(r.hazards.some(h => h.startsWith("Flood hotspot:"))).toBe(true);
  });

  it("bumps severity when both weather and flood risk are present", async () => {
    (fetchWeather as any).mockResolvedValue(makeWeather({
      warnings: [{ id: "w1", severity: "warning", title: "Heavy rain likely", message: "…", windowHours: 24 }],
    }));
    const r = await assessRoute("Home", "Bengaluru");
    // flood=warning, weather=warning => bump to severe
    expect(r.rating).toBe("severe");
    expect(r.recommendations.length).toBeGreaterThan(1);
  });

  it("marks destination not found when weather returns null", async () => {
    (fetchWeather as any).mockResolvedValue(null);
    const r = await assessRoute("Home", "Nowhereville");
    expect(r.destinationNotFound).toBe(true);
    expect(r.weather).toBeNull();
  });

  it("tolerates weather fetch errors gracefully", async () => {
    (fetchWeather as any).mockRejectedValue(new Error("network"));
    const r = await assessRoute("Home", "Mumbai");
    expect(r.weather).toBeNull();
    expect(r.rating).toBe("severe"); // still gets flood severity
  });
});
