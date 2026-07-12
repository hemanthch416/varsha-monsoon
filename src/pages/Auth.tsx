import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"),
});

const signupSchema = schema.extend({
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate("/dashboard"); });
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate("/dashboard"); });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = mode === "signup"
      ? signupSchema.safeParse({ email, password, confirmPassword })
      : schema.safeParse({ email, password });
    if (!parsed.success) {
      toast({ title: "Invalid input", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "Confirm your address, then sign in." });
        // Switch to sign-in so the user isn't stuck on the signup form staring at their credentials.
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      // Translate common Supabase auth errors into plain-English messages.
      const raw = err instanceof Error ? err.message : "Something went wrong";
      const message = friendlyAuthError(raw, mode);
      toast({ title: "Authentication failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Maps 422 / weak-password / already-registered errors to actionable guidance.
  function friendlyAuthError(raw: string, mode: "signin" | "signup"): string {
    const lower = raw.toLowerCase();
    if (lower.includes("already registered") || lower.includes("user already"))
      return "An account with this email already exists. Try signing in instead.";
    if (lower.includes("weak_password") || lower.includes("password should") || lower.includes("password is too weak"))
      return "Password too weak. Use at least 8 characters with a mix of letters, numbers, and symbols.";
    if (lower.includes("pwned") || lower.includes("has been found in a data breach") || lower.includes("compromised"))
      return "This password has appeared in a known data breach. Please choose a different password.";
    if (lower.includes("invalid login") || lower.includes("invalid credentials"))
      return mode === "signin" ? "Email or password is incorrect." : raw;
    if (lower.includes("email not confirmed"))
      return "Please confirm your email — check your inbox for the verification link.";
    if (lower.includes("rate limit"))
      return "Too many attempts. Please wait a minute and try again.";
    return raw;
  }


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container mx-auto py-6">
        <Link to="/" className="uppercase-label text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-12">
            <p className="font-serif italic text-2xl mb-2">Varsham</p>
            <h1 className="font-serif text-3xl md:text-4xl">
              {mode === "signin" ? "Welcome back." : "Begin your plan."}
            </h1>
            <p className="text-sm text-muted-foreground mt-3 font-light">
              {mode === "signin" ? "Sign in to your preparedness plan." : "A few quiet questions to get started."}
            </p>
          </div>
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="uppercase-label text-muted-foreground">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="uppercase-label text-muted-foreground">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="border-0 border-b border-border rounded-none bg-transparent px-0 pr-8 focus-visible:ring-0 focus-visible:border-foreground" required />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground/70 font-light">
                  Minimum 8 characters. Avoid common or previously breached passwords.
                </p>
              )}
            </div>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="uppercase-label text-muted-foreground">Confirm password</Label>
                <Input id="confirmPassword" type={showPassword ? "text" : "password"} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  minLength={8} autoComplete="new-password"
                  className="border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground" required />
              </div>
            )}
            <Button type="submit" className="w-full rounded-full uppercase-label py-6 bg-foreground text-background hover:bg-foreground/90" disabled={loading}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <button
            onClick={() => setMode(m => m === "signin" ? "signup" : "signin")}
            className="mt-8 uppercase-label text-muted-foreground hover:text-foreground w-full text-center transition"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
