import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { AssessmentView } from "@/components/travel/AssessmentView";
import { IntroCoverage } from "@/components/travel/IntroCoverage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { travelQuerySchema } from "@/utils/schemas";
import { assessRoute } from "@/services/travelAdvisory";
import { TRAVEL_INPUT_DEBOUNCE_MS, TRAVEL_MIN_INPUT_LEN } from "@/config/constants";

export default function Travel() {
  const { toast } = useToast();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const debouncedOrigin = useDebouncedValue(origin, TRAVEL_INPUT_DEBOUNCE_MS);
  const debouncedDestination = useDebouncedValue(destination, TRAVEL_INPUT_DEBOUNCE_MS);
  const lastFetched = useRef<string>("");

  const mutation = useMutation({
    mutationFn: (input: { origin: string; destination: string }) => assessRoute(input.origin, input.destination),
    onError: (err) => toast({
      title: "Couldn't fetch advisory",
      description: err instanceof Error ? err.message : "Try again",
      variant: "destructive",
    }),
  });

  const runAdvisory = (o: string, d: string, notifyOnInvalid = false) => {
    const parsed = travelQuerySchema.safeParse({ origin: o, destination: d });
    if (!parsed.success) {
      if (notifyOnInvalid) {
        toast({ title: "Check inputs", description: parsed.error.errors[0].message, variant: "destructive" });
      }
      return;
    }
    const key = `${parsed.data.origin}→${parsed.data.destination}`;
    if (key === lastFetched.current) return;
    lastFetched.current = key;
    mutation.mutate({ origin: parsed.data.origin, destination: parsed.data.destination });
  };

  // Auto-run once both inputs are stable and valid — avoids hammering the API
  // as the user types, but removes the need to click for the common case.
  useEffect(() => {
    if (
      debouncedOrigin.trim().length >= TRAVEL_MIN_INPUT_LEN &&
      debouncedDestination.trim().length >= TRAVEL_MIN_INPUT_LEN
    ) {
      runAdvisory(debouncedOrigin, debouncedDestination);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedOrigin, debouncedDestination]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    lastFetched.current = ""; // force re-run on manual submit
    runAdvisory(origin, destination, true);
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
