import { useState } from "react";
import { Search, MapPin, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SeverityBadge } from "@/components/SeverityBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { travelQuerySchema } from "@/utils/schemas";
import { mockAdvisories } from "@/services/mockData";
import { severityBorderClass } from "@/utils/severity";
import type { TravelAdvisory } from "@/types";

export default function Travel() {
  const { toast } = useToast();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [results, setResults] = useState<TravelAdvisory[]>(mockAdvisories);
  const [loading, setLoading] = useState(false);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = travelQuerySchema.safeParse({ origin, destination });
    if (!parsed.success) {
      toast({ title: "Check inputs", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    // Placeholder — real advisory service will be wired later.
    setTimeout(() => {
      setResults([{
        route: `${parsed.data.origin} → ${parsed.data.destination}`,
        severity: "watch",
        summary: "Monsoon conditions on this route. Check local advisories before departure.",
        hazards: ["Waterlogging possible", "Reduced visibility"],
      }, ...mockAdvisories]);
      setLoading(false);
    }, 500);
  };

  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight">Travel advisories</h2>
          <p className="text-sm text-muted-foreground mt-1">Check monsoon safety conditions for a route.</p>
        </header>

        <form onSubmit={search} className="rounded-xl border bg-card p-5 shadow-soft space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin">From</Label>
              <Input id="origin" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Mumbai" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">To</Label>
              <Input id="destination" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Lonavala" />
            </div>
          </div>
          <Button type="submit" className="gap-2" disabled={loading}>
            <Search className="h-4 w-4" /> {loading ? "Checking…" : "Check route"}
          </Button>
        </form>

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Current advisories</h3>
          {results.length === 0 ? (
            <EmptyState icon={<MapPin className="h-8 w-8" />} title="No advisories yet" description="Search a route above to see conditions." />
          ) : (
            results.map((a, i) => (
              <article key={i} className={`rounded-xl border-l-4 bg-card p-4 shadow-soft ${severityBorderClass[a.severity]}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-medium">{a.route}</p>
                  <SeverityBadge severity={a.severity} />
                </div>
                <p className="text-sm text-muted-foreground mb-3">{a.summary}</p>
                <ul className="space-y-1">
                  {a.hazards.map(h => (
                    <li key={h} className="text-xs flex items-center gap-2 text-muted-foreground">
                      <AlertTriangle className="h-3 w-3" /> {h}
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
