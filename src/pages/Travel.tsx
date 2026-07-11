import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, AlertTriangle, MapPin, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SeverityBadge } from "@/components/SeverityBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { travelQuerySchema } from "@/utils/schemas";
import { assessRoute, type TravelAssessment } from "@/services/travelAdvisory";
import { severityBorderClass } from "@/utils/severity";
import { floodProneAreas } from "@/services/floodProneAreas";

export default function Travel() {
  const { toast } = useToast();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const mutation = useMutation({
    mutationFn: (input: { origin: string; destination: string }) => assessRoute(input.origin, input.destination),
    onError: (err) => toast({
      title: "Couldn't fetch advisory",
      description: err instanceof Error ? err.message : "Try again",
      variant: "destructive",
    }),
  });

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = travelQuerySchema.safeParse({ origin, destination });
    if (!parsed.success) {
      toast({ title: "Check inputs", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    mutation.mutate({ origin: parsed.data.origin!, destination: parsed.data.destination! });
  };

  const result = mutation.data;

  return (
    <AppShell>
      <div className="max-w-3xl space-y-16">
        <header>
          <p className="uppercase-label text-muted-foreground mb-6">Before you leave</p>
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.05]">
            Is the road <em>ready</em> for you?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl font-light">
            We combine live weather at your destination with a curated dataset of
            monsoon flood hotspots across India to give you a plain-English safety read.
          </p>
        </header>

        <form onSubmit={search} className="border-t border-border pt-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin" className="uppercase-label text-muted-foreground">From</Label>
              <Input
                id="origin"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                placeholder="Mumbai"
                className="rounded-none border-0 border-b border-border focus-visible:ring-0 focus-visible:border-foreground px-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination" className="uppercase-label text-muted-foreground">To</Label>
              <Input
                id="destination"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="Lonavala"
                className="rounded-none border-0 border-b border-border focus-visible:ring-0 focus-visible:border-foreground px-0"
              />
            </div>
          </div>
          <Button type="submit" variant="outline" className="uppercase-label gap-2" disabled={mutation.isPending}>
            <Search className="h-3 w-3" strokeWidth={1.5} /> {mutation.isPending ? "Checking…" : "Check route"}
          </Button>
        </form>

        {mutation.isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : mutation.isError ? (
          <EmptyState title="Couldn't fetch advisory" description="Please try again shortly." />
        ) : result ? (
          <AssessmentView result={result} />
        ) : (
          <IntroCoverage />
        )}
      </div>
    </AppShell>
  );
}

function AssessmentView({ result }: { result: TravelAssessment }) {
  return (
    <section className={`border-l-2 pl-6 ${severityBorderClass[result.rating]}`}>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SeverityBadge severity={result.rating} />
        <span className="uppercase-label text-muted-foreground">
          {result.origin} → {result.destination}
        </span>
      </div>
      <h3 className="font-serif text-2xl md:text-3xl leading-snug">{result.headline}</h3>
      <p className="mt-4 text-muted-foreground max-w-2xl font-light leading-relaxed">{result.summary}</p>

      {result.destinationNotFound && (
        <p className="mt-4 text-sm text-severity-warning">
          Couldn't locate "{result.destination}" for live weather. Recommendations below are based on the flood-hotspot dataset only.
        </p>
      )}

      <div className="mt-12 grid md:grid-cols-2 gap-x-16 gap-y-10">
        <div>
          <p className="uppercase-label text-muted-foreground mb-4">Recommendations</p>
          <ul className="space-y-3">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="uppercase-label text-muted-foreground mb-4">Hazards on file</p>
          {result.hazards.length === 0 ? (
            <p className="text-sm text-muted-foreground">None recorded for this destination.</p>
          ) : (
            <ul className="space-y-3">
              {result.hazards.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {result.weather && (
        <div className="mt-12 border-t border-border pt-6 grid grid-cols-3 gap-8 max-w-lg">
          <Stat label="Temp" value={`${result.weather.current.tempC}°`} />
          <Stat label="Condition" value={result.weather.current.condition} />
          <Stat label="Rain (24h)" value={`${result.weather.hourly.reduce((s, h) => s + h.rainMm, 0).toFixed(0)}mm`} />
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="uppercase-label text-muted-foreground mb-1">{label}</p>
      <p className="font-serif text-lg">{value}</p>
    </div>
  );
}

function IntroCoverage() {
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
