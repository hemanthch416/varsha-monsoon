import { useEffect, useState } from "react";
import { AlertTriangle, X, Info, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/profile";
import { useAlertState } from "@/hooks/useAlertState";
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

  return (
    <>
      {/* Screen-reader-only live region for DURING state */}
      <div role="alert" aria-live="assertive" className="sr-only">
        {state.status === "during"
          ? `Emergency in progress: ${state.headline}. ${state.description}`
          : ""}
      </div>

      {showTransition && (
        <div
          className={cn(
            "sticky top-0 z-40 border-b flex items-start gap-3 px-6 py-3 text-sm",
            transition!.to === "during" && "bg-severity-severe text-severity-severe-foreground border-severity-severe",
            transition!.to === "before" && "bg-severity-watch text-severity-watch-foreground border-severity-watch",
            transition!.to === "after" && "bg-severity-normal text-severity-normal-foreground border-severity-normal",
          )}
          role="status"
        >
          {transition!.to === "during" ? <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.75} />
            : transition!.to === "before" ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.75} />
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
