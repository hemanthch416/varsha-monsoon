import type { Profile, Severity } from "@/types";
import type { AlertState } from "@/utils/alertEngine";

export interface SafetyTip {
  id: string;
  category: string;
  title: string;
  body: string;
  // Which conditions triggered this tip (for transparency)
  reasons: string[];
}

// Rule-based safety recommendations. Tone is factual, non-alarmist.
// All output must be paired with a disclaimer at render time — see
// components/SafetyDisclaimer.tsx.
export function buildSafetyTips(state: AlertState, profile: Profile | null): SafetyTip[] {
  const tips: SafetyTip[] = [];
  const severity = state.severity;
  const status = state.status;
  const activeOrSevere = status === "during" || severity === "severe" || severity === "emergency";

  // ── Electrical safety (any waterlogging risk) ───────────────────────────
  if (activeOrSevere || severity === "warning") {
    tips.push({
      id: "electrical",
      category: "Electrical",
      title: "Electrical safety during waterlogging",
      body:
        "Switch off the main power at the fuse box if water reaches floor level. Do not touch switches or appliances with wet hands. Stay clear of fallen power lines and sagging cables — assume they are live. Have a qualified electrician inspect wiring before restoring power to any submerged circuit.",
      reasons: ["Active or forecast waterlogging"],
    });
  }

  // ── Elderly ─────────────────────────────────────────────────────────────
  if (profile?.has_elderly) {
    tips.push({
      id: "elderly-damp",
      category: "Elderly",
      title: "Elderly care in damp conditions",
      body:
        "Keep sleeping areas dry and well-ventilated to reduce respiratory flare-ups. Confirm 7 days of prescription medication is on hand. Check mobility aids for slip resistance — wet floors combined with rubber-tip walkers can shift unexpectedly. Monitor for signs of hypothermia in prolonged wet spells, especially if power is out.",
      reasons: ["Elderly household member"],
    });
    if (activeOrSevere) {
      tips.push({
        id: "elderly-evac",
        category: "Elderly",
        title: "If evacuation is required",
        body:
          "Move well before conditions peak — do not wait for a formal order. Carry a printed list of medications, doses, and doctor contacts in a waterproof pouch. If mobility is limited, notify your local disaster helpline in advance so responders know where to reach you.",
        reasons: ["Elderly household member", "Active severe alert"],
      });
    }
  }

  // ── Children ────────────────────────────────────────────────────────────
  if (profile?.has_children && (severity !== "normal" || status !== "before")) {
    tips.push({
      id: "children",
      category: "Children",
      title: "Keeping children safe",
      body:
        "Keep children indoors during heavy rain and thunderstorms — flowing water only 15cm deep can knock a small child off their feet. Pin an ID card with parents' phone numbers inside their bag. Explain the family meeting point in simple words and rehearse it once.",
      reasons: ["Children in household"],
    });
  }

  // ── Pets ────────────────────────────────────────────────────────────────
  if (profile?.has_pets) {
    tips.push({
      id: "pets",
      category: "Pets",
      title: "Pet safety in monsoon",
      body:
        "Keep pets on a leash or in a carrier during storms — thunder and unfamiliar flood water cause panic and running. Never leave pets tied outdoors. Do not let dogs drink or walk through flood water; leptospirosis risk is real. Keep 5 days of pet food and drinking water separately from human supplies.",
      reasons: ["Pets in household"],
    });
  }

  // ── Housing-specific ────────────────────────────────────────────────────
  if (profile?.housing_type === "ground_floor" || profile?.housing_type === "low_lying") {
    tips.push({
      id: "ground-floor",
      category: "Home",
      title: "Ground-floor / low-lying precautions",
      body:
        "Move valuables, documents, and electronics above expected water line — typically 60–90cm. Elevate refrigerator and washing machine on bricks. Place sandbags or thick plastic sheeting at door thresholds. Know your building's route to a higher floor and share it with everyone at home.",
      reasons: ["Housing at higher flood risk"],
    });
  }

  // ── Food & water safety AFTER an event ──────────────────────────────────
  if (status === "after") {
    tips.push({
      id: "water-safety-after",
      category: "Food & water",
      title: "Safe drinking water after flooding",
      body:
        "Boil all tap water for at least 1 full minute before drinking, cooking, or brushing teeth, until civic authorities confirm the supply is safe. If boiling is not possible, add 2 drops of household bleach (5% sodium hypochlorite) per litre and wait 30 minutes.",
      reasons: ["Recovery phase after event"],
    });
    tips.push({
      id: "food-safety-after",
      category: "Food & water",
      title: "Food safety after flooding",
      body:
        "Discard any food that came into contact with flood water — including sealed jars and cans if the seal is compromised. Throw out refrigerated food if power was out for more than 4 hours. When in doubt, throw it out — the cost of illness far exceeds the cost of the food.",
      reasons: ["Recovery phase after event"],
    });
    tips.push({
      id: "mould-after",
      category: "Home",
      title: "Preventing mould after damp",
      body:
        "Dry the home within 24–48 hours to prevent mould. Open windows, use fans, and remove soaked carpets, mattresses, and drywall. Wipe hard surfaces with a mild bleach solution (1 cup per 4 litres). Wear a mask if visible mould has already formed.",
      reasons: ["Recovery phase after event"],
    });
  }

  // ── Baseline calm-day tip ───────────────────────────────────────────────
  if (tips.length === 0) {
    tips.push({
      id: "baseline",
      category: "General",
      title: "Stay quietly prepared",
      body:
        "Keep your emergency kit topped up and easy to grab. Charge power banks weekly during monsoon. Save 112 in your phone favourites. Review your family's meeting point once a season.",
      reasons: ["No active alert — baseline guidance"],
    });
  }

  return tips;
}

export function severityTone(severity: Severity): string {
  switch (severity) {
    case "emergency": return "Follow official instructions from local authorities without delay.";
    case "severe": return "Act now — conditions are dangerous.";
    case "warning": return "Prepare deliberately over the next few hours.";
    case "watch": return "Review your kit and travel plans in a calm, unhurried way.";
    default: return "No urgent action required. Keep your kit ready.";
  }
}
