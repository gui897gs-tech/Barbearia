import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Instagram, WhatsApp } from "@/components/icons";
import { AuthPanel, type AuthMode } from "@/features/auth/auth-panel";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { brand, whatsappUrl } from "@/shared/brand";
import kingsBarberLogo from "@/assets/kings-barber-logo.png";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    const mode: AuthMode | undefined =
      search.mode === "signup" || search.mode === "login" ? search.mode : undefined;
    return {
      redirect: typeof search.redirect === "string" ? search.redirect : undefined,
      mode,
    };
  },
  head: () => ({
    meta: [
      { title: "Entrar - King's Barber" },
      {
        name: "description",
        content: "Entre ou crie sua conta na King's Barber para agendar seus horários.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect, mode } = Route.useSearch();

  return (
    <div className="relative grid min-h-screen luxury-bg lg:grid-cols-[1.05fr_1fr]">
      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <aside className="kb-site relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img
          src="/kings-barber/12-low-fade.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/30" />

        <Link to="/" className="relative w-fit" aria-label="Voltar ao site">
          <img
            src="/kings-barber-logo-light.png"
            alt="King's Barber"
            className="h-16 w-auto object-contain"
          />
        </Link>

        <div className="relative max-w-md">
          <p className="text-2xl font-semibold text-[#f2efe9]">King's Barber</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[#cfcac1]">
            Com a sua conta você agenda pelo site e acompanha seus próximos horários logo na página
            inicial.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-white/15 pt-6 text-sm">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a3a09a]">
                Endereço
              </dt>
              <dd className="mt-1 text-[#f2efe9]">{brand.address.full}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a3a09a]">
                Horário
              </dt>
              <dd className="mt-1 text-[#f2efe9]">Seg. a sáb., 09h às 19h</dd>
            </div>
          </dl>
          <div className="mt-6 flex items-center gap-5 text-sm text-[#cfcac1]">
            <a
              href={brand.instagram.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <Instagram size={15} /> {brand.instagram.handle}
            </a>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <WhatsApp size={15} /> {brand.whatsapp.display}
            </a>
          </div>
        </div>
      </aside>

      <div className="flex items-center justify-center px-4 py-20 sm:px-8 md:py-16">
        <div className="w-full max-w-[500px]">
          <div className="mb-7 flex flex-col items-center text-center lg:hidden">
            <Link to="/" aria-label="Voltar ao site">
              <img
                src={kingsBarberLogo}
                alt="King's Barber"
                className="h-20 w-auto object-contain"
              />
            </Link>
          </div>

          <AuthPanel initialMode={mode} redirect={redirect} />

          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 transition hover:text-foreground"
            >
              <ArrowLeft size={13} /> Voltar ao site
            </Link>
            <span className="h-3 w-px bg-border" />
            <a
              href={whatsappUrl("Olá! Preciso de ajuda para acessar minha conta.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-[#25d366]"
            >
              <WhatsApp size={13} /> Precisa de ajuda?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
