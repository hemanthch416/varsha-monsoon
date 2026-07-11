import type { Alert, ChecklistItem, TravelAdvisory, WeatherSnapshot } from "@/types";

export const mockWeather: WeatherSnapshot = {
  city: "Mumbai",
  condition: "Heavy Rain",
  tempC: 27,
  humidity: 89,
  rainfallMm: 42,
  windKph: 34,
  updatedAt: new Date().toISOString(),
};

export const mockAlerts: Alert[] = [
  {
    id: "a1",
    severity: "warning",
    region: "Mumbai, Thane",
    status: "during",
    title: "Heavy rainfall expected next 24h",
    message: "IMD forecasts 90–110mm rainfall across coastal Mumbai. Avoid low-lying areas and waterlogged roads.",
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "a2",
    severity: "watch",
    region: "Konkan Coast",
    status: "before",
    title: "Cyclonic circulation forming over Arabian Sea",
    message: "Conditions favorable for intensification. Coastal residents should review preparedness kit.",
    starts_at: new Date().toISOString(),
    ends_at: null,
  },
  {
    id: "a3",
    severity: "normal",
    region: "Pune",
    status: "after",
    title: "Waterlogging cleared in most areas",
    message: "Municipal teams have restored drainage in affected wards. Monitor updates for weekend rainfall.",
    starts_at: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    ends_at: null,
  },
];

export const defaultChecklist: ChecklistItem[] = [
  { id: "c1", label: "Store 3 days of drinking water per person", category: "Essentials", done: false },
  { id: "c2", label: "Keep dry food supplies (biscuits, poha, dry fruits)", category: "Essentials", done: false },
  { id: "c3", label: "Charge power banks and torches", category: "Power", done: false },
  { id: "c4", label: "Waterproof important documents (Aadhaar, insurance)", category: "Documents", done: false },
  { id: "c5", label: "First aid kit with ORS and personal medicines", category: "Health", done: false },
  { id: "c6", label: "Save emergency helpline numbers (112, 108, local ward office)", category: "Contacts", done: false },
  { id: "c7", label: "Identify nearest higher ground / shelter", category: "Safety", done: false },
  { id: "c8", label: "Unplug appliances during heavy rain / lightning", category: "Safety", done: false },
];

export const mockAdvisories: TravelAdvisory[] = [
  {
    route: "Mumbai → Lonavala",
    severity: "warning",
    summary: "Landslide-prone stretches on the Ghat section. Delays of 1–2 hours expected.",
    hazards: ["Landslide risk", "Reduced visibility", "Waterlogging near Khopoli"],
  },
  {
    route: "Bengaluru → Chikmagalur",
    severity: "watch",
    summary: "Intermittent heavy showers; road generally passable with caution.",
    hazards: ["Slippery roads", "Occasional tree fall"],
  },
];
