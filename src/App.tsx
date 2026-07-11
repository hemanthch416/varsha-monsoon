import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
// Landing is the public entry point and part of the LCP path — keep it eager.
import Landing from "./pages/Landing";

// Everything else is behind auth or a click; split into its own chunk so the
// initial download for a first-time visitor is just Landing + the shell.
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Checklist = lazy(() => import("./pages/Checklist"));
const Travel = lazy(() => import("./pages/Travel"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Sensible cross-app defaults; per-query hooks tighten where useful (weather 10m, plan Infinity).
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Minimal fallback for lazy route boundaries — kept intentionally quiet so the
// chunk swap doesn't flash a spinner on fast connections.
const RouteFallback = () => <div className="min-h-screen bg-background" aria-hidden="true" />;

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<ProtectedRoute requireOnboarded={false}><Onboarding /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
                <Route path="/checklist" element={<ProtectedRoute><Checklist /></ProtectedRoute>} />
                <Route path="/travel" element={<ProtectedRoute><Travel /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
