import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RainStrip } from "./RainStrip";
import { severityBorderClass } from "@/utils/severity";
import { formatRelativeTime } from "@/utils/alertEngine";
import { cn } from "@/lib/utils";
import type { UseQueryResult } from "@tanstack/react-query";
import type { WeatherData } from "@/services/weather";

interface Props {
  weather: UseQueryResult<WeatherData | null, Error>;
  city: string | null;
}

const QUICK_ACTIONS: { to: string; label: string }[] = [
  { to: "/assistant", label: "Ask Varsham" },
  { to: "/checklist", label: "Open checklist" },
  { to: "/travel", label: "Travel advisories" },
];

export function WeatherSection({ weather, city }: Props) {
  const lastUpdated = weather.data?.fetchedAt;

  return (
    <section className="grid md:grid-cols-5 gap-12 items-start">
      <div className="md:col-span-3 border-t border-border pt-8">
        <div className="flex items-baseline justify-between mb-8 gap-4 flex-wrap">
          <p className="uppercase-label text-muted-foreground">Current conditions</p>
          {lastUpdated && (
            <span className="uppercase-label text-muted-foreground/70" title={new Date(lastUpdated).toLocaleString()}>
              Updated {formatRelativeTime(lastUpdated)}
            </span>
          )}
        </div>

        {weather.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : weather.isError ? (
          <EmptyState
            title="Couldn't reach the weather service"
            description="We'll keep trying quietly in the background."
            action={<Button variant="outline" size="sm" onClick={() => weather.refetch()}>Retry now</Button>}
          />
        ) : !weather.data ? (
          <EmptyState title="Location not found" description={`Couldn't locate "${city}". Update it in Settings.`} />
        ) : (
          <>
            <div className="flex items-baseline gap-4">
              <span className="font-serif text-7xl md:text-8xl">{weather.data.current.tempC}°</span>
              <span className="font-serif italic text-2xl text-muted-foreground">{weather.data.current.condition.toLowerCase()}</span>
            </div>
            <p className="mt-4 text-muted-foreground">
              {weather.data.location.name}
              {weather.data.location.admin1 ? `, ${weather.data.location.admin1}` : ""}
            </p>
            <dl className="mt-12 grid grid-cols-3 gap-8">
              {[
                ["Humidity", `${weather.data.current.humidity}%`],
                ["Rain (now)", `${weather.data.current.rainfallMm.toFixed(1)} mm`],
                ["Wind", `${weather.data.current.windKph} km/h`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="uppercase-label text-muted-foreground mb-2">{k}</dt>
                  <dd className="font-serif text-2xl">{v}</dd>
                </div>
              ))}
            </dl>

            {weather.data.hourly.length > 0 && (
              <div className="mt-12">
                <p className="uppercase-label text-muted-foreground mb-4">Rainfall — next 12 hours</p>
                <RainStrip hourly={weather.data.hourly.slice(0, 12)} />
              </div>
            )}
          </>
        )}
      </div>

      <aside className="md:col-span-2 md:border-l md:border-border md:pl-12 md:pt-8 border-t border-border pt-8">
        <p className="uppercase-label text-muted-foreground mb-6">Quick actions</p>
        <div className="space-y-4">
          {QUICK_ACTIONS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center justify-between border-b border-border pb-3 uppercase-label text-foreground/70 hover:text-foreground transition"
            >
              {item.label} <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
        </div>

        {weather.data && weather.data.warnings.length > 0 && (
          <div className="mt-10">
            <p className="uppercase-label text-muted-foreground mb-4">Forecast warnings</p>
            <ul className="space-y-3">
              {weather.data.warnings.map(w => (
                <li key={w.id} className={cn("border-l-2 pl-4 py-1", severityBorderClass[w.severity])}>
                  <p className="text-sm">{w.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-light">{w.message}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </section>
  );
}
