import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, ThermometerSun } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SeverityBadge } from "@/components/SeverityBadge";
import { EmptyState } from "@/components/EmptyState";
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
  const greeting = profileQuery.data?.locality ? `${profileQuery.data.locality}` : profileQuery.data?.city ?? "Today";

  return (
    <AppShell>
      <div className="space-y-24 max-w-5xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        >
          <p className="uppercase-label text-muted-foreground mb-6">{greeting}</p>
          <h2 className="font-serif text-4xl md:text-6xl leading-[1.05]">
            The sky today, <em>and what it asks of you.</em>
          </h2>
        </motion.header>

        {/* Weather + summary two-column */}
        <section className="grid md:grid-cols-5 gap-12 items-start">
          <div className="md:col-span-3 border-t border-border pt-8">
            <p className="uppercase-label text-muted-foreground mb-8">Current conditions</p>
            <div className="flex items-baseline gap-4">
              <span className="font-serif text-7xl md:text-8xl">{weather.tempC}°</span>
              <span className="font-serif italic text-2xl text-muted-foreground">{weather.condition.toLowerCase()}</span>
            </div>
            <p className="mt-4 text-muted-foreground">{weather.city}, coastal maharashtra</p>
            <dl className="mt-12 grid grid-cols-3 gap-8">
              {[
                ["Humidity", `${weather.humidity}%`],
                ["Rainfall", `${weather.rainfallMm} mm`],
                ["Wind", `${weather.windKph} km/h`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="uppercase-label text-muted-foreground mb-2">{k}</dt>
                  <dd className="font-serif text-2xl">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="md:col-span-2 md:border-l md:border-border md:pl-12 md:pt-8 border-t border-border pt-8">
            <p className="uppercase-label text-muted-foreground mb-6">Your plan</p>
            <ul className="space-y-5">
              {[
                ["Before", 3, 5],
                ["During", 1, 4],
                ["After", 0, 3],
              ].map(([label, done, total]) => {
                const pct = Math.round((Number(done) / Number(total)) * 100);
                return (
                  <li key={label as string}>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="uppercase-label">{label}</span>
                      <span className="text-xs text-muted-foreground">{done} / {total}</span>
                    </div>
                    <div className="h-px bg-border relative">
                      <div className="absolute inset-y-0 left-0 bg-foreground" style={{ width: `${pct}%`, height: "1px" }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link to="/checklist" className="uppercase-label text-foreground/80 hover:text-foreground inline-flex items-center gap-2 mt-8">
              Open checklist <ArrowRight className="h-3 w-3" />
            </Link>
          </aside>
        </section>

        {/* Alerts */}
        <section className="border-t border-border pt-8">
          <p className="uppercase-label text-muted-foreground mb-8">Active alerts</p>
          {alertsQuery.isLoading ? (
            <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : alertsQuery.isError ? (
            <EmptyState title="Couldn't load alerts" description="Please try again shortly." />
          ) : activeAlerts.length === 0 ? (
            <EmptyState icon={<ThermometerSun className="h-6 w-6" strokeWidth={1.5} />} title="No active alerts" description="Your area is calm. We'll notify you if that changes." />
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

        {/* Quick links row */}
        <section className="border-t border-border pt-8 grid md:grid-cols-3 gap-x-12 gap-y-6">
          {[
            { to: "/checklist", label: "Checklist", body: "Track supplies and safety steps." },
            { to: "/assistant", label: "Ask Varsha", body: "Conversational help in your language." },
            { to: "/travel", label: "Travel advisories", body: "Check safety before you head out." },
          ].map(item => (
            <Link key={item.to} to={item.to} className="group">
              <p className="uppercase-label text-muted-foreground mb-3">{item.label}</p>
              <p className="font-serif text-xl group-hover:italic transition">{item.body}</p>
              <span className="inline-flex items-center gap-2 uppercase-label mt-4 text-foreground/60 group-hover:text-foreground transition">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
