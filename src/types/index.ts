export type Severity = "normal" | "watch" | "warning" | "severe" | "emergency";
export type AlertStatus = "before" | "during" | "after";
export type Language = "en" | "hi" | "kn";
export type HousingType = "ground_floor" | "high_rise" | "near_river" | "low_lying" | "other";

export interface Profile {
  id: string;
  city: string | null;
  locality: string | null;
  household_size: number;
  has_elderly: boolean;
  has_children: boolean;
  has_pets: boolean;
  housing_type: HousingType | null;
  language: Language;
  notifications_enabled: boolean;
  onboarded: boolean;
}

export interface Alert {
  id: string;
  severity: Severity;
  region: string;
  status: AlertStatus;
  title: string;
  message: string;
  starts_at: string;
  ends_at: string | null;
}

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  done: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  message: string;
  created_at: string;
}

export interface WeatherSnapshot {
  city: string;
  condition: string;
  tempC: number;
  humidity: number;
  rainfallMm: number;
  windKph: number;
  updatedAt: string;
}

export interface TravelAdvisory {
  route: string;
  severity: Severity;
  summary: string;
  hazards: string[];
}

export interface PreparednessPlan {
  immediate_actions: string[];
  essential_supplies: string[];
  evacuation_considerations: string[];
  communication_plan: string[];
  household_specific_notes: string[];
}
