import { useEffect, useState } from "react";
import { AlertTriangle, X, Info, ShieldAlert, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/profile";
import { useAlertState } from "@/hooks/useAlertState";
import { findStateHelpline } from "@/components/EmergencyContacts";
import { cn } from "@/lib/utils";

const STATUS_LABEL = { before: "Watch issued", during: "Active emergency", after: "Recovery phase" } as const;


// App-wide notification banner that appears when alert status transitions.
// A separate aria-live region announces DURING alerts for screen readers.
export function AlertBanner() {
  const { user } = useAuth();
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });
  const city = profileQuery.data?.city ?? null;
  const { state, transition, dismissTransition } = useAlertState(city);

  const [transitionDismissed, setTransitionDismissed] = useState(false);
  useEffect(() => { if (transition) setTransitionDismissed(false); }, [transition]);

  const showTransition = transition && !transitionDismissed;

  const cityOrLocality = profileQuery.data?.locality ?? city;
  const stateHelp = findStateHelpline(cityOrLocality);

  return (
    <>
      {/* Screen-reader-only live region for DURING state */}
      <div role="alert" aria-live="assertive" className="sr-only">
        {state.status === "during"
          ? `Emergency in progress: ${state.headline}. ${state.description}. In an emergency dial 1 1 2.`
          : ""}
      </div>

      {/* Persistent DURING banner with emergency numbers */}
      {state.status === "during" && (
        <div
          className="sticky top-0 z-40 bg-severity-severe text-severity-severe-foreground border-b border-severity-severe px-6 py-3"
          role="region"
          aria-label="Active emergency banner"
        >
          <div className="flex items-start gap-3 flex-wrap">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.75} />
            <div className="flex-1 min-w-[240px]">
              <p className="uppercase-label opacity-90">Active emergency</p>
              <p className="mt-1 font-light text-sm">{state.headline}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0 text-sm">
              <a href="tel:112" className="flex items-center gap-1.5 font-serif text-lg hover:underline">
                <Phone className="h-3 w-3" strokeWidth={2} /> 112
              </a>
              {stateHelp && (
                <a href={`tel:${stateHelp.number}`} className="hidden sm:flex items-center gap-1.5 font-serif text-base hover:underline opacity-90">
                  {stateHelp.number}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transition notification (any status change) */}
      {showTransition && state.status !== "during" && (
        <div
          className={cn(
            "sticky top-0 z-30 border-b flex items-start gap-3 px-6 py-3 text-sm",
            transition!.to === "before" && "bg-severity-watch text-severity-watch-foreground border-severity-watch",
            transition!.to === "after" && "bg-severity-normal text-severity-normal-foreground border-severity-normal",
          )}
          role="status"
        >
          {transition!.to === "before"
            ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.75} />
            : <Info className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.75} />}
          <div className="flex-1">
            <p className="uppercase-label opacity-90">Alert status changed → {STATUS_LABEL[transition!.to]}</p>
            <p className="mt-1 font-light">{state.headline}</p>
          </div>
          <button
            onClick={() => { setTransitionDismissed(true); dismissTransition(); }}
            aria-label="Dismiss notification"
            className="opacity-80 hover:opacity-100 mt-0.5"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      )}
    </>
  );
}

