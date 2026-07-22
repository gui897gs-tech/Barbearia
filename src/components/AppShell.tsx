import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Calendar, Users, Scissors, Package, DollarSign,
  BarChart3, Settings, User2, Clock, History, LogOut, Menu, X, Sparkles, ContactRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getRoleHome } from "@/lib/auth";
import kingsBarberLogo from "@/assets/kings-barber-logo.png";

type NavItem = { to: string; label: string; icon: any };

const navByRole: Record<string, NavItem[]> = {
  owner: [
    { to: "/owner", label: "Painel", icon: LayoutDashboard },
    { to: "/owner/appointments", label: "Agendamentos", icon: Calendar },
    { to: "/owner/customers", label: "Clientes", icon: ContactRound },
    { to: "/owner/employees", label: "Equipe", icon: Users },
    { to: "/owner/services", label: "Serviços", icon: Scissors },
    { to: "/owner/products", label: "Produtos", icon: Package },
    { to: "/owner/financial", label: "Financeiro", icon: DollarSign },
    { to: "/owner/reports", label: "Relatórios", icon: BarChart3 },
    { to: "/owner/settings", label: "Configurações", icon: Settings },
  ],
  barber: [
    { to: "/barber", label: "Painel", icon: LayoutDashboard },
    { to: "/barber/schedule", label: "Agenda", icon: Calendar },
    { to: "/barber/revenue", label: "Faturamento", icon: DollarSign },
    { to: "/barber/history", label: "Histórico", icon: History },
    { to: "/barber/profile", label: "Perfil", icon: User2 },
  ],
  client: [
    { to: "/client", label: "Início", icon: LayoutDashboard },
    { to: "/client/book", label: "Agendar", icon: Sparkles },
    { to: "/client/history", label: "Histórico", icon: Clock },
    { to: "/client/profile", label: "Perfil", icon: User2 },
  ],
};

const roleNames: Record<string, string> = {
  owner: "Dono da Barbearia",
  barber: "Lucas Moreau",
  client: "Tiago Almeida",
};

const roleLabels: Record<string, string> = {
  owner: "proprietário",
  barber: "barbeiro",
  client: "cliente",
};

export function AppShell({ role, children }: { role: "owner" | "barber" | "client"; children: ReactNode }) {
  const items = navByRole[role];
  const navigate = useNavigate();
  const { initialized, user, role: userRole, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", month: "long", day: "numeric" });
  const displayName = user?.user_metadata?.full_name || user?.email || roleNames[role];
  const initials = displayName
    .split(/[ @.]+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (initialized && !user) {
      navigate({ to: "/login", search: { redirect: pathname } });
    }
  }, [initialized, navigate, pathname, user]);

  useEffect(() => {
    if (initialized && user && userRole !== role) {
      navigate({ to: getRoleHome(userRole) });
    }
  }, [initialized, navigate, role, user, userRole]);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login" });
  }

  if (!initialized || !user || userRole !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center luxury-bg px-4 text-sm text-muted-foreground">
        Carregando sua sessao...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full luxury-bg text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-72 shrink-0 border-r border-border bg-sidebar/95 backdrop-blur transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto p-5 scrollbar-none">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={kingsBarberLogo}
              alt="King's Barber"
              className="h-12 w-24 object-contain object-left"
            />
            <div>
              <div className="font-display text-lg leading-none text-gradient-gold">King's Barber</div>
            </div>
          </Link>

          <nav className="mt-8 flex-1 space-y-1 pb-5">
            {items.map((it) => {
              const active = pathname === it.to || (it.to !== `/${role}` && pathname.startsWith(it.to));
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all ${
                    active
                      ? "bg-accent text-foreground ring-1 ring-[color:var(--gold)]/30"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-gold" : ""}`} />
                  <span className="font-medium">{it.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full gradient-gold grid place-items-center text-primary-foreground font-semibold">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{displayName}</div>
                <div className="text-xs capitalize text-muted-foreground">{roleLabels[role]}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:border-[color:var(--gold)]/50 transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/60 lg:hidden" />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/60 backdrop-blur px-4 lg:px-8 h-16">
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="hidden lg:block text-sm text-muted-foreground">
            <span className="text-gold">●</span> Ao vivo · {today}
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden md:inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-[color:var(--gold)]/50 hover:text-foreground transition">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> Upgrade
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-[color:var(--gold)]/50 hover:text-foreground transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
            <div className="h-9 w-9 rounded-full gradient-gold grid place-items-center text-primary-foreground text-sm font-semibold">
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
      <div>
        {eyebrow && <div className="text-[11px] uppercase tracking-[0.25em] text-gold mb-2">{eyebrow}</div>}
        <h1 className="font-display text-3xl md:text-4xl font-semibold">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2 max-w-xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, delta, icon: Icon }: { label: string; value: string; delta?: string; icon?: any }) {
  return (
    <div className="glass-card rounded-2xl p-5 transition hover:translate-y-[-2px] hover:gold-glow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-2xl md:text-3xl">{value}</div>
          {delta && <div className="mt-1 text-xs text-gold">{delta}</div>}
        </div>
        {Icon && (
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/60 text-gold">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
