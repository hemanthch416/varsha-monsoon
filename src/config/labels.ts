import type { PreparednessPlan } from "@/types";
import { housingTypes, languages } from "@/utils/schemas";

/** Human-readable labels for the `housing_type` enum. */
export const housingLabels: Record<typeof housingTypes[number], string> = {
  ground_floor: "Ground floor",
  high_rise: "High rise",
  near_river: "Near river/lake",
  low_lying: "Low-lying area",
  other: "Other",
};

/** Human-readable labels for the `language` enum, in the language itself. */
export const languageLabels: Record<typeof languages[number], string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  te: "తెలుగు",
};

/** Label shown when the AlertBanner announces a status transition. */
export const alertStatusLabel = {
  before: "Watch issued",
  during: "Active emergency",
  after: "Recovery phase",
} as const;

/** Ordered plan sections rendered on the Dashboard "Your plan" surface. */
export const PLAN_SECTIONS: { key: keyof PreparednessPlan; title: string; body: string }[] = [
  { key: "immediate_actions", title: "Immediate actions", body: "The first 24–48 hours." },
  { key: "essential_supplies", title: "Essential supplies", body: "Tailored to your household size." },
  { key: "evacuation_considerations", title: "Evacuation", body: "Given your housing and locality." },
  { key: "communication_plan", title: "Communication", body: "Contacts, meeting points, check-ins." },
  { key: "household_specific_notes", title: "Just for your household", body: "Elderly, children, pets, floor." },
];

/** Static recovery guidance rendered on the Dashboard when status === "after". */
export const RECOVERY_GUIDANCE: { title: string; body: string }[] = [
  { title: "Safe drinking water", body: "Boil water for 1 minute before drinking. Avoid tap water until civic authorities issue an all-clear. Discard uncovered food that may have contacted flood water." },
  { title: "Mould & damp prevention", body: "Open windows and use fans to dry rooms within 24–48 hours. Remove soaked carpets and mattresses. Wipe hard surfaces with a mild bleach solution (1 cup per 4L)." },
  { title: "Document damage for insurance", body: "Photograph every damaged item and area before cleanup. Keep receipts for repairs and temporary lodging. File a claim within your insurer's stated window (often 7 days)." },
  { title: "Electrical safety", body: "Do not switch on appliances that were submerged. Have a qualified electrician inspect wiring before restoring power." },
];
