import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Package,
  DollarSign,
  BarChart3,
  Settings,
  User2,
  Clock,
  History,
  LogOut,
  Menu,
  X,
  Sparkles,
  ContactRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { getRoleHome } from "@/features/auth/auth-context";
import kingsBarberLogo from "@/assets/kings-barber-logo.png";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { PageReveal } from "@/shared/motion/page-reveal";

type NavItem = { to: string; label: string; icon: LucideIcon };

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
  owner: "Proprietário",
  barber: "Profissional",
  client: "Cliente",
};

const roleLabels: Record<string, string> = {
  owner: "proprietário",
  barber: "barbeiro",
  client: "cliente",
};

export function AppShell({
  role,
  children,
}: {
  role: "owner" | "barber" | "client";
  children: ReactNode;
}) {
  const items = navByRole[role];
  const navigate = useNavigate();
  const { initialized, user, role: userRole, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const displayName = String(user?.user_metadata?.full_name || user?.email || roleNames[role]);
  const initials = displayName
    .split(/[ @.]+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (initialized && !user && pathname.startsWith(`/${role}`)) {
      navigate({ to: "/login", search: { redirect: pathname } });
    }
  }, [initialized, navigate, pathname, role, user]);

  useEffect(() => {
    if (initialized && user && userRole !== role) {
      navigate({ to: getRoleHome(userRole) });
    }
  }, [initialized, navigate, role, user, userRole]);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", search: { redirect: undefined } });
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
      <aside
        aria-label="Navegação principal"
        className={`fixed top-0 z-40 h-screen w-[17rem] shrink-0 border-r border-sidebar-border bg-sidebar/97 text-sidebar-foreground shadow-2xl backdrop-blur-xl transition-transform duration-300 lg:sticky ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-4 py-5 scrollbar-none">
          <Link to="/" className="flex items-center gap-3 px-2">
            <img
              src={kingsBarberLogo}
              alt="King's Barber"
              className="h-11 w-20 object-contain object-left"
            />
            <div className="border-l border-sidebar-border pl-3">
              <div className="font-display text-lg leading-none text-sidebar-foreground">
                King's
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.28em] text-sidebar-primary">
                Barber studio
              </div>
            </div>
          </Link>

          <div className="mx-2 mt-7 flex items-center gap-3 text-[9px] uppercase tracking-[0.24em] text-sidebar-foreground/45">
            <span>Workspace</span>
            <span className="h-px flex-1 bg-sidebar-border" />
          </div>

          <nav className="mt-3 flex-1 space-y-1 pb-5">
            {items.map((it) => {
              const active =
                pathname === it.to || (it.to !== `/${role}` && pathname.startsWith(it.to));
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/58 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-2 -left-4 w-0.5 rounded-r-full bg-sidebar-primary" />
                  )}
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-105 ${active ? "text-sidebar-primary" : ""}`}
                  />
                  <span className="font-medium">{it.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/55 p-3.5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full gradient-gold font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-sidebar-foreground">
                  {displayName}
                </div>
                <div className="text-xs capitalize text-sidebar-foreground/50">
                  {roleLabels[role]}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border py-2 text-xs text-sidebar-foreground/60 transition hover:border-sidebar-primary/50 hover:text-sidebar-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/82 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="hidden items-center gap-3 text-xs text-muted-foreground lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-emerald-500)_16%,transparent)]" />
            <span className="capitalize">{today}</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sair da conta"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
            <div
              className="grid h-9 w-9 place-items-center rounded-full gradient-gold text-sm font-semibold text-primary-foreground"
              aria-label={displayName}
            >
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-10 xl:px-12">
          <PageReveal routeKey={pathname}>{children}</PageReveal>
        </main>

        <nav
          aria-label="Navegação móvel"
          className="fixed inset-x-3 bottom-3 z-30 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card/92 p-1.5 shadow-2xl backdrop-blur-xl scrollbar-none lg:hidden"
        >
          {items.map((item) => {
            const active =
              pathname === item.to || (item.to !== `/${role}` && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] transition ${
                  active ? "bg-accent text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-gold" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between lg:mb-10 lg:pb-8">
      <div>
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
            <span className="h-px w-6 bg-gold" /> {eyebrow}
          </div>
        )}
        <h1 className="max-w-3xl font-display text-4xl font-medium leading-[0.98] sm:text-5xl lg:text-[3.4rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
}) {
  return (
    <div
      data-motion-card
      className="glass-card group overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[color:var(--gold)]/45"
    >
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
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
