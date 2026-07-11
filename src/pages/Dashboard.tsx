import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CloudRain, Droplets, Wind, ThermometerSun, ArrowRight, ListChecks, MessageSquare, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SeverityBadge } from "@/components/SeverityBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listAlerts } from "@/services/alerts";
import { mockWeather } from "@/services/mockData";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/profile";
import { severityBorderClass } from "@/utils/severity";

export default function Dashboard() {
  const { user } = useAuth();
  const profileQuery = useQuery({ queryKey: ["profile", user?.id], queryFn: () => getProfile(user!.id), enabled: !!user });
  const alertsQuery = useQuery({ queryKey: ["alerts"], queryFn: listAlerts });

  const weather = mockWeather;
  const activeAlerts = (alertsQuery.data ?? []).filter(a => a.status !== "after").slice(0, 3);

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl">
        <div>
          <p className="text-sm text-muted-foreground">
            {profileQuery.isLoading ? "Loading…" : `Hi${profileQuery.data?.locality ? `, ${profileQuery.data.locality}` : ""}`}
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Your monsoon overview</h2>
        </div>

        {/* Weather card */}
        <section className="rounded-2xl bg-gradient-sky text-primary-foreground p-6 md:p-8 shadow-elev">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-80">Current weather</p>
              <p className="text-lg font-medium mt-1">{weather.city}</p>
              <p className="text-4xl md:text-5xl font-semibold mt-2">{weather.tempC}°C</p>
              <p className="opacity-90 mt-1">{weather.condition}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 min-w-[280px]">
              <Stat icon={<Droplets className="h-4 w-4" />} label="Humidity" value={`${weather.humidity}%`} />
              <Stat icon={<CloudRain className="h-4 w-4" />} label="Rain" value={`${weather.rainfallMm}mm`} />
              <Stat icon={<Wind className="h-4 w-4" />} label="Wind" value={`${weather.windKph}km/h`} />
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Active alerts</h3>
          </div>
          {alertsQuery.isLoading ? (
            <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : alertsQuery.isError ? (
            <EmptyState title="Couldn't load alerts" description="Please try again shortly." />
          ) : activeAlerts.length === 0 ? (
            <EmptyState icon={<ThermometerSun className="h-8 w-8" />} title="No active alerts" description="Your area is currently calm. We'll notify you if that changes." />
          ) : (
            <div className="grid gap-3">
              {activeAlerts.map(a => (
                <article key={a.id} className={`rounded-xl border-l-4 bg-card p-4 shadow-soft ${severityBorderClass[a.severity]}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge severity={a.severity} />
                        <span className="text-xs text-muted-foreground">{a.region}</span>
                      </div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Preparedness summary */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Your preparedness plan</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <PlanCard title="Before monsoon" body="Waterproof documents, stock ORS, service drainage." done={3} total={5} />
            <PlanCard title="During heavy rain" body="Avoid flooded roads, unplug appliances, keep phones charged." done={1} total={4} />
            <PlanCard title="After the storm" body="Boil water before use, check for mosquito breeding." done={0} total={3} />
          </div>
        </section>

        {/* Quick links */}
        <section className="grid gap-3 md:grid-cols-3">
          <QuickLink to="/checklist" icon={<ListChecks className="h-5 w-5" />} title="Emergency checklist" />
          <QuickLink to="/assistant" icon={<MessageSquare className="h-5 w-5" />} title="Ask the AI assistant" />
          <QuickLink to="/travel" icon={<MapPin className="h-5 w-5" />} title="Travel advisories" />
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/15 backdrop-blur rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-xs opacity-90">{icon}{label}</div>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function PlanCard({ title, body, done, total }: { title: string; body: string; done: number; total: number }) {
  const pct = Math.round((done / total) * 100);
  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{body}</p>
      <div className="mt-4">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{done} of {total} steps complete</p>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, title }: { to: string; icon: React.ReactNode; title: string }) {
  return (
    <Link to={to}>
      <Button variant="outline" className="w-full h-auto py-4 justify-between">
        <span className="flex items-center gap-3">{icon}{title}</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}
