import { Link } from "react-router-dom";
import { Cloud, ShieldCheck, MessageSquare, ListChecks, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: ShieldCheck, title: "Personalized preparedness", body: "A plan tailored to your household, housing, and locality." },
  { icon: MessageSquare, title: "AI assistant", body: "Ask questions in your language, day or night." },
  { icon: ListChecks, title: "Emergency checklist", body: "Track supplies, documents, and safety steps." },
  { icon: MapPin, title: "Travel advisories", body: "Check route safety before you head out." },
];

export default function Landing() {
  const { user } = useAuth();
  const ctaTo = user ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-sky flex items-center justify-center">
            <Cloud className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Varsha</span>
        </div>
        <Link to={ctaTo}>
          <Button variant="ghost" size="sm">{user ? "Open app" : "Sign in"}</Button>
        </Link>
      </header>

      <section className="container mx-auto pt-10 pb-20 md:pt-20 md:pb-32 text-center">
        <p className="text-xs uppercase tracking-widest text-primary font-medium mb-4">Monsoon preparedness for India</p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance max-w-3xl mx-auto">
          Stay safe through every monsoon, with a plan that fits your home.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          Varsha builds a personalized preparedness plan for your household, shares timely alerts, and answers your questions in the moment.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to={ctaTo}>
            <Button size="lg" className="gap-2">
              Get started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto pb-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-6 shadow-soft">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Varsha. Built for citizen safety.
      </footer>
    </div>
  );
}
