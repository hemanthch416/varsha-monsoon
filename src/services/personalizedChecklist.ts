import type { ChecklistItem, Profile } from "@/types";

// Build a household-tailored default checklist from the profile.
// Categories: Essentials, Power, Documents, Health, Safety, Contacts, Elderly, Children, Pets, Home.
export function buildPersonalizedChecklist(profile: Profile | null): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const add = (category: string, label: string) => {
    items.push({ id: crypto.randomUUID(), category, label, done: false });
  };

  const size = Math.max(1, profile?.household_size ?? 1);

  // Always-included baseline
  add("Essentials", `Store ${size * 3}L of drinking water per person for 3 days`);
  add("Essentials", "Dry food supplies (biscuits, poha, dry fruits, ready-to-eat)");
  add("Essentials", "Waterproof bags for phones, wallets, keys");
  add("Power", "Fully charge phones and power banks");
  add("Power", "Torch/lantern with spare batteries");
  add("Documents", "Waterproof Aadhaar, PAN, insurance, property papers");
  add("Documents", "Save digital copies to email / cloud");
  add("Health", "First-aid kit with ORS, bandages, antiseptic");
  add("Health", "Face masks and hand sanitizer");
  add("Safety", "Identify nearest higher ground / community shelter");
  add("Safety", "Unplug non-essential appliances during heavy rain / lightning");
  add("Contacts", "Save 112 (emergency), 108 (ambulance), local ward office");
  add("Contacts", "Agree on a family meeting point if separated");

  // Conditional — elderly
  if (profile?.has_elderly) {
    add("Elderly", "7-day supply of prescription medication");
    add("Elderly", "Mobility aid check (wheelchair, walker, cane)");
    add("Elderly", "List of medical conditions and doctor contacts");
    add("Elderly", "Extra pair of glasses / hearing-aid batteries");
  }

  // Conditional — children
  if (profile?.has_children) {
    add("Children", "Formula, baby food, diapers (3–5 day supply)");
    add("Children", "Comfort item (favourite toy / blanket)");
    add("Children", "Kid-friendly ID card with parents' phone numbers");
  }

  // Conditional — pets
  if (profile?.has_pets) {
    add("Pets", "5-day supply of pet food and drinking water");
    add("Pets", "Pet carrier / leash within easy reach");
    add("Pets", "Vaccination records in waterproof pouch");
  }

  // Conditional — housing risk
  if (profile?.housing_type === "low_lying" || profile?.housing_type === "ground_floor") {
    add("Home", "Sandbags at doorways or thick plastic sheeting");
    add("Home", "Move valuables and electronics to higher shelves");
    add("Home", "Elevate refrigerator / washing machine on bricks");
  }
  if (profile?.housing_type === "near_river") {
    add("Home", "Monitor river-level updates from state authority");
    add("Home", "Pre-plan evacuation route away from the river");
  }
  if (profile?.housing_type === "high_rise") {
    add("Home", "Identify the building's designated safe stairwell");
    add("Home", "Keep a whistle to signal from balconies if trapped");
  }

  return items;
}
