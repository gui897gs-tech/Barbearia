import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Instagram,
  LogIn,
  MapPin,
  Menu,
  PackageOpen,
  Scissors,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppointmentRecord, listClientAppointments } from "@/data/repositories/business-repository";
import { getRoleHome, useAuth } from "@/features/auth/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "King's Barber — Tradição, estilo e excelência" },
      {
        name: "description",
        content:
          "Barbearia na Rua Nelson Mandela, 119. Cortes, barba e tratamentos com técnica e atenção aos detalhes.",
      },
      { name: "theme-color", content: "#050505" },
    ],
  }),
  component: LandingPage,
});

type ServiceCategory = "Todos" | "Cortes" | "Barba" | "Combos" | "Tratamentos" | "Estilo";
type WorkCategory = "Todos" | "Degradê" | "Tranças" | "Clássicos" | "Transformações";

const navigation = [
  ["Início", "#inicio"],
  ["Serviços", "#servicos"],
  ["Trabalhos", "#trabalhos"],
  ["Produtos", "#produtos"],
  ["Localização", "#localizacao"],
] as const;

const services: Array<{
  category: Exclude<ServiceCategory, "Todos">;
  name: string;
  description: string;
  duration: string;
  price: string;
  featured?: boolean;
}> = [
  {
    category: "Cortes",
    name: "Corte masculino",
    description: "Social, degradê ou low fade — a variação é escolhida na cadeira.",
    duration: "45 min",
    price: "R$ 40,00",
    featured: true,
  },
  {
    category: "Cortes",
    name: "Corte infantil",
    description: "Atendimento com paciência e no ritmo da criança.",
    duration: "40 min",
    price: "R$ 35,00",
  },
  {
    category: "Barba",
    name: "Barba e acabamento",
    description: "Desenho, alinhamento e finalização.",
    duration: "30 min",
    price: "R$ 30,00",
  },
  {
    category: "Combos",
    name: "Corte + barba",
    description: "O combo completo da casa, do cabelo ao contorno.",
    duration: "1h10",
    price: "R$ 65,00",
    featured: true,
  },
  {
    category: "Combos",
    name: "Corte + sobrancelha",
    description: "Corte com o olhar alinhado no mesmo horário.",
    duration: "55 min",
    price: "R$ 50,00",
  },
  {
    category: "Tratamentos",
    name: "Corte + hidratação",
    description: "Corte com tratamento para devolver maciez aos fios.",
    duration: "1h",
    price: "R$ 60,00",
  },
  {
    category: "Tratamentos",
    name: "Corte + botox capilar",
    description: "Redução de volume e brilho, com o corte finalizado.",
    duration: "1h30",
    price: "R$ 85,00",
    featured: true,
  },
  {
    category: "Estilo",
    name: "Corte + nudred",
    description: "Textura trabalhada na esponja, com acabamento nas laterais.",
    duration: "1h10",
    price: "R$ 60,00",
  },
  {
    category: "Estilo",
    name: "Corte + tranças",
    description: "Tranças feitas fio a fio, com o degradê acompanhando o desenho.",
    duration: "2h",
    price: "a partir de R$ 100,00",
    featured: true,
  },
  {
    category: "Estilo",
    name: "Nevou / platinado",
    description: "Descoloração global e matização, com o corte finalizado.",
    duration: "2h30",
    price: "a partir de R$ 130,00",
  },
  {
    category: "Barba",
    name: "Sobrancelha",
    description: "Design masculino respeitando o traço natural.",
    duration: "15 min",
    price: "R$ 15,00",
  },
  {
    category: "Cortes",
    name: "Pezinho / acabamento",
    description: "Retoque rápido para manter o corte na régua.",
    duration: "20 min",
    price: "R$ 15,00",
  },
];

const gallery: Array<{
  src: string;
  alt: string;
  title: string;
  category: Exclude<WorkCategory, "Todos">;
}> = [
  {
    src: "/kings-barber/12-low-fade.jpg",
    alt: "Corte com topo texturizado e low fade nas laterais",
    title: "Low fade com topo texturizado",
    category: "Degradê",
  },
  {
    src: "/kings-barber/03-corte-com-trancas.jpg",
    alt: "Tranças com barba alinhada",
    title: "Tranças com barba alinhada",
    category: "Tranças",
  },
  {
    src: "/kings-barber/11-corte-com-botox.jpg",
    alt: "Corte curto com contorno fechado",
    title: "Corte curto com contorno fechado",
    category: "Transformações",
  },
  {
    src: "/kings-barber/05-degrade-com-trancas.jpg",
    alt: "Tranças fio a fio com degradê",
    title: "Tranças fio a fio com degradê",
    category: "Tranças",
  },
  {
    src: "/kings-barber/04-resultado-corte-marco.jpg",
    alt: "Corte social com barba aparada",
    title: "Social com barba aparada",
    category: "Clássicos",
  },
  {
    src: "/kings-barber/08-corte-nudred.jpg",
    alt: "Textura crespa com degradê alto",
    title: "Textura crespa com degradê alto",
    category: "Transformações",
  },
  {
    src: "/kings-barber/09-resultado-dezembro.jpg",
    alt: "Penteado com risco marcado",
    title: "Penteado com risco marcado",
    category: "Degradê",
  },
  {
    src: "/kings-barber/10-resultado-classico.jpg",
    alt: "Ondas com degradê fechado",
    title: "Ondas com degradê fechado",
    category: "Clássicos",
  },
  {
    src: "/kings-barber/07-corte-natural.jpg",
    alt: "Cachos com volume preservado",
    title: "Cachos com volume preservado",
    category: "Clássicos",
  },
];

const products = [
  {
    category: "Finalização",
    name: "Pomada modeladora matte",
    description: "Fixação forte com efeito seco, sem pesar no fio. 100 g.",
    price: "R$ 39,90",
    stock: "Disponível",
  },
  {
    category: "Finalização",
    name: "Pomada efeito brilho",
    description: "Acabamento com brilho controlado para penteados. 100 g.",
    price: "R$ 39,90",
    stock: "Disponível",
  },
  {
    category: "Barba",
    name: "Balm para barba",
    description: "Controla o volume e dá acabamento ao desenho. 120 ml.",
    price: "R$ 34,90",
    stock: "Últimas unidades",
  },
  {
    category: "Barba",
    name: "Óleo para barba",
    description: "Hidrata a pele por baixo da barba e reduz a coceira. 30 ml.",
    price: "R$ 29,90",
    stock: "Disponível",
  },
  {
    category: "Cuidado diário",
    name: "Shampoo para cabelo e barba",
    description: "Limpeza diária sem ressecar. 250 ml.",
    price: "R$ 32,90",
    stock: "Disponível",
  },
  {
    category: "Cuidado diário",
    name: "Tônico capilar",
    description: "Refresca o couro cabeludo e ajuda a manter o fio firme. 100 ml.",
    price: "R$ 44,90",
    stock: "Últimas unidades",
  },
  {
    category: "Barba",
    name: "Loção pós-barba",
    description: "Acalma a pele logo depois da navalha. 120 ml.",
    price: "R$ 34,90",
    stock: "Indisponível",
  },
  {
    category: "Acessório",
    name: "Pente de madeira",
    description: "Pente antiestático para finalizar cabelo e barba.",
    price: "R$ 19,90",
    stock: "Disponível",
  },
];

function LandingPage() {
  const { initialized, user, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>("Todos");
  const [workCategory, setWorkCategory] = useState<WorkCategory>("Todos");
  const [upcomingAppointment, setUpcomingAppointment] = useState<AppointmentRecord | null>(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);

  useEffect(() => {
    const handleScroll = () => setHeaderSolid(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!initialized || !user || role !== "client") {
      setUpcomingAppointment(null);
      setLoadingAppointment(false);
      return;
    }

    let active = true;
    setLoadingAppointment(true);
    void listClientAppointments(user.id)
      .then((appointments) => {
        if (!active) return;
        const nextAppointment = appointments
          .filter(
            (appointment) =>
              appointment.status === "Confirmado" &&
              appointmentDate(appointment).getTime() >= Date.now() - 5 * 60 * 1000,
          )
          .sort(
            (first, second) => appointmentDate(first).getTime() - appointmentDate(second).getTime(),
          )[0];
        setUpcomingAppointment(nextAppointment ?? null);
      })
      .catch(() => {
        if (active) setUpcomingAppointment(null);
      })
      .finally(() => {
        if (active) setLoadingAppointment(false);
      });

    return () => {
      active = false;
    };
  }, [initialized, role, user]);

  const filteredServices = useMemo(
    () =>
      serviceCategory === "Todos"
        ? services
        : services.filter((service) => service.category === serviceCategory),
    [serviceCategory],
  );

  const filteredGallery = useMemo(
    () =>
      workCategory === "Todos" ? gallery : gallery.filter((work) => work.category === workCategory),
    [workCategory],
  );

  return (
    <div className="kb-site relative min-h-screen overflow-x-hidden bg-[#050505] text-[#f4f0e8]">
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-500 ${
          headerSolid || mobileMenuOpen
            ? "border-white/10 bg-[#050505]/92 shadow-2xl shadow-black/30 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8">
          <a href="#inicio" aria-label="King's Barber — início" className="kb-focus shrink-0">
            <img
              src="/kings-barber-logo-light.png"
              alt="King's Barber"
              width={140}
              height={78}
              className="h-10 w-auto object-contain"
            />
          </a>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Navegação principal">
            {navigation.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="kb-focus text-[13.5px] text-[#a7a7aa] transition-colors duration-300 hover:text-[#f4f0e8]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/agendar"
              className="kb-btn kb-btn-gold kb-btn-sm kb-focus hidden sm:inline-flex"
            >
              Agendar horário
            </Link>
            {initialized && user ? (
              <Link
                to={role === "client" ? "/client/profile" : getRoleHome(role)}
                aria-label={role === "client" ? "Abrir meus dados" : "Abrir meu painel"}
                title={role === "client" ? "Abrir meus dados" : "Abrir meu painel"}
                className="kb-focus grid h-11 w-11 place-items-center rounded-xl border border-white/15 text-[#f4f0e8] transition hover:border-[#c9a24a]/60 hover:text-[#e2c16b]"
              >
                <UserRound size={19} />
              </Link>
            ) : (
              <Link
                to="/login"
                search={{ redirect: undefined, mode: "login" }}
                aria-label="Entrar ou criar conta"
                title="Entrar ou criar conta"
                className="kb-focus grid h-11 w-11 place-items-center rounded-xl border border-white/15 text-[#f4f0e8] transition hover:border-[#c9a24a]/60 hover:text-[#e2c16b]"
              >
                <LogIn size={19} />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="kb-focus grid h-11 w-11 place-items-center rounded-xl border border-white/15 text-[#f4f0e8] lg:hidden"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            className="border-t border-white/10 bg-[#050505] px-5 py-5 lg:hidden"
            aria-label="Navegação móvel"
          >
            <div className="mx-auto flex max-w-[1280px] flex-col">
              {navigation.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-white/8 py-3.5 text-sm text-[#a7a7aa] transition hover:text-[#f4f0e8]"
                >
                  {label}
                </a>
              ))}
              <Link
                to="/agendar"
                onClick={() => setMobileMenuOpen(false)}
                className="kb-btn kb-btn-gold mt-5 sm:hidden"
              >
                Agendar horário
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="relative z-10">
        <section id="inicio" className="relative overflow-hidden pt-[76px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_52%_at_74%_38%,rgba(201,162,74,0.16),transparent_68%)]" />
          <div className="relative mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-20 pt-12 sm:gap-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-28 lg:pt-16">
            <div>
              <p className="kb-eyebrow kb-hero-reveal">Tradição • Estilo • Excelência</p>
              <h1 className="kb-editorial kb-hero-reveal mt-6 text-[clamp(3.1rem,7.5vw,5.4rem)] [animation-delay:80ms]">
                Seu visual.
                <br />
                Sua coroa.
              </h1>
              <p className="kb-hero-reveal mt-5 max-w-lg text-[15px] leading-relaxed text-[#a7a7aa] [animation-delay:160ms] sm:mt-7 sm:text-[17px]">
                Na King's Barber, cada detalhe é pensado para você sair com presença, confiança e um
                corte à sua altura.
              </p>
              {initialized && user && role === "client" && loadingAppointment ? (
                <div className="mt-7 h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.035]" />
              ) : upcomingAppointment ? (
                <UpcomingAppointmentCard appointment={upcomingAppointment} />
              ) : null}
              <div className="kb-hero-reveal mt-7 flex flex-col gap-2.5 [animation-delay:240ms] sm:mt-10 sm:flex-row sm:items-center">
                <Link to="/agendar" className="kb-btn kb-btn-gold kb-focus">
                  Agendar meu horário <ArrowRight size={16} />
                </Link>
                <a href="#servicos" className="kb-btn kb-btn-outline kb-focus">
                  Conhecer serviços
                </a>
              </div>

              <div className="kb-hero-reveal mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-5 text-[13px] text-[#a7a7aa] [animation-delay:320ms] sm:mt-12 sm:gap-x-8 sm:pt-7">
                <span className="flex items-center gap-2.5">
                  <MapPin size={14} className="text-[#c9a24a]" /> Rua Nelson Mandela, 119
                </span>
                <span className="flex items-center gap-2.5">
                  <Scissors size={14} className="text-[#c9a24a]" /> 12 serviços na cadeira
                </span>
                <a
                  href="https://www.instagram.com/kiingsbarberr/"
                  target="_blank"
                  rel="noreferrer"
                  className="kb-focus flex items-center gap-2.5 transition-colors hover:text-[#e2c16b]"
                >
                  <Instagram size={14} className="text-[#c9a24a]" /> @kiingsbarberr
                </a>
              </div>
            </div>

            <div className="kb-hero-reveal relative mx-auto w-full max-w-[560px] [animation-delay:120ms]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] border border-white/12 bg-black">
                <img
                  src="/kings-barber/01-nevou-platinado.jpg"
                  alt="Cliente de perfil com cabelo platinado raspado e contorno alinhado"
                  className="h-full w-full object-cover transition-transform duration-1000 hover:scale-[1.025]"
                />
              </div>
              <div className="absolute -bottom-8 -left-6 hidden w-[150px] overflow-hidden rounded-[14px] border border-white/15 shadow-2xl shadow-black sm:block">
                <img
                  src="/kings-barber/12-low-fade.jpg"
                  alt="Corte com topo texturizado e low fade"
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
              <div className="absolute -right-5 -top-6 hidden w-[124px] overflow-hidden rounded-[14px] border border-white/15 shadow-2xl shadow-black lg:block">
                <img
                  src="/kings-barber/05-degrade-com-trancas.jpg"
                  alt="Tranças embutidas com degradê"
                  className="aspect-square w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/8">
            <div className="kb-no-scrollbar flex gap-3 overflow-x-auto px-5 py-3.5 sm:px-8 sm:py-5">
              {gallery
                .slice(4)
                .concat(gallery.slice(0, 1))
                .map((work) => (
                  <a
                    key={`strip-${work.src}`}
                    href="#trabalhos"
                    className="kb-focus group w-[108px] shrink-0 overflow-hidden rounded-[10px] border border-white/10 transition-colors hover:border-[#c9a24a]/50 sm:w-[164px] sm:rounded-xl"
                  >
                    <img
                      src={work.src}
                      alt={work.alt}
                      className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </a>
                ))}
            </div>
          </div>
        </section>

        <section className="kb-section">
          <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
            <div>
              <SectionHeading title="Aqui todo cliente é rei." />
              <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[#a7a7aa] sm:mt-6 sm:text-[15.5px]">
                Mais do que um corte, um atendimento feito com técnica, atenção e personalidade — do
                clássico ao mais atual.
              </p>
              <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:mt-12 sm:grid-cols-3">
                <Feature
                  icon={<Users size={19} />}
                  title="Atendimento personalizado"
                  text="Conversa antes da tesoura para entender o que combina com você."
                />
                <Feature
                  icon={<Scissors size={19} />}
                  title="Precisão nos detalhes"
                  text="Contorno, transição e acabamento conferidos até o último fio."
                />
                <Feature
                  icon={<Sparkles size={19} />}
                  title="Estilo para todas as idades"
                  text="Do primeiro corte da criança ao social de quem já sabe o que quer."
                />
              </div>
            </div>
            <ImageFrame
              src="/kings-barber/06-pai-e-filho.jpg"
              alt="Cabelo penteado com volume no topo e degradê nas laterais"
              className="aspect-[4/5]"
            />
          </div>
        </section>

        <section id="servicos" className="kb-section scroll-mt-[76px]">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <SectionHeading
              title="Escolha seu ritual."
              description="Cada serviço com o tempo que ele realmente leva — para a agenda ser honesta com o seu dia."
            />
            <FilterRow
              options={["Todos", "Cortes", "Barba", "Combos", "Tratamentos", "Estilo"]}
              active={serviceCategory}
              onChange={(value) => setServiceCategory(value as ServiceCategory)}
            />
            <div className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <article
                  key={service.name}
                  className="group flex min-h-[260px] flex-col bg-[#0e0e10] p-6 transition-colors duration-300 hover:bg-[#19191c] sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="kb-eyebrow !text-[9px]">{service.category}</span>
                    {service.featured && (
                      <span className="rounded-full border border-[#c9a24a]/35 bg-[#c9a24a]/8 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-[#e2c16b]">
                        Destaque
                      </span>
                    )}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-[#f4f0e8]">{service.name}</h3>
                  <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-[#a7a7aa]">
                    {service.description}
                  </p>
                  <div className="mt-7 flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                    <div>
                      <span className="flex items-center gap-1.5 text-xs text-[#a7a7aa]">
                        <Clock3 size={13} className="text-[#c9a24a]" /> {service.duration}
                      </span>
                      <div className="mt-2 text-[15px] font-semibold text-[#f4f0e8]">
                        {service.price}
                      </div>
                    </div>
                    <Link
                      to="/agendar"
                      className="kb-focus inline-flex items-center gap-1.5 text-xs font-semibold text-[#c9a24a] transition-colors hover:text-[#e2c16b]"
                    >
                      Agendar <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="trabalhos" className="kb-section scroll-mt-[76px]">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <SectionHeading title="Cortes que falam por você." />
            <FilterRow
              options={["Todos", "Degradê", "Tranças", "Clássicos", "Transformações"]}
              active={workCategory}
              onChange={(value) => setWorkCategory(value as WorkCategory)}
            />
            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {filteredGallery.map((work, index) => (
                <article
                  key={work.src}
                  className={`group relative overflow-hidden rounded-[14px] border border-white/10 bg-[#0e0e10] ${
                    index % 5 === 0 ? "sm:row-span-2" : ""
                  }`}
                >
                  <img
                    src={work.src}
                    alt={work.alt}
                    loading="lazy"
                    className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${
                      index % 5 === 0 ? "h-full min-h-[360px] sm:min-h-[520px]" : "aspect-[4/5]"
                    }`}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/65 to-transparent p-4 pt-16 sm:p-6 sm:pt-24">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a24a]">
                      {work.category}
                    </p>
                    <h3 className="mt-1.5 text-sm font-semibold text-[#f4f0e8] sm:text-base">
                      {work.title}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="produtos" className="kb-section scroll-mt-[76px]">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <SectionHeading
              title="Cuidados que prolongam o resultado."
              description="O que usamos na cadeira e recomendamos para manter o corte em pé até a próxima visita."
            />
            <div className="mt-8 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <article
                  key={product.name}
                  className="group flex min-h-[270px] flex-col rounded-2xl border border-white/10 bg-[#0e0e10] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c9a24a]/35 hover:bg-[#19191c]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="kb-eyebrow !text-[9px]">{product.category}</span>
                    <PackageOpen size={18} className="text-[#c9a24a]" />
                  </div>
                  <h3 className="mt-7 text-[15px] font-semibold text-[#f4f0e8]">{product.name}</h3>
                  <p className="mt-3 flex-1 text-[13px] leading-relaxed text-[#a7a7aa]">
                    {product.description}
                  </p>
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="text-lg font-semibold text-[#f4f0e8]">{product.price}</p>
                    <p
                      className={`mt-1 text-[11px] ${
                        product.stock === "Indisponível" ? "text-[#a7a7aa]/60" : "text-[#c9a24a]"
                      }`}
                    >
                      {product.stock}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="localizacao" className="kb-section scroll-mt-[76px]">
          <div className="mx-auto grid max-w-[1280px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.95fr_1fr] lg:gap-20">
            <div className="flex flex-col justify-center">
              <SectionHeading title="Onde a coroa espera por você." />
              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-3.5">
                  <MapPin size={17} className="mt-0.5 shrink-0 text-[#c9a24a]" />
                  <div>
                    <p className="text-[15.5px] text-[#f4f0e8]">Rua Nelson Mandela, 119</p>
                    <p className="mt-1 text-sm text-[#a7a7aa]">
                      Venha viver a experiência King's Barber.
                    </p>
                  </div>
                </div>
                <a
                  href="https://www.instagram.com/kiingsbarberr/"
                  target="_blank"
                  rel="noreferrer"
                  className="kb-focus inline-flex items-center gap-2.5 text-[15px] text-[#a7a7aa] transition-colors hover:text-[#e2c16b]"
                >
                  <Instagram size={17} className="text-[#c9a24a]" /> @kiingsbarberr
                </a>
              </div>
              <Link to="/agendar" className="kb-btn kb-btn-gold kb-focus mt-12 self-start">
                Agendar horário <ArrowRight size={16} />
              </Link>
            </div>
            <ImageFrame
              src="/kings-barber/02-capa-video-atendimento.jpg"
              alt="Interior da King's Barber: entrada, prateleira e cadeira de atendimento"
              className="aspect-[3/4]"
              imageClassName="object-[50%_26%]"
            />
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-[#050505] pb-24 pt-12 sm:pb-12">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-5 sm:px-8 md:grid-cols-[1fr_auto_auto] md:items-start md:gap-16">
          <div>
            <img
              src="/kings-barber-logo-light.png"
              alt="King's Barber"
              className="h-14 w-auto object-contain object-left"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#a7a7aa]">
              Aqui todo cliente é rei. Tradição, estilo e excelência em cada detalhe.
            </p>
          </div>
          <nav className="grid gap-3 text-sm text-[#a7a7aa]" aria-label="Navegação do rodapé">
            {navigation.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-[#f4f0e8]">
                {label}
              </a>
            ))}
          </nav>
          <div className="space-y-3 text-sm text-[#a7a7aa]">
            <p className="flex items-center gap-2">
              <MapPin size={14} className="text-[#c9a24a]" /> Rua Nelson Mandela, 119
            </p>
            <a
              href="https://www.instagram.com/kiingsbarberr/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition hover:text-[#e2c16b]"
            >
              <Instagram size={14} className="text-[#c9a24a]" /> @kiingsbarberr
            </a>
            <Link
              to="/login"
              search={{ redirect: undefined, mode: "login" }}
              className="block pt-3 text-xs transition hover:text-[#f4f0e8]"
            >
              Área da equipe
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-[1280px] flex-col gap-2 border-t border-white/8 px-5 pt-6 text-[11px] uppercase tracking-[0.14em] text-[#a7a7aa]/60 sm:px-8 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} King's Barber</span>
          <span>Tradição, estilo e excelência</span>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050505]/94 p-3 backdrop-blur-xl sm:hidden">
        <Link to="/agendar" className="kb-btn kb-btn-gold kb-focus w-full">
          Agendar horário <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function UpcomingAppointmentCard({ appointment }: { appointment: AppointmentRecord }) {
  const date = appointmentDate(appointment);
  const dateLabel = Number.isNaN(date.getTime())
    ? appointment.appointment_date || "Data a confirmar"
    : format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <article className="kb-hero-reveal mt-7 max-w-xl rounded-2xl border border-[#c9a24a]/35 bg-[#c9a24a]/[0.07] p-5 [animation-delay:210ms] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e2c16b]">
            <CheckCircle2 size={14} /> Seu próximo horário
          </p>
          <h2 className="mt-3 text-xl font-semibold text-[#f4f0e8] sm:text-2xl">
            {appointment.service}
          </h2>
          <p className="mt-1 text-sm text-[#a7a7aa]">com {appointment.barber}</p>
        </div>
        <span className="rounded-full border border-[#c9a24a]/35 bg-[#c9a24a]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e2c16b]">
          {appointment.status}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-sm text-[#d6d2ca]">
        <span className="flex items-center gap-2 capitalize">
          <CalendarDays size={15} className="text-[#c9a24a]" /> {dateLabel}
        </span>
        <span className="flex items-center gap-2">
          <Clock3 size={15} className="text-[#c9a24a]" /> {appointment.time}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          to="/agendar"
          className="kb-focus inline-flex items-center gap-2 text-xs font-semibold text-[#e2c16b] transition hover:text-[#f4f0e8]"
        >
          Agendar outro horário <ArrowRight size={14} />
        </Link>
        <Link
          to="/client/history"
          className="kb-focus text-xs font-semibold text-[#a7a7aa] transition hover:text-[#f4f0e8]"
        >
          Ver histórico
        </Link>
      </div>
    </article>
  );
}

function appointmentDate(appointment: AppointmentRecord) {
  if (appointment.starts_at) return new Date(appointment.starts_at);
  const [year, month, day] = (appointment.appointment_date || "").split("-").map(Number);
  const [hours, minutes] = appointment.time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <div className="kb-rule w-24" />
      <h2 className="kb-editorial mt-5 text-[clamp(2.15rem,6vw,3.6rem)] sm:mt-8">{title}</h2>
      {description && (
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[#a7a7aa] sm:mt-5 sm:text-[15.5px]">
          {description}
        </p>
      )}
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="h-full bg-[#0e0e10] p-4 sm:p-6">
      <span className="text-[#c9a24a]">{icon}</span>
      <h3 className="mt-3 text-[14px] font-semibold text-[#f4f0e8] sm:mt-5 sm:text-[14.5px]">
        {title}
      </h3>
      <p className="mt-2.5 text-[13px] leading-relaxed text-[#a7a7aa]">{text}</p>
    </article>
  );
}

function FilterRow({
  options,
  active,
  onChange,
}: {
  options: readonly string[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="kb-no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1 sm:mt-12">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`kb-focus shrink-0 rounded-full border px-4 py-2 text-xs transition-colors ${
            active === option
              ? "border-[#c9a24a] bg-[#c9a24a] text-[#131007]"
              : "border-white/12 text-[#a7a7aa] hover:border-white/25 hover:text-[#f4f0e8]"
          }`}
          aria-pressed={active === option}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function ImageFrame({
  src,
  alt,
  className,
  imageClassName = "",
}: {
  src: string;
  alt: string;
  className: string;
  imageClassName?: string;
}) {
  return (
    <div
      className={`group overflow-hidden rounded-[20px] border border-white/10 bg-black ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.025] ${imageClassName}`}
      />
    </div>
  );
}
