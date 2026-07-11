import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/services/profile";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { children: ReactNode; requireOnboarded?: boolean }

export function ProtectedRoute({ children, requireOnboarded = true }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;

  if (requireOnboarded && profile && !profile.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
