import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Cloud, LayoutDashboard, MessageSquare, ListChecks, Route, Settings, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "AI Assistant", icon: MessageSquare },
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
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
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
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar p-4 gap-6">
        <div className="flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-sky flex items-center justify-center">
            <Cloud className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Varsha</span>
        </div>
        <NavItems />
        <div className="mt-auto">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            <span className="font-semibold">Varsha</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="mt-6"><NavItems /></div>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 mt-6" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <h1 className="sr-only">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
