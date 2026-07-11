import { Phone, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// India-wide + relevant national disaster helplines.
// State-specific numbers are shown alongside based on user's state when available.
export const NATIONAL_EMERGENCY_CONTACTS = [
  { label: "All emergencies", number: "112", primary: true },
  { label: "Ambulance", number: "108" },
  { label: "Fire", number: "101" },
  { label: "Police", number: "100" },
  { label: "NDRF (National Disaster Response)", number: "011-26701700" },
  { label: "NDMA flood helpline", number: "1078" },
  { label: "Women in distress", number: "1091" },
];

// A small curated map of state disaster-management helplines.
// MVP: expand as needed. Matched loosely by profile city.
const STATE_HELPLINES: { match: RegExp; label: string; number: string }[] = [
  { match: /maharashtra|mumbai|pune|thane|nagpur|nashik/i, label: "Maharashtra SDMA", number: "022-22027990" },
  { match: /karnataka|bengaluru|bangalore|mysuru|mangaluru/i, label: "Karnataka SDMA", number: "080-22340676" },
  { match: /tamil nadu|chennai|coimbatore|madurai/i, label: "Tamil Nadu SDMA", number: "1070" },
  { match: /kerala|kochi|thiruvananthapuram|kozhikode/i, label: "Kerala SDMA", number: "1077" },
  { match: /west bengal|kolkata|howrah/i, label: "West Bengal SDMA", number: "1070" },
  { match: /telangana|hyderabad/i, label: "Telangana SDMA", number: "040-23454088" },
  { match: /delhi|new delhi|ncr/i, label: "Delhi disaster helpline", number: "1077" },
  { match: /assam|guwahati/i, label: "Assam SDMA", number: "1070" },
  { match: /bihar|patna/i, label: "Bihar SDMA", number: "1070" },
];

export function findStateHelpline(cityOrLocality: string | null | undefined) {
  if (!cityOrLocality) return null;
  return STATE_HELPLINES.find(s => s.match.test(cityOrLocality)) ?? null;
}

interface Props {
  cityOrLocality?: string | null;
  variant?: "compact" | "full";
  className?: string;
  emphasized?: boolean;
}

// Prominent emergency contacts panel. Used on Dashboard and inside the DURING banner.
// Numbers are always visible — never behind a click — because the user should not
// have to hunt for them during an emergency.
export function EmergencyContacts({ cityOrLocality, variant = "full", className, emphasized }: Props) {
  const state = findStateHelpline(cityOrLocality);

  return (
    <section
      className={cn(
        "border-l-2 pl-6",
        emphasized ? "border-severity-severe" : "border-border",
        className,
      )}
      aria-label="Emergency contact numbers"
    >
      <div className="flex items-center gap-2 mb-6">
        {emphasized
          ? <ShieldAlert className="h-4 w-4 text-severity-severe" strokeWidth={1.75} />
          : <Phone className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />}
        <p className={cn("uppercase-label", emphasized ? "text-severity-severe" : "text-muted-foreground")}>
          Emergency contacts
        </p>
      </div>

      <ul className={cn("grid gap-3", variant === "compact" ? "sm:grid-cols-2" : "sm:grid-cols-2 md:grid-cols-3")}>
        {NATIONAL_EMERGENCY_CONTACTS
          .filter(c => variant === "full" || c.primary || c.number === "108")
          .map(c => (
            <li key={c.number} className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <a
                href={`tel:${c.number}`}
                className={cn(
                  "font-serif hover:underline whitespace-nowrap",
                  c.primary ? "text-2xl" : "text-lg",
                )}
              >
                {c.number}
              </a>
            </li>
          ))}
        {state && (
          <li className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
            <span className="text-sm text-muted-foreground">{state.label}</span>
            <a href={`tel:${state.number}`} className="font-serif text-lg hover:underline whitespace-nowrap">
              {state.number}
            </a>
          </li>
        )}
      </ul>
    </section>
  );
}
