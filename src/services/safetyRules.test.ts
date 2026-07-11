import { describe, it, expect } from "vitest";
import { buildSafetyTips, severityTone } from "./safetyRules";
import type { Profile } from "@/types";
import type { AlertState } from "@/utils/alertEngine";

const baseState = (over: Partial<AlertState> = {}): AlertState => ({
  status: "before",
  severity: "normal",
  headline: "Calm",
  detail: "",
  ...over,
});

const baseProfile = (over: Partial<Profile> = {}): Profile => ({
  id: "u1",
  city: "Mumbai",
  locality: "Bandra",
  household_size: 3,
  has_elderly: false,
  has_children: false,
  has_pets: false,
  housing_type: "apartment",
  language: "en",
  notifications_enabled: true,
  onboarded: true,
  ...over,
} as Profile);

describe("buildSafetyTips", () => {
  it("returns baseline tip when nothing applies", () => {
    const tips = buildSafetyTips(baseState(), null);
    expect(tips).toHaveLength(1);
    expect(tips[0].id).toBe("baseline");
  });

  it("adds electrical tip during active severe events", () => {
    const tips = buildSafetyTips(baseState({ status: "during", severity: "severe" }), null);
    expect(tips.some(t => t.id === "electrical")).toBe(true);
  });

  it("adds elderly tips when elderly present", () => {
    const tips = buildSafetyTips(baseState({ severity: "warning" }), baseProfile({ has_elderly: true }));
    expect(tips.some(t => t.id === "elderly-damp")).toBe(true);
  });

  it("adds elderly evacuation tip on active severe alerts", () => {
    const tips = buildSafetyTips(
      baseState({ status: "during", severity: "severe" }),
      baseProfile({ has_elderly: true }),
    );
    expect(tips.some(t => t.id === "elderly-evac")).toBe(true);
  });

  it("adds pet safety tip when pets present", () => {
    const tips = buildSafetyTips(baseState(), baseProfile({ has_pets: true }));
    expect(tips.some(t => t.id === "pets")).toBe(true);
  });

  it("adds ground-floor tips for at-risk housing", () => {
    const tips = buildSafetyTips(baseState(), baseProfile({ housing_type: "ground_floor" }));
    expect(tips.some(t => t.id === "ground-floor")).toBe(true);
  });

  it("adds recovery-phase tips after an event", () => {
    const tips = buildSafetyTips(baseState({ status: "after" }), null);
    const ids = tips.map(t => t.id);
    expect(ids).toEqual(expect.arrayContaining(["water-safety-after", "food-safety-after", "mould-after"]));
  });

  it("does not add child tip during calm-before state", () => {
    const tips = buildSafetyTips(baseState(), baseProfile({ has_children: true }));
    expect(tips.some(t => t.id === "children")).toBe(false);
  });
});

describe("severityTone", () => {
  it("returns distinct copy per severity", () => {
    const tones = new Set([
      severityTone("normal"),
      severityTone("watch"),
      severityTone("warning"),
      severityTone("severe"),
      severityTone("emergency"),
    ]);
    expect(tones.size).toBe(5);
  });
});
