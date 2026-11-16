import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Calendar,
  Clock,
  ContactRound,
  DollarSign,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Scissors,
  Settings,
  Sparkles,
  User2,
  Users,
  X,
  ArrowUpRight,
  type IconComponent,
} from "@/components/icons";
import { CrownMark } from "@/components/site/site-chrome";
import { getRoleHome, useAuth } from "@/features/auth/auth-context";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { PageReveal } from "@/shared/motion/page-reveal";
import { cn } from "@/shared/utils/cn";

type NavItem = { to: string; label: string; icon: IconComponent };

const navByRole: Record<string, NavItem[]> = {
  owner: [
    { to: "/owner", label: "Painel", icon: LayoutDashboard },
    { to: "/owner/appointments", label: "Agenda", icon: Calendar },
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
    { to: "/barber/revenue", label: "Ganhos", icon: DollarSign },
    { to: "/barber/history", label: "Histórico", icon: History },
    { to: "/barber/profile", label: "Perfil", icon: User2 },
  ],
  client: [
    { to: "/", label: "Início", icon: LayoutDashboard },
    { to: "/agendar", label: "Agendar", icon: Sparkles },
    { to: "/client/history", label: "Horários", icon: Clock },
    { to: "/client/profile", label: "Perfil", icon: User2 },
  ],
};

const roleNames: Record<string, string> = {
  owner: "Proprietário",
  barber: "Profissional",
  client: "Cliente",
};

const workspaceNames: Record<string, string> = {
  owner: "Gestão da casa",
  barber: "Minha cadeira",
  client: "Minha conta",
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
  const [scrolled, setScrolled] = useState(false);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const displayName = String(user?.user_metadata?.full_name || user?.email || roleNames[role]);
  const firstName = displayName.split(/[ @]+/)[0];
  const initials = displayName
    .split(/[ @.]+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const profileImage = String(user?.user_metadata?.avatar_url || "");
  const activeItem = items.find((item) => isNavItemActive(pathname, item.to, role));
  const mobilePrimary = items.slice(0, 4);
  const mobileHasMore = items.length > 4;

  useEffect(() => {
    if (initialized && !user && pathname.startsWith(`/${role}`)) {
      navigate({ to: "/login", search: { redirect: pathname, mode: "login" } });
    }
  }, [initialized, navigate, pathname, role, user]);

  useEffect(() => {
    if (initialized && user && userRole !== role) {
      navigate({ to: getRoleHome(userRole) });
    }
  }, [initialized, navigate, role, user, userRole]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", search: { redirect: undefined, mode: "login" } });
  }

  if (!initialized || !user || userRole !== role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 luxury-bg px-4 text-sm text-muted-foreground">
        <span className="relative grid h-14 w-14 place-items-center">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-[color:var(--gold)]/15 border-t-[color:var(--gold)]" />
          <CrownMark size={22} />
        </span>
        Carregando sua sessão…
      </div>
    );
  }

  const avatar = (className: string) =>
    profileImage ? (
      <img
        src={profileImage}
        alt={`Foto de ${displayName}`}
        className={cn(className, "object-cover")}
      />
    ) : (
      <div
        className={cn(
          className,
          "grid place-items-center gradient-gold font-semibold text-primary-foreground",
        )}
      >
        {initials}
      </div>
    );

  return (
    <div className="flex min-h-screen w-full luxury-bg text-foreground">
      <aside
        aria-label="Navegação principal"
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-screen w-[17.5rem] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)] lg:sticky lg:top-0 lg:translate-x-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        <div className="relative flex h-full flex-col overflow-y-auto px-4 py-6 scrollbar-none">
          <div className="flex items-center justify-between px-2">
            <Link to="/" className="flex items-center gap-3" aria-label="Ir para o site">
              <img
                src="/kings-barber-logo-light.png"
                alt="King's Barber"
                className="h-11 w-auto object-contain"
              />
            </Link>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full border border-sidebar-border text-sidebar-foreground/70 lg:hidden"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mx-2 mt-6 rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-sidebar-primary">
              {workspaceNames[role]}
            </p>
            <p className="mt-1 font-display text-xl leading-tight text-sidebar-foreground">
              Olá, {firstName}
            </p>
          </div>

          <nav className="mt-6 flex-1 space-y-1 pb-5">
            {items.map((item) => {
              const active = isNavItemActive(pathname, item.to, role);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm transition-colors duration-200",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-sidebar-primary" />
                  ) : null}
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                      active
                        ? "bg-sidebar-primary/15 text-sidebar-primary"
                        : "text-current group-hover:text-sidebar-primary",
                    )}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {role !== "client" ? (
            <Link
              to="/"
              className="mx-1 mb-3 flex items-center justify-between rounded-xl border border-dashed border-sidebar-border px-3 py-2.5 text-xs text-sidebar-foreground/60 transition hover:border-sidebar-primary/60 hover:text-sidebar-foreground"
            >
              Ver site público <ArrowUpRight size={14} />
            </Link>
          ) : null}

          <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/55 p-3.5">
            <div className="flex items-center gap-3">
              {avatar("h-10 w-10 shrink-0 rounded-full ring-2 ring-sidebar-primary/40")}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-sidebar-foreground">
                  {displayName}
                </div>
                <div className="text-xs text-sidebar-foreground/50">{roleNames[role]}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="kb-press mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border py-2 text-xs text-sidebar-foreground/70 transition hover:border-destructive/50 hover:text-sidebar-foreground"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </aside>

      <button
        type="button"
        aria-label="Fechar menu"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "sticky top-0 z-30 border-b transition-all duration-300",
            scrolled
              ? "border-border/70 bg-background/80 shadow-[0_10px_30px_-24px_rgb(0_0_0/0.5)] backdrop-blur-xl"
              : "border-transparent bg-transparent",
          )}
        >
          <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label={open ? "Fechar menu" : "Abrir menu"}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="kb-press grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card/70 lg:hidden"
              >
                <Menu size={17} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold lg:hidden">
                  {activeItem?.label ?? workspaceNames[role]}
                </p>
                <p className="hidden items-center gap-2.5 text-xs text-muted-foreground lg:flex">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />
                    <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="capitalize-first">{today}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {role !== "client" ? (
                <Link
                  to="/agendar"
                  className="kb-press hidden h-10 items-center gap-2 rounded-full border border-border bg-card/70 px-4 text-xs font-semibold text-muted-foreground transition hover:border-[color:var(--gold)]/60 hover:text-foreground sm:inline-flex"
                >
                  <Calendar size={15} /> Agenda pública
                </Link>
              ) : null}
              <ThemeToggle />
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sair da conta"
                className="kb-press grid h-10 w-10 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
              >
                <LogOut size={15} />
              </button>
              {avatar("h-10 w-10 rounded-full text-sm ring-2 ring-[color:var(--gold)]/30")}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-14 lg:pt-8">
          <PageReveal routeKey={pathname}>{children}</PageReveal>
        </main>

        <nav
          aria-label="Navegação móvel"
          className="fixed inset-x-3 bottom-3 z-30 flex justify-center lg:hidden"
        >
          <div className="flex w-full max-w-md gap-1 rounded-[22px] border border-border bg-card/90 p-1.5 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.5)] backdrop-blur-xl">
            {mobilePrimary.map((item) => {
              const active = isNavItemActive(pathname, item.to, role);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10.5px] font-medium transition-colors duration-300",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {active ? <span className="absolute inset-0 rounded-2xl bg-accent" /> : null}
                  <Icon size={18} className={cn("relative", active && "text-gold")} />
                  <span className="relative truncate">{item.label}</span>
                </Link>
              );
            })}
            {mobileHasMore ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                  "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10.5px] font-medium text-muted-foreground transition-colors",
                  activeItem && !mobilePrimary.includes(activeItem) && "bg-accent text-foreground",
                )}
              >
                <Menu size={18} />
                <span>Mais</span>
              </button>
            ) : null}
          </div>
        </nav>
      </div>
    </div>
  );
}

function isNavItemActive(pathname: string, target: string, role: string) {
  if (target === "/" || target === `/${role}`) {
    return pathname.replace(/\/$/, "") === target.replace(/\/$/, "");
  }
  return pathname === target || pathname.startsWith(`${target}/`);
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
    <div className="relative mb-8 flex flex-col gap-5 pb-6 md:flex-row md:items-end md:justify-between lg:mb-10 lg:pb-8">
      <span className="absolute inset-x-0 bottom-0 h-px bg-border" />
      <div>
        {eyebrow && (
          <div className="mb-3 flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.26em] text-gold">
            {eyebrow}
          </div>
        )}
        <h1 className="max-w-3xl font-display text-[2.6rem] font-medium leading-[0.98] sm:text-5xl lg:text-[3.6rem]">
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
  icon?: IconComponent;
}) {
  return (
    <div
      data-motion-card
      className="glass-card group relative overflow-hidden rounded-xl p-5 hover:border-[color:var(--gold)]/45"
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-2.5 font-display text-[2rem] leading-none tabular md:text-[2.3rem]">
            <CountUp value={value} />
          </div>
          {delta && <div className="mt-2 text-xs font-medium text-gold">{delta}</div>}
        </div>
        {Icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/70 text-gold ">
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Anima o primeiro número de um texto formatado (ex.: "R$ 1.250,00", "12", "4.9 ★")
 * preservando prefixo, sufixo e casas decimais.
 */
export function CountUp({ value, duration = 900 }: { value: string; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const match = value.match(/-?\d[\d.]*(?:,\d+)?|-?\d+(?:\.\d+)?/);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!match || reduce) {
      setDisplay(value);
      return;
    }
    const raw = match[0];
    const usesComma = raw.includes(",");
    const decimals = usesComma
      ? (raw.split(",")[1]?.length ?? 0)
      : raw.includes(".") && !/\.\d{3}(\.|$)/.test(raw)
        ? (raw.split(".")[1]?.length ?? 0)
        : 0;
    const numeric = usesComma
      ? Number(raw.replace(/\./g, "").replace(",", "."))
      : decimals
        ? Number(raw)
        : Number(raw.replace(/\./g, ""));
    if (!Number.isFinite(numeric) || numeric === 0) {
      setDisplay(value);
      return;
    }
    const prefix = value.slice(0, match.index);
    const suffix = value.slice((match.index ?? 0) + raw.length);
    const formatter = new Intl.NumberFormat(usesComma || decimals === 0 ? "pt-BR" : "en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(`${prefix}${formatter.format(numeric * eased)}${suffix}`);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [duration, value]);

  return <span>{display}</span>;
}
