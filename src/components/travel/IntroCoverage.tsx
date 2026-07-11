import { MapPin } from "lucide-react";
import { floodProneAreas } from "@/services/floodProneAreas";

export function IntroCoverage() {
  return (
    <section className="border-t border-border pt-8">
      <p className="uppercase-label text-muted-foreground mb-6">Cities on file</p>
      <p className="text-sm text-muted-foreground mb-8 max-w-xl font-light">
        Our curated flood-hotspot dataset covers these cities today. Try any of them,
        or search a nearby city — we'll still fetch live weather for the destination.
      </p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
        {floodProneAreas.map(a => (
          <li key={a.city} className="flex items-center gap-2 text-sm">
            <MapPin className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
            {a.city}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-muted-foreground/70 max-w-xl">
        MVP note: hotspots ship as static seed data. Production would pull from state
        disaster-management APIs and IMD nowcast polygons.
      </p>
    </section>
  );
}
