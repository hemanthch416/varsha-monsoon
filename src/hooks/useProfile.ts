import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/profile";
import { STALE_TIME_MS } from "@/config/constants";
import type { Profile } from "@/types";

/**
 * Shared household-profile query. Used across Dashboard, Checklist, Settings,
 * and AlertBanner — consolidating the identical `useQuery` invocation ensures
 * a single cache entry per user and prevents redundant network calls.
 */
export function useProfile(): UseQueryResult<Profile | null, Error> {
  const { user } = useAuth();
  return useQuery<Profile | null, Error>({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
    staleTime: STALE_TIME_MS.medium,
  });
}
