// ─────────────────────────────────────────────────────────────────────────────
// STATIC SEED DATA — MVP only.
// This is a small, curated list of well-known flood-prone areas in India.
// Replace with a real data source (state disaster-management APIs, IMD nowcast
// polygons, or a maintained JSON dataset) before production.
// Names and matching are intentionally coarse so a destination like "Mumbai"
// matches "Mumbai" and any listed micro-locality (Sion, Kurla, Andheri, etc.).
// ─────────────────────────────────────────────────────────────────────────────

export interface FloodProneEntry {
  city: string;
  region: string;
  known_hotspots: string[];
  notes: string;
  historical_severity: "watch" | "warning" | "severe";
}

export const floodProneAreas: FloodProneEntry[] = [
  {
    city: "Mumbai",
    region: "Maharashtra (coastal)",
    known_hotspots: ["Sion", "Kurla", "Hindmata", "Andheri Subway", "Milan Subway", "Dadar TT", "King's Circle"],
    notes: "Chronic waterlogging in monsoon. Underpasses and subways flood within an hour of heavy rain.",
    historical_severity: "severe",
  },
  {
    city: "Chennai",
    region: "Tamil Nadu (coastal)",
    known_hotspots: ["Velachery", "Tambaram", "Mudichur", "Pallikaranai", "T. Nagar"],
    notes: "Post-2015 flood mitigation ongoing; low-lying southern suburbs still flood in cyclonic spells.",
    historical_severity: "severe",
  },
  {
    city: "Bengaluru",
    region: "Karnataka",
    known_hotspots: ["Bellandur", "Sarjapur Road", "Silk Board", "HSR Layout", "Marathahalli"],
    notes: "Rapid urbanisation has choked stormwater drains; expect commute delays in intense showers.",
    historical_severity: "warning",
  },
  {
    city: "Kolkata",
    region: "West Bengal",
    known_hotspots: ["Behala", "Thakurpukur", "Muchipara", "Ballygunge", "Central Avenue"],
    notes: "Combined tidal + rain flooding possible during Bay of Bengal depressions.",
    historical_severity: "warning",
  },
  {
    city: "Kochi",
    region: "Kerala (coastal)",
    known_hotspots: ["Kaloor", "Palarivattom", "Vyttila", "Edappally"],
    notes: "Kerala 2018-scale events remain a reference point; monitor dam-release advisories.",
    historical_severity: "severe",
  },
  {
    city: "Hyderabad",
    region: "Telangana",
    known_hotspots: ["Malakpet", "Falaknuma", "Nampally", "Musi river bank"],
    notes: "Musi river swells rapidly; low-lying old-city wards see heavy inundation.",
    historical_severity: "warning",
  },
  {
    city: "Delhi",
    region: "NCR",
    known_hotspots: ["Minto Bridge", "ITO", "Ring Road (Yamuna stretch)", "Pul Prahladpur underpass"],
    notes: "Yamuna-side low-lying areas evacuate above 205.33m; underpasses flood in short intense bursts.",
    historical_severity: "warning",
  },
  {
    city: "Pune",
    region: "Maharashtra",
    known_hotspots: ["Sinhagad Road", "Ekta Nagar", "Warje", "Katraj"],
    notes: "Sudden dam releases from Khadakwasla can flood downstream neighbourhoods within hours.",
    historical_severity: "warning",
  },
  {
    city: "Guwahati",
    region: "Assam",
    known_hotspots: ["Anil Nagar", "Nabin Nagar", "Rukminigaon"],
    notes: "Brahmaputra-fed flash floods and urban waterlogging both common in peak monsoon.",
    historical_severity: "severe",
  },
  {
    city: "Patna",
    region: "Bihar",
    known_hotspots: ["Rajendra Nagar", "Kankarbagh", "Pataliputra Colony"],
    notes: "Ganga backflow + drainage failure combine in prolonged monsoon spells.",
    historical_severity: "severe",
  },
  {
    city: "Lonavala",
    region: "Maharashtra (ghats)",
    known_hotspots: ["Old Mumbai-Pune Highway", "Bhushi Dam approach"],
    notes: "Landslide-prone ghat sections during heavy rain; expect 1–2h travel delays.",
    historical_severity: "warning",
  },
  {
    city: "Chikmagalur",
    region: "Karnataka (ghats)",
    known_hotspots: ["Mullayanagiri approach", "Kalasa road"],
    notes: "Ghat roads slippery with tree-fall risk; travel possible with caution.",
    historical_severity: "watch",
  },
];

// Match by case-insensitive city name OR appearance as a known hotspot substring.
export function findFloodProneMatch(destination: string): FloodProneEntry | null {
  const q = destination.trim().toLowerCase();
  if (!q) return null;
  return (
    floodProneAreas.find(e => e.city.toLowerCase() === q) ??
    floodProneAreas.find(e =>
      e.city.toLowerCase().includes(q) ||
      q.includes(e.city.toLowerCase()) ||
      e.known_hotspots.some(h => q.includes(h.toLowerCase()) || h.toLowerCase().includes(q))
    ) ??
    null
  );
}
