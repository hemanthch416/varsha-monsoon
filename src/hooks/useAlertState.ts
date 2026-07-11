import { useEffect, useRef, useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { listAlerts } from "@/services/alerts";
import { useWeather } from "./useWeather";
import { deriveAlertState, type AlertState } from "@/utils/alertEngine";
import type { Alert } from "@/types";

export interface AlertStateResult {
  state: AlertState;
  weather: ReturnType<typeof useWeather>;
  alerts: UseQueryResult<Alert[], Error>;
  transition: { from: AlertState["status"]; to: AlertState["status"] } | null;
  dismissTransition: () => void;
}

export function useAlertState(city: string | null | undefined): AlertStateResult {
  const weather = useWeather(city);
  const alerts = useQuery<Alert[], Error>({ queryKey: ["alerts"], queryFn: listAlerts, staleTime: 5 * 60_000 });

  const state = deriveAlertState(alerts.data ?? [], weather.data ?? null);

  const prevStatus = useRef<AlertState["status"] | null>(null);
  const [transition, setTransition] = useState<AlertStateResult["transition"]>(null);

  useEffect(() => {
    if (prevStatus.current && prevStatus.current !== state.status) {
      setTransition({ from: prevStatus.current, to: state.status });
    }
    prevStatus.current = state.status;
  }, [state.status]);

  return {
    state,
    weather,
    alerts,
    transition,
    dismissTransition: () => setTransition(null),
  };
}
