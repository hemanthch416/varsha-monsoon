import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { EmergencyContacts } from "@/components/EmergencyContacts";
import { SafetyRecommendations } from "@/components/SafetyRecommendations";
import { WatchHero, UrgentHero, RecoveryHero, ChecklistLinkSection } from "@/components/dashboard/AlertHeroes";
import { WeatherSection } from "@/components/dashboard/WeatherSection";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { PlanSection } from "@/components/dashboard/PlanSection";
import { RecoverySection } from "@/components/dashboard/RecoverySection";
import { fetchPreparednessPlan } from "@/services/ai";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAlertState } from "@/hooks/useAlertState";
import { COUNTDOWN_TICK_MS, STALE_TIME_MS } from "@/config/constants";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useProfile();
  const city = profileQuery.data?.city ?? null;
  const locality = profileQuery.data?.locality ?? city;

  const { state, weather, alerts } = useAlertState(city);

  const planQuery = useQuery({
    queryKey: ["plan", user?.id, profileQuery.data?.language],
    queryFn: () => fetchPreparednessPlan(false),
    enabled: !!user && !!profileQuery.data?.onboarded,
    staleTime: STALE_TIME_MS.infinite,
  });

  const regenerate = async () => {
    await fetchPreparednessPlan(true);
    queryClient.invalidateQueries({ queryKey: ["plan", user?.id] });
  };

  // Force a re-render each minute so the BEFORE-state countdown stays fresh.
  const [, tick] = useState(0);
  useEffect(() => {
    if (state.status !== "before" || !state.eventStart) return;
    const id = setInterval(() => tick(t => t + 1), COUNTDOWN_TICK_MS);
    return () => clearInterval(id);
  }, [state.status, state.eventStart]);

  const greeting = locality ?? "Today";

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

        {state.status === "during" ? (
          <UrgentHero state={state} />
        ) : state.status === "after" ? (
          <RecoveryHero state={state} />
        ) : (
          <WatchHero state={state} />
        )}

        {state.status === "during" && (
          <>
            <EmergencyContacts cityOrLocality={locality} emphasized />
            <ChecklistLinkSection />
          </>
        )}

        <SafetyRecommendations state={state} profile={profileQuery.data ?? null} />

        {state.status !== "during" && (
          <EmergencyContacts cityOrLocality={locality} />
        )}

        <WeatherSection weather={weather} city={city} />

        <AlertsSection alerts={alerts} />

        {state.status === "after" && <RecoverySection />}

        <PlanSection planQuery={planQuery} onRegenerate={regenerate} dimmed={state.status === "during"} />
      </div>
    </AppShell>
  );
}
