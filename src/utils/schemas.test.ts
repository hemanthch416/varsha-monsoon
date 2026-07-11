import { describe, it, expect } from "vitest";
import { preparednessPlanSchema } from "@/utils/schemas";

const validPlan = {
  immediate_actions: ["Charge phones", "Fill water containers"],
  essential_supplies: ["Torch", "First aid kit"],
  evacuation_considerations: ["Know the nearest shelter"],
  communication_plan: ["Agree on family meeting point"],
  household_specific_notes: ["Elevate refrigerator on bricks"],
};

describe("preparednessPlanSchema", () => {
  it("accepts a well-formed plan", () => {
    const result = preparednessPlanSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it("rejects a plan with a missing section", () => {
    const { communication_plan: _omit, ...missing } = validPlan;
    const result = preparednessPlanSchema.safeParse(missing);
    expect(result.success).toBe(false);
  });

  it("rejects a plan with empty arrays", () => {
    const result = preparednessPlanSchema.safeParse({ ...validPlan, immediate_actions: [] });
    expect(result.success).toBe(false);
  });

  it("rejects wrong item types (number instead of string)", () => {
    const result = preparednessPlanSchema.safeParse({
      ...validPlan,
      essential_supplies: [42],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-object payload", () => {
    expect(preparednessPlanSchema.safeParse(null).success).toBe(false);
    expect(preparednessPlanSchema.safeParse("plan").success).toBe(false);
  });
});
