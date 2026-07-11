import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, RefreshCw, ThermometerSun, ShieldAlert, Droplets, ListChecks } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SeverityBadge } from "@/components/SeverityBadge";
import { EmptyState } from "@/components/EmptyState";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { EmergencyContacts } from "@/components/EmergencyContacts";
import { SafetyRecommendations } from "@/components/SafetyRecommendations";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPreparednessPlan } from "@/services/ai";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/profile";
import { severityBorderClass } from "@/utils/severity";
import { useAlertState } from "@/hooks/useAlertState";
import { formatCountdown, formatRelativeTime } from "@/utils/alertEngine";
import { cn } from "@/lib/utils";
import type { PreparednessPlan } from "@/types";

const PLAN_SECTIONS: { key: keyof PreparednessPlan; title: string; body: string }[] = [
  { key: "immediate_actions", title: "Immediate actions", body: "The first 24–48 hours." },
  { key: "essential_supplies", title: "Essential supplies", body: "Tailored to your household size." },
  { key: "evacuation_considerations", title: "Evacuation", body: "Given your housing and locality." },
  { key: "communication_plan", title: "Communication", body: "Contacts, meeting points, check-ins." },
  { key: "household_specific_notes", title: "Just for your household", body: "Elderly, children, pets, floor." },
];

const RECOVERY_GUIDANCE = [
  { title: "Safe drinking water", body: "Boil water for 1 minute before drinking. Avoid tap water until civic authorities issue an all-clear. Discard uncovered food that may have contacted flood water." },
  { title: "Mould & damp prevention", body: "Open windows and use fans to dry rooms within 24–48 hours. Remove soaked carpets and mattresses. Wipe hard surfaces with a mild bleach solution (1 cup per 4L)." },
  { title: "Document damage for insurance", body: "Photograph every damaged item and area before cleanup. Keep receipts for repairs and temporary lodging. File a claim within your insurer's stated window (often 7 days)." },
  { title: "Electrical safety", body: "Do not switch on appliances that were submerged. Have a qualified electrician inspect wiring before restoring power." },
];


export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile", user?.id], queryFn: () => getProfile(user!.id), enabled: !!user });
  const city = profileQuery.data?.city ?? null;

  const { state, weather, alerts } = useAlertState(city);

  const planQuery = useQuery({
    queryKey: ["plan", user?.id, profileQuery.data?.language],
    queryFn: () => fetchPreparednessPlan(false),
    enabled: !!user && !!profileQuery.data?.onboarded,
    staleTime: Infinity,
  });

  const regenerate = async () => {
    await fetchPreparednessPlan(true);
    queryClient.invalidateQueries({ queryKey: ["plan", user?.id] });
  };

  // Live countdown clock during BEFORE state
  const [, tick] = useState(0);
  useEffect(() => {
    if (state.status !== "before" || !state.eventStart) return;
    const id = setInterval(() => tick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, [state.status, state.eventStart]);

  const activeAlerts = (alerts.data ?? []).filter(a => a.status !== "after").slice(0, 3);
  const greeting = profileQuery.data?.locality ?? profileQuery.data?.city ?? "Today";
  const lastUpdated = weather.data?.fetchedAt;

  return (
    <AppShell>
      <div className="space-y-24 max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="flex items-start justify-between gap-6 flex-wrap"
        >
          <div>
            <p className="uppercase-label text-muted-foreground mb-6">{greeting}</p>
            <h2 className="font-serif text-4xl md:text-6xl leading-[1.05]">
              The sky today, <em>and what it asks of you.</em>
            </h2>
          </div>
          <LanguageSwitcher />
        </motion.header>

        {/* State-specific hero */}
        {state.status === "during" ? (
          <UrgentHero state={state} />
        ) : state.status === "after" ? (
          <RecoveryHero state={state} />
        ) : (
          <WatchHero state={state} />
        )}

        {/* DURING: emergency contacts + checklist surface up top */}
        {state.status === "during" && (
          <>
            <EmergencyContactsSection />
            <ChecklistLinkSection />
          </>
        )}

        {/* Weather */}
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

                {/* Simple 12h rainfall forecast strip */}
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
              {[
                { to: "/assistant", label: "Ask Varsha" },
                { to: "/checklist", label: "Open checklist" },
                { to: "/travel", label: "Travel advisories" },
              ].map(item => (
                <Link key={item.to} to={item.to} className="flex items-center justify-between border-b border-border pb-3 uppercase-label text-foreground/70 hover:text-foreground transition">
                  {item.label} <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>

            {/* Weather-derived warnings */}
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

        {/* Alerts */}
        <section className="border-t border-border pt-8">
          <p className="uppercase-label text-muted-foreground mb-8">Active alerts</p>
          {alerts.isLoading ? (
            <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : alerts.isError ? (
            <EmptyState title="Couldn't load alerts" description="Please try again shortly." />
          ) : activeAlerts.length === 0 ? (
            <EmptyState icon={<ThermometerSun className="h-6 w-6" strokeWidth={1.5} />} title="No active alerts" description="Your area is calm." />
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

        {/* AFTER: recovery guidance replaces the plan emphasis */}
        {state.status === "after" && (
          <section className="border-t border-border pt-8">
            <div className="mb-10">
              <p className="uppercase-label text-muted-foreground mb-4">Recovery</p>
              <h3 className="font-serif text-3xl md:text-4xl">After the storm.</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
              {RECOVERY_GUIDANCE.map(g => (
                <article key={g.title}>
                  <p className="uppercase-label text-muted-foreground mb-3">{g.title}</p>
                  <p className="text-sm leading-relaxed font-light text-foreground/80">{g.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Personalized plan — de-emphasized during DURING (but still available) */}
        <section className={cn("border-t border-border pt-8", state.status === "during" && "opacity-60")}>
          <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
            <div>
              <p className="uppercase-label text-muted-foreground mb-4">Your plan</p>
              <h3 className="font-serif text-3xl md:text-4xl">Prepared for <em>your</em> home.</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={regenerate} disabled={planQuery.isFetching}
              className="uppercase-label text-muted-foreground hover:text-foreground gap-2">
              <RefreshCw className={`h-3 w-3 ${planQuery.isFetching ? "animate-spin" : ""}`} strokeWidth={1.5} />
              Regenerate
            </Button>
          </div>

          {planQuery.isLoading ? (
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">{[1,2,3,4].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
          ) : planQuery.isError ? (
            <EmptyState
              title="Couldn't generate your plan"
              description={planQuery.error instanceof Error ? planQuery.error.message : "Please try again."}
              action={<Button variant="outline" onClick={regenerate}>Try again</Button>}
            />
          ) : planQuery.data ? (
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-14">
              {PLAN_SECTIONS.map(section => (
                <article key={section.key}>
                  <p className="uppercase-label text-muted-foreground mb-3">{section.title}</p>
                  <p className="font-serif text-xl mb-5 italic text-muted-foreground">{section.body}</p>
                  <ul className="space-y-3">
                    {planQuery.data[section.key].map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed">
                        <span className="text-muted-foreground font-serif">{String(i + 1).padStart(2, "0")}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No plan yet" description="Complete onboarding to generate one." />
          )}
        </section>
      </div>
    </AppShell>
  );
}

function WatchHero({ state }: { state: ReturnType<typeof useAlertState>["state"] }) {
  const countdown = state.eventStart ? formatCountdown(state.eventStart) : null;
  return (
    <section className={cn("border-t border-border pt-8", state.severity !== "normal" && severityBorderClass[state.severity], state.severity !== "normal" && "border-l-2 pl-6")}>
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
}

function UrgentHero({ state }: { state: ReturnType<typeof useAlertState>["state"] }) {
  return (
    <section
      className="border-l-2 border-severity-severe bg-severity-severe/5 pl-6 pr-6 py-8 rounded-sm"
      // Redundant visual + aria-live is on the global banner
    >
      <div className="flex items-center gap-3 mb-4">
        <ShieldAlert className="h-5 w-5 text-severity-severe" strokeWidth={1.75} />
        <SeverityBadge severity={state.severity} />
        <span className="uppercase-label text-severity-severe">Active now</span>
      </div>
      <h3 className="font-serif text-3xl md:text-4xl leading-snug max-w-3xl">{state.headline}</h3>
      <p className="mt-3 text-foreground/80 max-w-2xl font-light leading-relaxed">{state.description}</p>
    </section>
  );
}

function RecoveryHero({ state }: { state: ReturnType<typeof useAlertState>["state"] }) {
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
}

function EmergencyContactsSection() {
  return (
    <section className="border-l-2 border-severity-severe pl-6">
      <div className="flex items-center gap-2 mb-6">
        <Phone className="h-4 w-4 text-severity-severe" strokeWidth={1.75} />
        <p className="uppercase-label text-severity-severe">Emergency contacts</p>
      </div>
      <ul className="grid sm:grid-cols-2 gap-4">
        {EMERGENCY_CONTACTS.map(c => (
          <li key={c.number} className="flex items-baseline justify-between border-b border-border pb-3">
            <span className="text-sm">{c.label}</span>
            <a href={`tel:${c.number}`} className="font-serif text-xl hover:underline">{c.number}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChecklistLinkSection() {
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
}

function RainStrip({ hourly }: { hourly: { time: string; rainMm: number; precipProb: number }[] }) {
  const max = Math.max(1, ...hourly.map(h => h.rainMm));
  return (
    <div className="flex items-end gap-1 h-24">
      {hourly.map(h => {
        const height = Math.max(2, (h.rainMm / max) * 100);
        const hour = new Date(h.time).getHours();
        return (
          <div key={h.time} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-primary/70"
              style={{ height: `${height}%` }}
              title={`${h.rainMm.toFixed(1)}mm · ${h.precipProb}%`}
            />
            <span className="text-[10px] text-muted-foreground">{hour}h</span>
          </div>
        );
      })}
    </div>
  );
}
