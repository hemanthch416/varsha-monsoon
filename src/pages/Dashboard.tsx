import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw, ThermometerSun } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SeverityBadge } from "@/components/SeverityBadge";
import { EmptyState } from "@/components/EmptyState";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listAlerts } from "@/services/alerts";
import { fetchPreparednessPlan } from "@/services/ai";
import { mockWeather } from "@/services/mockData";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/profile";
import { severityBorderClass } from "@/utils/severity";
import { useQueryClient } from "@tanstack/react-query";

const PLAN_SECTIONS: { key: keyof import("@/types").PreparednessPlan; title: string; body: string }[] = [
  { key: "immediate_actions", title: "Immediate actions", body: "The first 24–48 hours." },
  { key: "essential_supplies", title: "Essential supplies", body: "Tailored to your household size." },
  { key: "evacuation_considerations", title: "Evacuation", body: "Given your housing and locality." },
  { key: "communication_plan", title: "Communication", body: "Contacts, meeting points, check-ins." },
  { key: "household_specific_notes", title: "Just for your household", body: "Elderly, children, pets, floor." },
];

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile", user?.id], queryFn: () => getProfile(user!.id), enabled: !!user });
  const alertsQuery = useQuery({ queryKey: ["alerts"], queryFn: listAlerts });

  // Plan cache is keyed by user + language so a language switch refetches automatically.
  const planQuery = useQuery({
    queryKey: ["plan", user?.id, profileQuery.data?.language],
    queryFn: () => fetchPreparednessPlan(false),
    enabled: !!user && !!profileQuery.data?.onboarded,
    staleTime: Infinity,
  });

  const weather = mockWeather;
  const activeAlerts = (alertsQuery.data ?? []).filter(a => a.status !== "after").slice(0, 3);
  const greeting = profileQuery.data?.locality ?? profileQuery.data?.city ?? "Today";

  const regenerate = async () => {
    await fetchPreparednessPlan(true);
    queryClient.invalidateQueries({ queryKey: ["plan", user?.id] });
  };

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

        {/* Weather */}
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

        {/* Personalized plan */}
        <section className="border-t border-border pt-8">
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
