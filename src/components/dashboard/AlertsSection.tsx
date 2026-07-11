import { ThermometerSun } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { severityBorderClass } from "@/utils/severity";
import type { UseQueryResult } from "@tanstack/react-query";
import type { Alert } from "@/types";

interface Props {
  alerts: UseQueryResult<Alert[], Error>;
}

export function AlertsSection({ alerts }: Props) {
  const activeAlerts = (alerts.data ?? []).filter(a => a.status !== "after").slice(0, 3);

  return (
    <section className="border-t border-border pt-8">
      <p className="uppercase-label text-muted-foreground mb-8">Active alerts</p>
      {alerts.isLoading ? (
        <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : alerts.isError ? (
        <EmptyState title="Couldn't load alerts" description="Please try again shortly." />
      ) : activeAlerts.length === 0 ? (
        <EmptyState
          icon={<ThermometerSun className="h-6 w-6" strokeWidth={1.5} />}
          title="No active alerts"
          description="Your area is calm."
        />
      ) : (
        <div className="grid gap-4">
          {activeAlerts.map(a => (
            <article key={a.id} className={`border-l-2 pl-6 py-2 ${severityBorderClass[a.severity]}`}>
              <div className="flex items-center gap-3 mb-2">
                <SeverityBadge severity={a.severity} />
                <span className="uppercase-label text-muted-foreground">{a.region}</span>
              </div>
              <h3 className="font-serif text-xl md:text-2xl mb-2">{a.title}</h3>
              <p className="text-muted-foreground max-w-2xl font-light leading-relaxed">{a.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
