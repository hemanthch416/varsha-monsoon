import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, MessageSquare, ListChecks, Route, Settings, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { AlertBanner } from "@/components/AlertBanner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "Assistant", icon: MessageSquare },
  { to: "/checklist", label: "Checklist", icon: ListChecks },
  { to: "/travel", label: "Travel", icon: Route },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavItems({ onClick }: { onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onClick}
          className={({ isActive }) => cn(
            "group flex items-center gap-3 rounded-md px-3 py-2.5 uppercase-label transition-colors",
            isActive
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = nav.find(n => location.pathname.startsWith(n.to))?.label ?? "Varsha";

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar p-6 gap-10">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-serif italic text-xl">Varsha</span>
          <span className="uppercase-label text-muted-foreground">वर्षा</span>
        </Link>
        <NavItems />
        <div className="mt-auto">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 uppercase-label text-muted-foreground hover:text-foreground transition"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <AlertBanner />
        <header className="md:hidden sticky top-0 z-30 glass border-b border-border px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif italic text-lg">Varsha</Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" strokeWidth={1.5} /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="mt-10"><NavItems /></div>
              <button
                onClick={handleSignOut}
                className="mt-10 flex items-center gap-3 uppercase-label text-muted-foreground hover:text-foreground transition"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} /> Sign out
              </button>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 px-6 md:px-12 py-10 md:py-16">
          <h1 className="sr-only">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
