import { memo } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Droplets, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/SeverityBadge";
import { severityBorderClass } from "@/utils/severity";
import { formatCountdown, type AlertState } from "@/utils/alertEngine";
import { cn } from "@/lib/utils";

/**
 * Hero variants for each alert status. Memoized because the parent Dashboard
 * re-renders every minute (countdown clock) while these subtrees are static
 * between status changes.
 */

export const WatchHero = memo(function WatchHero({ state }: { state: AlertState }) {
  const countdown = state.eventStart ? formatCountdown(state.eventStart) : null;
  return (
    <section className={cn(
      "border-t border-border pt-8",
      state.severity !== "normal" && severityBorderClass[state.severity],
      state.severity !== "normal" && "border-l-2 pl-6",
    )}>
      <div className="flex items-center gap-3 mb-4">
        <SeverityBadge severity={state.severity} />
        <span className="uppercase-label text-muted-foreground">Watch</span>
        {countdown && state.severity !== "normal" && (
          <span className="uppercase-label text-foreground/70">Expected {countdown}</span>
        )}
      </div>
      <h3 className="font-serif text-2xl md:text-3xl leading-snug max-w-3xl">{state.headline}</h3>
      <p className="mt-3 text-muted-foreground max-w-2xl font-light leading-relaxed">{state.description}</p>
      {state.severity !== "normal" && (
        <div className="mt-6 flex gap-3">
          <Button asChild variant="outline" size="sm"><Link to="/checklist">Review checklist</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link to="/assistant">Ask a question</Link></Button>
        </div>
      )}
    </section>
  );
});

export const UrgentHero = memo(function UrgentHero({ state }: { state: AlertState }) {
  return (
    <section className="border-l-2 border-severity-severe bg-severity-severe/5 pl-6 pr-6 py-8 rounded-sm">
      <div className="flex items-center gap-3 mb-4">
        <ShieldAlert className="h-5 w-5 text-severity-severe" strokeWidth={1.75} />
        <SeverityBadge severity={state.severity} />
        <span className="uppercase-label text-severity-severe">Active now</span>
      </div>
      <h3 className="font-serif text-3xl md:text-4xl leading-snug max-w-3xl">{state.headline}</h3>
      <p className="mt-3 text-foreground/80 max-w-2xl font-light leading-relaxed">{state.description}</p>
    </section>
  );
});

export const RecoveryHero = memo(function RecoveryHero({ state }: { state: AlertState }) {
  return (
    <section className="border-t border-border pt-8">
      <div className="flex items-center gap-3 mb-4">
        <Droplets className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <span className="uppercase-label text-muted-foreground">Recovery phase</span>
      </div>
      <h3 className="font-serif text-2xl md:text-3xl leading-snug max-w-3xl">{state.headline}</h3>
      <p className="mt-3 text-muted-foreground max-w-2xl font-light leading-relaxed">{state.description}</p>
    </section>
  );
});

export const ChecklistLinkSection = memo(function ChecklistLinkSection() {
  return (
    <section className="border-l-2 border-severity-severe pl-6">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="h-4 w-4 text-severity-severe" strokeWidth={1.75} />
        <p className="uppercase-label text-severity-severe">Right now</p>
      </div>
      <p className="max-w-2xl font-light leading-relaxed mb-4">
        Move to the highest safe floor. Unplug non-essential appliances. Keep phones charged. Stay off flooded roads — six inches of moving water can knock you down.
      </p>
      <Button asChild variant="outline" size="sm"><Link to="/checklist">Open full checklist</Link></Button>
    </section>
  );
});
