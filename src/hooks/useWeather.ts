import { useQuery } from "@tanstack/react-query";
import { fetchWeather } from "@/services/weather";

// Poll every 15 minutes with exponential backoff on failure.
// React Query caches the result across pages via the shared client, so navigating
// between /dashboard, /travel, /assistant does not refire the request.
export function useWeather(city: string | null | undefined) {
  return useQuery({
    queryKey: ["weather", city],
    queryFn: () => fetchWeather(city!),
    enabled: !!city,
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
    refetchIntervalInBackground: false,
    retry: 4,
    // 30s, 1m, 2m, 4m, capped at 5m
    retryDelay: attempt => Math.min(30_000 * 2 ** attempt, 5 * 60_000),
  });
}
