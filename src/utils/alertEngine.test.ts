import { describe, it, expect } from "vitest";
import { deriveAlertState } from "@/utils/alertEngine";
import type { Alert } from "@/types";
import type { WeatherData, WeatherWarning } from "@/services/weather";

const mkAlert = (over: Partial<Alert>): Alert => ({
  id: over.id ?? "a",
  severity: over.severity ?? "watch",
  status: over.status ?? "before",
  title: over.title ?? "Alert",
  message: over.message ?? "Message",
  region: over.region ?? "Mumbai",
  starts_at: over.starts_at ?? new Date().toISOString(),
  ends_at: over.ends_at ?? null,
});

const mkWeather = (warnings: WeatherWarning[]): WeatherData =>
  ({ warnings } as unknown as WeatherData);

describe("deriveAlertState", () => {
  it("returns calm before-state when nothing is active", () => {
    const s = deriveAlertState([], null);
    expect(s.status).toBe("before");
    expect(s.severity).toBe("normal");
    expect(s.sourceIds).toEqual([]);
  });

  it("classifies as during when a during alert exists", () => {
    const s = deriveAlertState([mkAlert({ status: "during", severity: "severe" })], null);
    expect(s.status).toBe("during");
    expect(s.severity).toBe("severe");
  });

  it("promotes to during on a severe weather warning even without alerts", () => {
    const s = deriveAlertState(
      [],
      mkWeather([{ id: "w1", severity: "severe", title: "Flood", message: "Now", windowHours: 6 }]),
    );
    expect(s.status).toBe("during");
    expect(s.severity).toBe("severe");
    expect(s.sourceIds).toContain("w1");
  });

  it("classifies as before on a watch weather warning", () => {
    const s = deriveAlertState(
      [],
      mkWeather([{ id: "w2", severity: "watch", title: "Watch", message: "Soon", windowHours: 12 }]),
    );
    expect(s.status).toBe("before");
    expect(s.severity).toBe("watch");
  });

  it("during takes precedence over concurrent before", () => {
    const s = deriveAlertState(
      [
        mkAlert({ id: "b", status: "before", severity: "watch" }),
        mkAlert({ id: "d", status: "during", severity: "warning" }),
      ],
      null,
    );
    expect(s.status).toBe("during");
    expect(s.sourceIds).toContain("d");
  });

  it("picks the highest severity headline when several contribute", () => {
    const s = deriveAlertState(
      [
        mkAlert({ id: "d1", status: "during", severity: "warning", title: "Lower" }),
        mkAlert({ id: "d2", status: "during", severity: "emergency", title: "Higher" }),
      ],
      null,
    );
    expect(s.severity).toBe("emergency");
    expect(s.headline).toBe("Higher");
  });

  it("classifies recent after-alerts as after when nothing else is active", () => {
    const s = deriveAlertState(
      [mkAlert({ id: "r", status: "after", severity: "warning", starts_at: new Date(Date.now() - 3600_000).toISOString() })],
      null,
    );
    expect(s.status).toBe("after");
  });

  it("ignores stale after-alerts older than 72h", () => {
    const stale = new Date(Date.now() - 80 * 3600_000).toISOString();
    const s = deriveAlertState([mkAlert({ status: "after", starts_at: stale })], null);
    expect(s.status).toBe("before");
    expect(s.severity).toBe("normal");
  });
});
