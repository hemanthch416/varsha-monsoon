import { describe, it, expect } from "vitest";
import { severityLabel, severityBadgeClass, severityBorderClass, severityRank } from "./severity";

describe("severity tokens", () => {
  const keys = ["normal", "watch", "warning", "severe", "emergency"] as const;

  it("has a label, badge class, and border class for every severity", () => {
    for (const k of keys) {
      expect(severityLabel[k]).toBeTruthy();
      expect(severityBadgeClass[k]).toContain(`bg-severity-${k}`);
      expect(severityBorderClass[k]).toContain(`border-severity-${k}`);
    }
  });

  it("orders severity rank monotonically", () => {
    const ranks = keys.map(k => severityRank[k]);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1]);
    }
  });
});
