import { describe, it, expect } from "vitest";
import { findFloodProneMatch, floodProneAreas } from "./floodProneAreas";

describe("findFloodProneMatch", () => {
  it("returns null for empty input", () => {
    expect(findFloodProneMatch("")).toBeNull();
    expect(findFloodProneMatch("   ")).toBeNull();
  });

  it("matches an exact city name case-insensitively", () => {
    expect(findFloodProneMatch("mumbai")?.city).toBe("Mumbai");
    expect(findFloodProneMatch("CHENNAI")?.city).toBe("Chennai");
  });

  it("matches on a known hotspot substring", () => {
    expect(findFloodProneMatch("Sion")?.city).toBe("Mumbai");
    expect(findFloodProneMatch("Velachery")?.city).toBe("Chennai");
  });

  it("returns null for unknown destinations", () => {
    expect(findFloodProneMatch("Jaisalmer")).toBeNull();
  });

  it("has curated data with all required fields", () => {
    for (const e of floodProneAreas) {
      expect(e.city).toBeTruthy();
      expect(e.region).toBeTruthy();
      expect(e.known_hotspots.length).toBeGreaterThan(0);
      expect(["watch", "warning", "severe"]).toContain(e.historical_severity);
    }
  });
});
