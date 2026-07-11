import { describe, it, expect } from "vitest";
import { buildPersonalizedChecklist } from "@/services/personalizedChecklist";
import type { Profile } from "@/types";

const baseProfile: Profile = {
  id: "u1",
  city: "Mumbai",
  locality: "Andheri West",
  household_size: 2,
  has_elderly: false,
  has_children: false,
  has_pets: false,
  housing_type: "high_rise",
  language: "en",
  notifications_enabled: true,
} as unknown as Profile;

const categories = (items: ReturnType<typeof buildPersonalizedChecklist>) =>
  new Set(items.map((i) => i.category));

describe("buildPersonalizedChecklist", () => {
  it("includes baseline categories for a minimal profile", () => {
    const items = buildPersonalizedChecklist({ ...baseProfile, housing_type: "other" });
    const cats = categories(items);
    for (const c of ["Essentials", "Power", "Documents", "Health", "Safety", "Contacts"]) {
      expect(cats.has(c)).toBe(true);
    }
    expect(cats.has("Elderly")).toBe(false);
    expect(cats.has("Children")).toBe(false);
    expect(cats.has("Pets")).toBe(false);
  });

  it("scales water quantity by household size", () => {
    const items = buildPersonalizedChecklist({ ...baseProfile, household_size: 5 });
    const water = items.find((i) => i.label.includes("drinking water"));
    expect(water?.label).toContain("15L");
  });

  it("adds elderly-specific items only when has_elderly is true", () => {
    const off = buildPersonalizedChecklist({ ...baseProfile, has_elderly: false });
    const on = buildPersonalizedChecklist({ ...baseProfile, has_elderly: true });
    expect(off.some((i) => i.category === "Elderly")).toBe(false);
    expect(on.some((i) => i.label.toLowerCase().includes("mobility aid"))).toBe(true);
    expect(on.some((i) => i.label.toLowerCase().includes("prescription medication"))).toBe(true);
  });

  it("adds pet items only when has_pets is true", () => {
    const items = buildPersonalizedChecklist({ ...baseProfile, has_pets: true });
    expect(items.some((i) => i.category === "Pets" && /carrier/i.test(i.label))).toBe(true);
    const withoutPets = buildPersonalizedChecklist({ ...baseProfile, has_pets: false });
    expect(withoutPets.some((i) => i.category === "Pets")).toBe(false);
  });

  it("adds sandbag/elevation items for low-lying or ground-floor housing", () => {
    const groundFloor = buildPersonalizedChecklist({ ...baseProfile, housing_type: "ground_floor" });
    expect(groundFloor.some((i) => /sandbag/i.test(i.label))).toBe(true);
    const lowLying = buildPersonalizedChecklist({ ...baseProfile, housing_type: "low_lying" });
    expect(lowLying.some((i) => /higher shelves/i.test(i.label))).toBe(true);
    const highRise = buildPersonalizedChecklist({ ...baseProfile, housing_type: "high_rise" });
    expect(highRise.some((i) => /sandbag/i.test(i.label))).toBe(false);
    expect(highRise.some((i) => /whistle/i.test(i.label))).toBe(true);
  });

  it("handles a null profile with a single-person baseline", () => {
    const items = buildPersonalizedChecklist(null);
    const water = items.find((i) => i.label.includes("drinking water"));
    expect(water?.label).toContain("3L");
    expect(items.some((i) => ["Elderly", "Children", "Pets"].includes(i.category))).toBe(false);
  });
});
