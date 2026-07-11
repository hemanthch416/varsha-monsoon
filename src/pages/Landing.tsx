import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const chapters = [
  { num: "01", title: "Know your home", body: "A quiet questionnaire — locality, household, floor — shapes a plan that fits your walls." },
  { num: "02", title: "Read the sky", body: "Alerts arrive in plain language, sorted by what matters to your street today." },
  { num: "03", title: "Ask, in your language", body: "An assistant that speaks Hindi, Marathi, Tamil, Bengali and English — patiently, at 2am." },
  { num: "04", title: "Move with certainty", body: "Route advisories and a checklist you can lean on when the rain settles in." },
];

export default function Landing() {
  const { user } = useAuth();
  const ctaTo = user ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 glass">
        <div className="container mx-auto flex items-center justify-between py-5">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif italic text-xl">Varsham</span>
            <span className="uppercase-label text-muted-foreground">वर्षा</span>
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            <a href="#chapters" className="uppercase-label text-foreground/70 hover:text-foreground transition">Chapters</a>
            <a href="#about" className="uppercase-label text-foreground/70 hover:text-foreground transition">About</a>
            <Link to={ctaTo} className="uppercase-label text-foreground/70 hover:text-foreground transition">
              {user ? "Dashboard" : "Sign in"}
            </Link>
          </nav>
          <Link to={ctaTo}>
            <Button variant="outline" size="sm" className="rounded-full uppercase-label px-5 border-foreground/20 hover:bg-foreground hover:text-background">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-32 md:pt-56 md:pb-48">
        <div className="container mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="uppercase-label text-muted-foreground mb-8"
          >
            A quiet guide through the monsoon
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.02] max-w-4xl mx-auto text-balance"
          >
            The rain returns. <em>Meet it prepared.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }}
            className="mt-10 text-base md:text-lg text-muted-foreground max-w-lg mx-auto font-light leading-relaxed"
          >
            Varsham builds a preparedness plan for your household — thoughtful, localized, and always at hand.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
            className="mt-12 flex items-center justify-center gap-3"
          >
            <Link to={ctaTo}>
              <Button size="lg" className="rounded-full uppercase-label px-8 py-6 bg-foreground text-background hover:bg-foreground/90">
                Begin <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Chapters */}
      <section id="chapters" className="py-32 md:py-40 border-t border-border">
        <div className="container mx-auto">
          <div className="max-w-2xl mb-20">
            <p className="uppercase-label text-muted-foreground mb-6">The chapters</p>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight">
              Four small acts, done in order, that hold up under water.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-20">
            {chapters.map((c, i) => (
              <motion.article
                key={c.num}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.08 }}
                className="flex gap-8"
              >
                <span className="font-serif text-2xl text-muted-foreground/70 pt-1">{c.num}</span>
                <div>
                  <h3 className="font-serif text-2xl md:text-3xl mb-3">{c.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-md font-light">{c.body}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-32 md:py-40 border-t border-border">
        <div className="container mx-auto text-center max-w-2xl">
          <p className="uppercase-label text-muted-foreground mb-6">Made in India</p>
          <p className="font-serif text-2xl md:text-4xl leading-snug text-balance">
            For the ground-floor flat in Kurla, the high-rise in Bandra, the village near the Krishna — Varsham listens to <em>where you actually live</em>.
          </p>
          <div className="mt-14">
            <Link to={ctaTo}>
              <Button size="lg" variant="outline" className="rounded-full uppercase-label px-8 py-6 border-foreground/20">
                Create your plan <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-serif italic text-lg">Varsham</p>
          <p className="uppercase-label text-muted-foreground">
            © {new Date().getFullYear()} — Built by Hemanth ·{" "}
            <a
              href="https://github.com/hemchdev"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
