import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Instagram,
  MapPin,
  WhatsApp,
  X,
} from "@/components/icons";
import {
  OpenStatusBadge,
  SectionTitle,
  SiteFooter,
  SiteHeader,
  WhatsAppFab,
} from "@/components/site/site-chrome";
import { useOpenStatus, useReveal } from "@/components/site/site-hooks";
import { AppointmentRecord, listClientAppointments } from "@/data/repositories/business-repository";
import { useAuth } from "@/features/auth/auth-context";
import { brand, mapsSearchUrl, whatsappUrl } from "@/shared/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "King's Barber — Barbearia na Rua Nelson Mandela, 119" },
      {
        name: "description",
        content:
          "Corte, barba, tranças, platinado e tratamentos. Agende online ou pelo WhatsApp. Rua Nelson Mandela, 119.",
      },
      { name: "theme-color", content: "#0b0b0b" },
      { property: "og:title", content: "King's Barber" },
      {
        property: "og:description",
        content: "Barbearia com horário marcado. Veja serviços, preços e agende online.",
      },
      { property: "og:image", content: "/kings-barber/12-low-fade.jpg" },
    ],
  }),
  component: LandingPage,
});

type ServiceCategory = "Cortes" | "Barba" | "Combos" | "Tratamentos" | "Estilo";
type WorkCategory = "Todos" | "Degradê" | "Tranças" | "Clássicos" | "Texturas";

const services: Array<{
  category: ServiceCategory;
  name: string;
  description: string;
  duration: string;
  price: string;
}> = [
  {
    category: "Cortes",
    name: "Corte masculino",
    description: "Social, degradê ou low fade.",
    duration: "45 min",
    price: "R$ 40",
  },
  {
    category: "Cortes",
    name: "Corte infantil",
    description: "Para crianças até 12 anos.",
    duration: "40 min",
    price: "R$ 35",
  },
  {
    category: "Cortes",
    name: "Pezinho / acabamento",
    description: "Retoque do contorno entre um corte e outro.",
    duration: "20 min",
    price: "R$ 15",
  },
  {
    category: "Barba",
    name: "Barba e acabamento",
    description: "Desenho, alinhamento e toalha quente.",
    duration: "30 min",
    price: "R$ 30",
  },
  {
    category: "Barba",
    name: "Sobrancelha",
    description: "Limpeza e alinhamento na navalha.",
    duration: "15 min",
    price: "R$ 15",
  },
  {
    category: "Combos",
    name: "Corte + barba",
    description: "Corte e barba no mesmo horário.",
    duration: "1h10",
    price: "R$ 65",
  },
  {
    category: "Combos",
    name: "Corte + sobrancelha",
    description: "Corte com sobrancelha na navalha.",
    duration: "55 min",
    price: "R$ 50",
  },
  {
    category: "Tratamentos",
    name: "Corte + hidratação",
    description: "Corte com hidratação dos fios.",
    duration: "1h",
    price: "R$ 60",
  },
  {
    category: "Tratamentos",
    name: "Corte + botox capilar",
    description: "Redução de volume e frizz, com corte.",
    duration: "1h30",
    price: "R$ 85",
  },
  {
    category: "Estilo",
    name: "Corte + nudred",
    description: "Textura feita na esponja, com degradê.",
    duration: "1h10",
    price: "R$ 60",
  },
  {
    category: "Estilo",
    name: "Corte + tranças",
    description: "Tranças nagô com degradê nas laterais.",
    duration: "2h",
    price: "a partir de R$ 100",
  },
  {
    category: "Estilo",
    name: "Nevou / platinado",
    description: "Descoloração, matização e corte.",
    duration: "2h30",
    price: "a partir de R$ 130",
  },
];

const serviceGroups: ServiceCategory[] = ["Cortes", "Barba", "Combos", "Tratamentos", "Estilo"];

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
    alt: "Tranças nagô com barba alinhada",
    title: "Tranças com barba",
    category: "Tranças",
  },
  {
    src: "/kings-barber/04-resultado-corte-marco.jpg",
    alt: "Corte social com barba aparada",
    title: "Social com barba",
    category: "Clássicos",
  },
  {
    src: "/kings-barber/08-corte-nudred.jpg",
    alt: "Textura crespa com degradê alto",
    title: "Nudred com degradê alto",
    category: "Texturas",
  },
  {
    src: "/kings-barber/11-corte-com-botox.jpg",
    alt: "Corte curto com contorno fechado",
    title: "Degradê com contorno",
    category: "Degradê",
  },
  {
    src: "/kings-barber/05-degrade-com-trancas.jpg",
    alt: "Tranças fio a fio com degradê",
    title: "Tranças com degradê",
    category: "Tranças",
  },
  {
    src: "/kings-barber/01-nevou-platinado.jpg",
    alt: "Cliente com cabelo platinado e contorno alinhado",
    title: "Platinado",
    category: "Texturas",
  },
  {
    src: "/kings-barber/10-resultado-classico.jpg",
    alt: "Ondas com degradê fechado",
    title: "Ondas com degradê",
    category: "Clássicos",
  },
  {
    src: "/kings-barber/09-resultado-dezembro.jpg",
    alt: "Penteado com risco marcado",
    title: "Risco marcado",
    category: "Degradê",
  },
  {
    src: "/kings-barber/07-corte-natural.jpg",
    alt: "Cachos com volume preservado",
    title: "Cachos naturais",
    category: "Texturas",
  },
  {
    src: "/kings-barber/06-pai-e-filho.jpg",
    alt: "Cabelo penteado com volume no topo e degradê nas laterais",
    title: "Volume com degradê",
    category: "Clássicos",
  },
];

const products = [
  {
    category: "Finalização",
    name: "Pomada modeladora matte",
    detail: "100 g",
    price: "R$ 39,90",
    stock: "Disponível",
  },
  {
    category: "Finalização",
    name: "Pomada efeito brilho",
    detail: "100 g",
    price: "R$ 39,90",
    stock: "Disponível",
  },
  {
    category: "Barba",
    name: "Balm para barba",
    detail: "120 ml",
    price: "R$ 34,90",
    stock: "Últimas unidades",
  },
  {
    category: "Barba",
    name: "Óleo para barba",
    detail: "30 ml",
    price: "R$ 29,90",
    stock: "Disponível",
  },
  {
    category: "Cuidado diário",
    name: "Shampoo cabelo e barba",
    detail: "250 ml",
    price: "R$ 32,90",
    stock: "Disponível",
  },
  {
    category: "Cuidado diário",
    name: "Tônico capilar",
    detail: "100 ml",
    price: "R$ 44,90",
    stock: "Últimas unidades",
  },
  {
    category: "Barba",
    name: "Loção pós-barba",
    detail: "120 ml",
    price: "R$ 34,90",
    stock: "Indisponível",
  },
  {
    category: "Acessório",
    name: "Pente de madeira",
    detail: "Antiestático",
    price: "R$ 19,90",
    stock: "Disponível",
  },
];

const heroPhotos = [
  { src: "/kings-barber/12-low-fade.jpg", alt: "Low fade com topo texturizado" },
  { src: "/kings-barber/03-corte-com-trancas.jpg", alt: "Tranças nagô com barba alinhada" },
  { src: "/kings-barber/04-resultado-corte-marco.jpg", alt: "Corte social com barba aparada" },
  { src: "/kings-barber/01-nevou-platinado.jpg", alt: "Cliente com cabelo platinado" },
];

function LandingPage() {
  const { initialized, user, role } = useAuth();
  const [workCategory, setWorkCategory] = useState<WorkCategory>("Todos");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState<AppointmentRecord | null>(null);

  const filteredGallery = useMemo(
    () =>
      workCategory === "Todos" ? gallery : gallery.filter((work) => work.category === workCategory),
    [workCategory],
  );

  useReveal();

  useEffect(() => {
    if (!initialized || !user || role !== "client") {
      setUpcomingAppointment(null);
      return;
    }

    let active = true;
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
      });

    return () => {
      active = false;
    };
  }, [initialized, role, user]);

  return (
    <div className="kb-site min-h-screen overflow-x-hidden">
      <SiteHeader />

      <main>
        {/* ───────── Abertura ───────── */}
        <section id="inicio" className="relative pt-[72px]">
          <div className="kb-container pb-12 pt-16 text-center sm:pb-16 sm:pt-24">
            <p className="kb-eyebrow kb-hero-reveal">Barbearia · {brand.address.street}</p>
            <h1 className="kb-editorial kb-hero-reveal mx-auto mt-5 max-w-3xl text-[clamp(2.6rem,7vw,4.8rem)] text-[#f2efe9] [animation-delay:80ms]">
              Corte, barba e acabamento com hora marcada.
            </h1>
            <p className="kb-hero-reveal mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#a3a09a] [animation-delay:160ms] sm:text-lg">
              Escolha o serviço, o barbeiro e o horário pelo site. Se preferir, fale com a gente
              pelo WhatsApp.
            </p>
            <div className="kb-hero-reveal mt-9 flex flex-col justify-center gap-3 [animation-delay:240ms] sm:flex-row">
              <Link to="/agendar" className="kb-btn kb-btn-gold kb-focus">
                Agendar horário
              </Link>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noreferrer"
                className="kb-btn kb-btn-whats kb-focus"
              >
                <WhatsApp size={18} /> Falar no WhatsApp
              </a>
            </div>
            <div className="kb-hero-reveal mt-6 [animation-delay:320ms]">
              <OpenStatusBadge />
            </div>

            {upcomingAppointment ? <UpcomingAppointment appointment={upcomingAppointment} /> : null}
          </div>

          <div className="kb-container">
            <div className="kb-hero-reveal grid grid-cols-2 gap-2 [animation-delay:200ms] sm:grid-cols-4 sm:gap-3">
              {heroPhotos.map((photo, index) => (
                <div
                  key={photo.src}
                  className={`overflow-hidden rounded-md bg-[#121212] ${index > 1 ? "hidden sm:block" : ""}`}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    fetchPriority={index < 2 ? "high" : "auto"}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                  />
                </div>
              ))}
            </div>

            <dl className="mt-3 grid divide-y divide-white/10 rounded-md border border-white/10 text-left sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <InfoCell icon={<MapPin size={18} />} label="Endereço">
                <a
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="kb-focus kb-link"
                >
                  {brand.address.full}
                </a>
              </InfoCell>
              <InfoCell icon={<Clock3 size={18} />} label="Horário">
                Seg. a sáb., 09h às 19h
              </InfoCell>
              <InfoCell icon={<Instagram size={18} />} label="Instagram">
                <a
                  href={brand.instagram.url}
                  target="_blank"
                  rel="noreferrer"
                  className="kb-focus kb-link"
                >
                  {brand.instagram.handle}
                </a>
              </InfoCell>
            </dl>
          </div>
        </section>

        {/* ───────── Serviços ───────── */}
        <section id="servicos" className="kb-section scroll-mt-16">
          <div className="kb-container">
            <SectionTitle
              eyebrow="Serviços"
              title="Serviços e preços"
              description="Valores de referência. O preço final pode variar conforme o profissional e aparece antes de você confirmar o agendamento."
            />

            <div
              className="mx-auto mt-12 grid max-w-5xl gap-x-14 gap-y-10 md:grid-cols-2"
              data-reveal
            >
              {serviceGroups.map((group) => (
                <div key={group}>
                  <h3 className="border-b border-[#c9a24a]/50 pb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#c9a24a]">
                    {group}
                  </h3>
                  <ul>
                    {services
                      .filter((service) => service.category === group)
                      .map((service) => (
                        <li key={service.name} className="border-b border-white/8">
                          <Link
                            to="/agendar"
                            search={{ servico: service.name }}
                            aria-label={`Agendar ${service.name}, ${service.price}`}
                            className="kb-focus group flex items-start justify-between gap-6 py-4"
                          >
                            <span className="min-w-0">
                              <span className="block text-[15px] font-semibold text-[#f2efe9] transition-colors group-hover:text-[#c9a24a]">
                                {service.name}
                              </span>
                              <span className="mt-1 block text-[13px] text-[#a3a09a]">
                                {service.description} · {service.duration}
                              </span>
                            </span>
                            <span className="shrink-0 text-right">
                              <span className="block text-[15px] font-semibold tabular-nums text-[#f2efe9]">
                                {service.price}
                              </span>
                              <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[#c9a24a] opacity-80 transition-opacity group-hover:opacity-100">
                                Agendar <ArrowRight size={12} />
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
              <div className="flex flex-col justify-center rounded-md border border-white/10 bg-[#121212] p-6">
                <p className="text-[15px] font-semibold text-[#f2efe9]">Não achou o que procura?</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#a3a09a]">
                  Mande uma foto do corte que você quer pelo WhatsApp e a gente confirma o serviço,
                  o tempo e o valor.
                </p>
                <a
                  href={whatsappUrl("Olá! Queria saber o valor de um serviço.")}
                  target="_blank"
                  rel="noreferrer"
                  className="kb-btn kb-btn-whats kb-btn-sm kb-focus mt-5 self-start"
                >
                  <WhatsApp size={16} /> Perguntar
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Trabalhos ───────── */}
        <section
          id="trabalhos"
          className="kb-section scroll-mt-16 border-t border-white/10 bg-[#0f0f0f]"
        >
          <div className="kb-container">
            <SectionTitle
              eyebrow="Trabalhos"
              title="Cortes feitos na casa"
              description="Fotos de clientes atendidos na King's Barber."
            />
            <FilterTabs
              options={["Todos", "Degradê", "Tranças", "Clássicos", "Texturas"]}
              active={workCategory}
              onChange={(value) => setWorkCategory(value as WorkCategory)}
            />
            <div className="mt-8 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
              {filteredGallery.map((work, index) => (
                <button
                  key={work.src}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="kb-focus group relative overflow-hidden rounded-md bg-[#121212] text-left"
                  aria-label={`Ampliar foto: ${work.title}`}
                >
                  <img
                    src={work.src}
                    alt={work.alt}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 text-[13px] font-semibold text-white">
                    {work.title}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-10 text-center">
              <a
                href={brand.instagram.url}
                target="_blank"
                rel="noreferrer"
                className="kb-btn kb-btn-outline kb-focus"
              >
                <Instagram size={18} /> Ver mais no Instagram
              </a>
            </div>
          </div>
        </section>

        {/* ───────── Como agendar ───────── */}
        <section className="kb-section">
          <div className="kb-container">
            <SectionTitle eyebrow="Agendamento" title="Como agendar" />
            <ol
              className="mx-auto mt-12 grid max-w-4xl gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 sm:grid-cols-3"
              data-reveal
            >
              {[
                {
                  title: "Escolha o serviço",
                  text: "Preço e duração aparecem antes de você seguir.",
                },
                {
                  title: "Barbeiro e horário",
                  text: "Só aparecem os horários livres de cada profissional.",
                },
                {
                  title: "Confirme",
                  text: "Entre ou crie sua conta. O horário fica no seu histórico.",
                },
              ].map((step, index) => (
                <li key={step.title} className="bg-[#0b0b0b] p-6 text-center sm:p-8">
                  <span className="kb-editorial text-4xl text-[#c9a24a]">{index + 1}</span>
                  <h3 className="mt-3 text-[15px] font-semibold text-[#f2efe9]">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#a3a09a]">{step.text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 text-center">
              <Link to="/agendar" className="kb-btn kb-btn-gold kb-focus">
                <CalendarDays size={17} /> Agendar agora
              </Link>
            </div>
          </div>
        </section>

        {/* ───────── Produtos ───────── */}
        <section
          id="produtos"
          className="kb-section scroll-mt-16 border-t border-white/10 bg-[#0f0f0f]"
        >
          <div className="kb-container">
            <SectionTitle
              eyebrow="Produtos"
              title="À venda na barbearia"
              description="Os mesmos produtos que usamos na cadeira. Disponíveis no balcão."
            />
            <div
              className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4"
              data-reveal
            >
              {products.map((product) => (
                <article key={product.name} className="kb-card flex flex-col p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a3a09a]">
                    {product.category}
                  </p>
                  <h3 className="mt-2 text-[15px] font-semibold text-[#f2efe9]">{product.name}</h3>
                  <p className="mt-1 text-[13px] text-[#a3a09a]">{product.detail}</p>
                  <div className="mt-auto flex items-end justify-between pt-5">
                    <p className="text-lg font-semibold tabular-nums text-[#f2efe9]">
                      {product.price}
                    </p>
                    <p
                      className={`text-[12px] font-semibold ${
                        product.stock === "Indisponível"
                          ? "text-[#a3a09a]/70"
                          : product.stock === "Últimas unidades"
                            ? "text-[#e8b26a]"
                            : "text-[#6fcf97]"
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

        {/* ───────── Contato ───────── */}
        <section id="contato" className="kb-section scroll-mt-16">
          <div className="kb-container">
            <SectionTitle eyebrow="Contato" title="Endereço e horários" />
            <ContactBlock />
          </div>
        </section>
      </main>

      <SiteFooter />

      <div className="hidden sm:block">
        <WhatsAppFab />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_auto] gap-2 border-t border-white/10 bg-[#0b0b0b]/95 p-3 backdrop-blur sm:hidden">
        <Link to="/agendar" className="kb-btn kb-btn-gold kb-focus !h-12">
          Agendar horário
        </Link>
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar no WhatsApp"
          className="kb-btn kb-btn-whats kb-focus !h-12 !px-4"
        >
          <WhatsApp size={20} />
        </a>
      </div>

      {lightboxIndex !== null ? (
        <Lightbox
          items={filteredGallery}
          index={lightboxIndex}
          onChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </div>
  );
}

/* ───────────────────────── Peças ───────────────────────── */

function InfoCell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="text-[#c9a24a]">{icon}</span>
      <div>
        <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a3a09a]">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm font-semibold text-[#f2efe9]">{children}</dd>
      </div>
    </div>
  );
}

function UpcomingAppointment({ appointment }: { appointment: AppointmentRecord }) {
  const date = appointmentDate(appointment);
  const dateLabel = Number.isNaN(date.getTime())
    ? appointment.appointment_date || "Data a confirmar"
    : format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="kb-hero-reveal mx-auto mt-8 flex max-w-xl flex-col gap-3 rounded-md border border-[#c9a24a]/40 bg-[#c9a24a]/[0.07] p-4 text-left [animation-delay:360ms] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c9a24a]">
          Seu próximo horário
        </p>
        <p className="mt-1 text-sm font-semibold text-[#f2efe9]">
          {appointment.service} com {appointment.barber}
        </p>
        <p className="capitalize-first text-[13px] text-[#a3a09a]">
          {dateLabel} às {appointment.time}
        </p>
      </div>
      <Link to="/client/history" className="kb-btn kb-btn-outline kb-btn-sm kb-focus shrink-0">
        Ver detalhes
      </Link>
    </div>
  );
}

function FilterTabs({
  options,
  active,
  onChange,
}: {
  options: readonly string[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filtrar trabalhos"
      className="kb-no-scrollbar mx-auto mt-8 flex max-w-full justify-start gap-6 overflow-x-auto border-b border-white/10 sm:justify-center"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={active === option}
          className={`kb-focus relative shrink-0 pb-3 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors ${
            active === option ? "text-[#f2efe9]" : "text-[#a3a09a] hover:text-[#f2efe9]"
          }`}
        >
          {option}
          <span
            className={`absolute inset-x-0 -bottom-px h-[2px] bg-[#c9a24a] transition-transform duration-300 ${
              active === option ? "scale-x-100" : "scale-x-0"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function Lightbox({
  items,
  index,
  onChange,
  onClose,
}: {
  items: typeof gallery;
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const touchStart = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const item = items[index];
  const go = useCallback(
    (direction: 1 | -1) => onChange((index + direction + items.length) % items.length),
    [index, items.length, onChange],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  if (!item) return null;

  const navButton =
    "kb-focus absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${index + 1} de ${items.length}: ${item.title}`}
      className="kb-lightbox fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4"
      onClick={onClose}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
        if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
        touchStart.current = null;
      }}
    >
      <button
        ref={closeRef}
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="kb-focus absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X size={20} />
      </button>

      <figure
        className="flex max-h-full w-full max-w-3xl flex-col items-center"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          key={item.src}
          src={item.src}
          alt={item.alt}
          className="kb-lightbox-img max-h-[78vh] w-auto max-w-full rounded-md object-contain"
        />
        <figcaption className="mt-4 text-center text-sm text-[#cfcac1]">
          {item.title}{" "}
          <span className="text-[#a3a09a]">
            · {index + 1} de {items.length}
          </span>
        </figcaption>
      </figure>

      <button
        type="button"
        aria-label="Foto anterior"
        onClick={(event) => {
          event.stopPropagation();
          go(-1);
        }}
        className={`${navButton} left-3 sm:left-6`}
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        aria-label="Próxima foto"
        onClick={(event) => {
          event.stopPropagation();
          go(1);
        }}
        className={`${navButton} right-3 sm:right-6`}
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

function ContactBlock() {
  const status = useOpenStatus();
  const todayRow = status ? (status.weekday === 0 ? 2 : status.weekday === 6 ? 1 : 0) : -1;

  return (
    <div
      className="mx-auto mt-12 grid max-w-5xl overflow-hidden rounded-md border border-white/10 md:grid-cols-2"
      data-reveal
    >
      <div className="bg-[#121212] p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a3a09a]">Endereço</p>
        <p className="mt-2 text-xl font-semibold text-[#f2efe9]">{brand.address.full}</p>
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noreferrer"
          className="kb-focus kb-link mt-2 inline-flex items-center gap-1.5 text-sm text-[#c9a24a]"
        >
          Abrir no Google Maps <ArrowRight size={14} />
        </a>

        <div className="mt-8 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a3a09a]">Horários</p>
          <OpenStatusBadge className="!text-xs" />
        </div>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {brand.hours.map((row, index) => (
              <tr
                key={row.label}
                className={`border-b border-white/8 ${index === todayRow ? "text-[#f2efe9]" : "text-[#a3a09a]"}`}
              >
                <th scope="row" className="py-3 text-left font-normal">
                  {row.label}
                  {index === todayRow ? (
                    <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#c9a24a]">
                      hoje
                    </span>
                  ) : null}
                </th>
                <td className="py-3 text-right font-semibold">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="kb-btn kb-btn-whats kb-focus"
          >
            <WhatsApp size={18} /> {brand.whatsapp.display}
          </a>
          <a
            href={brand.instagram.url}
            target="_blank"
            rel="noreferrer"
            className="kb-btn kb-btn-outline kb-focus"
          >
            <Instagram size={18} /> Instagram
          </a>
        </div>
      </div>
      <a
        href={mapsSearchUrl}
        target="_blank"
        rel="noreferrer"
        className="kb-focus group relative block min-h-[320px]"
        aria-label={`Abrir ${brand.address.full} no Google Maps`}
      >
        <img
          src="/kings-barber/11-corte-com-botox.jpg"
          alt="Interior da King's Barber"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[50%_35%] transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </a>
    </div>
  );
}

function appointmentDate(appointment: AppointmentRecord) {
  if (appointment.starts_at) return new Date(appointment.starts_at);
  const [year, month, day] = (appointment.appointment_date || "").split("-").map(Number);
  const [hours, minutes] = appointment.time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}
