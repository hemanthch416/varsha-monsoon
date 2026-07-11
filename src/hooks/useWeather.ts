import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchWeather, type WeatherData } from "@/services/weather";
import {
  STALE_TIME_MS,
  WEATHER_POLL_INTERVAL_MS,
  WEATHER_RETRY_BASE_MS,
  WEATHER_RETRY_COUNT,
  WEATHER_RETRY_MAX_MS,
} from "@/config/constants";

/**
 * Cached, polling weather query. React Query shares this cache across pages so
 * navigating between /dashboard, /travel, and /assistant does not refire the
 * request. Retries back off exponentially and cap at {@link WEATHER_RETRY_MAX_MS}.
 */
export function useWeather(city: string | null | undefined): UseQueryResult<WeatherData | null, Error> {
  return useQuery<WeatherData | null, Error>({
    queryKey: ["weather", city],
    queryFn: () => fetchWeather(city!),
    enabled: !!city,
    staleTime: STALE_TIME_MS.long,
    refetchInterval: WEATHER_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    retry: WEATHER_RETRY_COUNT,
    retryDelay: attempt => Math.min(WEATHER_RETRY_BASE_MS * 2 ** attempt, WEATHER_RETRY_MAX_MS),
  });
}
