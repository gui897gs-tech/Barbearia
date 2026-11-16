import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Instagram, LogIn, MapPin, Menu, UserRound, WhatsApp, X } from "@/components/icons";
import { siteNavigation, useOpenStatus } from "@/components/site/site-hooks";
import { getRoleHome, useAuth } from "@/features/auth/auth-context";
import { brand, mapsSearchUrl, whatsappUrl } from "@/shared/brand";

/** Coroa em traço único, usada apenas como selo em estados de carregamento. */
export function CrownMark({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 32"
      width={size}
      height={(size * 32) / 48}
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
      strokeLinecap="round"
      style={{ color: "var(--gold, #c9a24a)" }}
    >
      <path d="M5 10 14.5 18 24 4l9.5 14L43 10l-3.5 16h-31Z" />
      <path d="M10 29.5h28" />
    </svg>
  );
}

export function OpenStatusBadge({ className = "" }: { className?: string }) {
  const status = useOpenStatus();
  return (
    <span
      className={`inline-flex items-center gap-2 text-[13px] text-[#cfcac1] ${className}`}
      aria-live="polite"
    >
      <span className={status?.open ? "text-[#4ade80]" : "text-[#e7a29b]"}>
        <span className="kb-live-dot" />
      </span>
      {status ? (
        <span>
          <strong className="font-semibold text-[#f2efe9]">{status.label}</strong>
          <span className="text-[#a3a09a]"> · {status.detail}</span>
        </span>
      ) : (
        <span className="text-[#a3a09a]">Seg. a sáb., 09h às 19h</span>
      )}
    </span>
  );
}

/* ───────────────────────── Cabeçalho ───────────────────────── */

export function SiteHeader({ onHome = true }: { onHome?: boolean }) {
  const { initialized, user, role } = useAuth();
  const [solid, setSolid] = useState(!onHome);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!onHome) return;
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onHome]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const linkClass =
    "kb-focus text-[13px] font-semibold uppercase tracking-[0.12em] text-[#cfcac1] transition-colors hover:text-white";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        solid || menuOpen
          ? "border-white/10 bg-[#0b0b0b]/95 backdrop-blur"
          : "border-transparent bg-gradient-to-b from-black/60 to-transparent"
      }`}
    >
      <div className="kb-container relative flex h-[72px] items-center justify-between gap-6">
        <Link to="/" aria-label="King's Barber — início" className="kb-focus shrink-0">
          <img
            src="/kings-barber-logo-light.png"
            alt="King's Barber"
            width={120}
            height={90}
            className="h-10 w-auto object-contain"
          />
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex"
          aria-label="Navegação principal"
        >
          {siteNavigation.map((link) =>
            onHome ? (
              <a key={link.id} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ) : (
              <Link key={link.id} to="/" hash={link.id} className={linkClass}>
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          {initialized && user ? (
            <Link
              to={role === "client" ? "/client/history" : getRoleHome(role)}
              aria-label={role === "client" ? "Meus horários" : "Meu painel"}
              title={role === "client" ? "Meus horários" : "Meu painel"}
              className="kb-focus grid h-10 w-10 place-items-center rounded-md text-[#f2efe9] transition hover:bg-white/10"
            >
              <UserRound size={20} />
            </Link>
          ) : (
            <Link
              to="/login"
              search={{ redirect: undefined, mode: "login" }}
              aria-label="Entrar ou criar conta"
              title="Entrar ou criar conta"
              className="kb-focus grid h-10 w-10 place-items-center rounded-md text-[#f2efe9] transition hover:bg-white/10"
            >
              <LogIn size={20} />
            </Link>
          )}
          <Link
            to="/agendar"
            className="kb-btn kb-btn-gold kb-btn-sm kb-focus hidden sm:inline-flex"
          >
            Agendar
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="kb-focus grid h-10 w-10 place-items-center rounded-md text-[#f2efe9] transition hover:bg-white/10 lg:hidden"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="kb-mobile-menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div
        id="kb-mobile-menu"
        hidden={!menuOpen}
        className="border-t border-white/10 bg-[#0b0b0b] lg:hidden"
      >
        <nav className="kb-container flex flex-col py-3" aria-label="Navegação móvel">
          {siteNavigation.map((link) =>
            onHome ? (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="kb-focus border-b border-white/8 py-4 text-[15px] font-semibold text-[#f2efe9]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.id}
                to="/"
                hash={link.id}
                onClick={() => setMenuOpen(false)}
                className="kb-focus border-b border-white/8 py-4 text-[15px] font-semibold text-[#f2efe9]"
              >
                {link.label}
              </Link>
            ),
          )}
          <div className="grid grid-cols-2 gap-3 py-4">
            <Link
              to="/agendar"
              onClick={() => setMenuOpen(false)}
              className="kb-btn kb-btn-gold kb-focus"
            >
              Agendar
            </Link>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="kb-btn kb-btn-whats kb-focus"
            >
              <WhatsApp size={18} /> WhatsApp
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}

/* ───────────────────────── Contato ───────────────────────── */

export function WhatsAppFab({ message }: { message?: string }) {
  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com a King's Barber no WhatsApp"
      title="Falar no WhatsApp"
      className="kb-focus fixed bottom-[5.5rem] right-4 z-[45] grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lg transition-transform duration-200 hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <WhatsApp size={28} />
    </a>
  );
}

/* ───────────────────────── Rodapé ───────────────────────── */

export function SiteFooter({ onHome = true }: { onHome?: boolean }) {
  const linkClass = "kb-focus transition-colors hover:text-white";
  return (
    <footer className="relative border-t border-white/10 bg-[#0b0b0b] pb-28 pt-14 text-sm text-[#a3a09a] sm:pb-12">
      <div className="kb-container grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img
            src="/kings-barber-logo-light.png"
            alt="King's Barber"
            loading="lazy"
            className="h-14 w-auto object-contain"
          />
          <p className="mt-4 max-w-[16rem] leading-relaxed">
            Barbearia com atendimento por horário marcado.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f2efe9]">Endereço</p>
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noreferrer"
            className={`${linkClass} mt-3 block leading-relaxed`}
          >
            {brand.address.full}
            <span className="mt-1 block text-[#c9a24a]">Abrir no mapa</span>
          </a>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f2efe9]">Horários</p>
          <ul className="mt-3 space-y-1.5">
            {brand.hours.map((row) => (
              <li key={row.label} className="flex justify-between gap-4 sm:block">
                <span>{row.label}</span> <span className="text-[#f2efe9] sm:ml-1">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f2efe9]">Contato</p>
          <ul className="mt-3 space-y-2.5">
            <li>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noreferrer"
                className={`${linkClass} inline-flex items-center gap-2`}
              >
                <WhatsApp size={16} /> {brand.whatsapp.display}
              </a>
            </li>
            <li>
              <a
                href={brand.instagram.url}
                target="_blank"
                rel="noreferrer"
                className={`${linkClass} inline-flex items-center gap-2`}
              >
                <Instagram size={16} /> {brand.instagram.handle}
              </a>
            </li>
            <li>
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noreferrer"
                className={`${linkClass} inline-flex items-center gap-2`}
              >
                <MapPin size={16} /> Como chegar
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="kb-container mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} King's Barber</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Links do rodapé">
          {onHome ? (
            <a href="#inicio" className={linkClass}>
              Voltar ao topo
            </a>
          ) : (
            <Link to="/" className={linkClass}>
              Início
            </Link>
          )}
          <Link to="/agendar" className={linkClass}>
            Agendar
          </Link>
          <Link to="/login" search={{ redirect: undefined, mode: "login" }} className={linkClass}>
            Área da equipe
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? <p className="kb-eyebrow">{eyebrow}</p> : null}
      <h2 className="kb-editorial mt-3 text-[clamp(2.1rem,5vw,3.2rem)] text-[#f2efe9]">{title}</h2>
      {description ? (
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#a3a09a]">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}
