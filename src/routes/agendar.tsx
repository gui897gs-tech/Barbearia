import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  LogIn,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Scissors,
  ShieldCheck,
  Star,
  UserRound,
  WhatsApp,
} from "@/components/icons";
import { CrownMark, WhatsAppFab } from "@/components/site/site-chrome";
import {
  BarberServicePrice,
  bookPublicAppointment,
  EmployeeRecord,
  getAvailableSlots,
  listBarberServicePrices,
  listEmployees,
  listServices,
  resolveBarberServicePrice,
  ServiceRecord,
} from "@/data/repositories/business-repository";
import { AppRole, getRoleHome, useAuth } from "@/features/auth/auth-context";
import { useAuthDialog } from "@/features/auth/auth-dialog-context";
import { supabase } from "@/integrations/supabase/client";
import { brand, mapsSearchUrl, whatsappUrl } from "@/shared/brand";
import { findServiceByName } from "@/shared/domain/service-match";
import { formatCurrency } from "@/shared/utils/format";

export const Route = createFileRoute("/agendar")({
  validateSearch: (search: Record<string, unknown>): { servico?: string } => ({
    servico: typeof search.servico === "string" && search.servico ? search.servico : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Agendar horário — King's Barber" },
      {
        name: "description",
        content:
          "Escolha o serviço, o barbeiro e o melhor horário na King's Barber. Confirmação imediata.",
      },
      { name: "theme-color", content: "#070707" },
    ],
  }),
  component: PublicBookingPage,
});

const steps = [
  { label: "Serviço", short: "Serviço" },
  { label: "Profissional", short: "Barbeiro" },
  { label: "Data e horário", short: "Horário" },
  { label: "Seus dados", short: "Dados" },
  { label: "Confirmar", short: "Confirmar" },
] as const;

const STEP_SERVICE = 0;
const STEP_BARBER = 1;
const STEP_SLOT = 2;
const STEP_DETAILS = 3;
const STEP_CONFIRM = 4;

const bookingDraftKey = "kings-barber-booking-draft";

type BookingDraft = {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  notes: string;
};

function PublicBookingPage() {
  const { initialized, user, role } = useAuth();
  const { openAuth } = useAuthDialog();
  const { servico: requestedService } = Route.useSearch();
  const bookingDates = useMemo(
    () => Array.from({ length: 14 }, (_, index) => addDays(new Date(), index)),
    [],
  );
  const [step, setStep] = useState(STEP_SERVICE);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [barbers, setBarbers] = useState<EmployeeRecord[]>([]);
  const [barberPrices, setBarberPrices] = useState<BarberServicePrice[]>([]);
  const [service, setService] = useState<ServiceRecord | null>(null);
  const [barber, setBarber] = useState<EmployeeRecord | null>(null);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const autoAdvance = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingOptions(true);
    setOptionsError("");

    void Promise.all([listServices(), listEmployees(), listBarberServicePrices()])
      .then(([serviceRows, employeeRows, priceRows]) => {
        if (!active) return;
        setServices(serviceRows.filter((item) => item.active !== false));
        setBarbers(
          employeeRows
            .filter((item) => item.active !== false)
            .sort((first, second) => first.name.localeCompare(second.name, "pt-BR")),
        );
        setBarberPrices(priceRows);
      })
      .catch(() => {
        if (active) {
          setOptionsError(
            "Não foi possível abrir a agenda agora. Verifique sua conexão e tente novamente.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      setClientName("");
      setClientPhone("");
      setLoadingProfile(false);
      setProfileError("");
      return;
    }

    let active = true;
    const metadataName = String(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
    const metadataPhone = String(user.user_metadata?.phone || "");
    setClientName(metadataName);
    setClientPhone(formatPhone(metadataPhone));
    setProfileError("");

    if (!supabase || role === "owner") {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    void (async () => {
      const query =
        role === "client"
          ? supabase.from("customers").select("name, whatsapp").eq("id", user.id).maybeSingle()
          : supabase
              .from("barbers")
              .select("name, phone")
              .eq("access_user_id", user.id)
              .maybeSingle();
      const { data, error } = await query;
      if (!active) return;

      if (error) {
        setProfileError(
          "Não foi possível atualizar os dados do perfil. Confira antes de continuar.",
        );
        return;
      }

      if (data) {
        setClientName(String(data.name || metadataName));
        const profilePhone = "whatsapp" in data ? data.whatsapp : data.phone;
        setClientPhone(formatPhone(String(profilePhone || metadataPhone)));
      }
    })().finally(() => {
      if (active) setLoadingProfile(false);
    });

    return () => {
      active = false;
    };
  }, [initialized, role, user]);

  // Restaura o rascunho salvo antes do login ou pré-seleciona o serviço vindo do site.
  useEffect(() => {
    if (loadingOptions || draftRestored) return;
    const draft = readBookingDraft();
    let restored = false;
    if (draft) {
      const draftService = services.find((item) => item.id === draft.serviceId);
      const draftBarber = barbers.find((item) => item.id === draft.barberId);
      if (draftService && draftBarber) {
        setService(draftService);
        setBarber(draftBarber);
        setDate(draft.date);
        setTime(draft.time);
        setNotes(draft.notes);
        setStep(STEP_DETAILS);
        restored = true;
      }
      window.sessionStorage.removeItem(bookingDraftKey);
    }
    if (!restored && requestedService) {
      const match = findServiceByName(services, requestedService);
      if (match) {
        setService(match);
        setStep(STEP_BARBER);
      }
    }
    setDraftRestored(true);
  }, [barbers, draftRestored, loadingOptions, requestedService, services]);

  useEffect(() => {
    if (!barber || !service || !date) {
      setTimes([]);
      setTime("");
      return;
    }

    let active = true;
    setLoadingTimes(true);
    setSubmitError("");

    void getAvailableSlots({ barberId: barber.id, serviceId: service.id, date })
      .then((availableSlots) => {
        if (active) {
          setTimes(availableSlots);
          setTime((current) => (current && availableSlots.includes(current) ? current : ""));
        }
      })
      .catch(() => {
        if (active) {
          setTimes([]);
          setSubmitError("Não foi possível consultar os horários. Tente novamente.");
        }
      })
      .finally(() => {
        if (active) setLoadingTimes(false);
      });

    return () => {
      active = false;
    };
  }, [barber, date, service]);

  useEffect(
    () => () => {
      if (autoAdvance.current) window.clearTimeout(autoAdvance.current);
    },
    [],
  );

  const selectedPrice =
    barber && service
      ? resolveBarberServicePrice(barberPrices, barber.id, service.id, service.price)
      : (service?.price ?? 0);
  const phoneDigits = clientPhone.replace(/\D/g, "");
  const detailsAreValid =
    Boolean(user) &&
    clientName.trim().length >= 2 &&
    phoneDigits.length >= 10 &&
    phoneDigits.length <= 13;
  const stepReady = [
    Boolean(service),
    Boolean(barber),
    Boolean(date && time),
    Boolean(time) && detailsAreValid && !loadingProfile,
    true,
  ];
  const canContinue = stepReady[step];
  const firstPending = stepReady.findIndex((ready) => !ready);
  const maxStep = firstPending === -1 ? STEP_CONFIRM : firstPending;

  function goTo(target: number) {
    if (autoAdvance.current) window.clearTimeout(autoAdvance.current);
    const bounded = Math.max(0, Math.min(target, steps.length - 1));
    setDirection(bounded >= step ? 1 : -1);
    setSubmitError("");
    setStep(bounded);
    requestAnimationFrame(() => {
      const top = panelRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0 || top > window.innerHeight * 0.6) {
        window.scrollTo({ top: window.scrollY + top - 110, behavior: "smooth" });
      }
    });
  }

  function scheduleAdvance(target: number) {
    if (autoAdvance.current) window.clearTimeout(autoAdvance.current);
    autoAdvance.current = window.setTimeout(() => goTo(target), 380);
  }

  function next() {
    if (!canContinue) return;
    goTo(step + 1);
  }

  function saveBookingDraft() {
    if (!service || !barber || !time) return;
    const draft: BookingDraft = {
      serviceId: service.id,
      barberId: barber.id,
      date,
      time,
      notes,
    };
    window.sessionStorage.setItem(bookingDraftKey, JSON.stringify(draft));
  }

  async function confirmBooking() {
    if (!user) {
      goTo(STEP_DETAILS);
      setSubmitError("Entre ou crie sua conta para confirmar o horário.");
      return;
    }
    if (!barber || !service || !time || !detailsAreValid) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const appointment = await bookPublicAppointment({
        barber,
        service: { ...service, price: selectedPrice },
        date,
        time,
        clientName,
        clientPhone,
        customerId: role === "client" ? user.id : undefined,
        notes,
      });
      setAppointmentId(appointment.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message = getBookingErrorMessage(error);
      setSubmitError(message);
      if (message.toLocaleLowerCase("pt-BR").includes("horário")) {
        setDirection(-1);
        setStep(STEP_SLOT);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (appointmentId && barber && service) {
    return (
      <BookingSuccess
        barber={barber}
        service={service}
        price={selectedPrice}
        date={date}
        time={time}
        clientName={clientName}
        role={role}
      />
    );
  }

  return (
    <div className="kb-site min-h-screen overflow-x-hidden">
      <BookingHeader />

      <main className="relative pb-36 pt-28 sm:pt-32 lg:pb-24">
        <div className="kb-container relative">
          <div className="mx-auto max-w-2xl text-center">
            <p className="kb-eyebrow kb-hero-reveal justify-center">Agendamento online</p>
            <h1 className="kb-editorial kb-hero-reveal mt-4 text-[clamp(2.6rem,7vw,4.6rem)] text-[#f4f0e8] [animation-delay:80ms]">
              Agendar horário
            </h1>
            <p className="kb-hero-reveal mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#a9a6a0] [animation-delay:160ms] sm:text-base">
              Escolha o serviço, o barbeiro e um horário livre. A confirmação é imediata e fica
              registrada na sua conta.
            </p>
          </div>

          <Stepper step={step} maxStep={maxStep} onSelect={goTo} />

          <div className="mx-auto mt-8 grid max-w-[1100px] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section
              ref={panelRef}
              aria-live="polite"
              className="relative min-h-[460px] min-w-0 overflow-hidden rounded-lg border border-white/10 bg-[#121212] p-5 sm:p-8 lg:p-10"
            >
              {loadingOptions ? (
                <LoadingState label="Abrindo a agenda" />
              ) : optionsError ? (
                <ErrorState
                  message={optionsError}
                  onRetry={() => setReloadKey((current) => current + 1)}
                />
              ) : (
                <div key={step} className={direction < 0 ? "kb-step-back" : "kb-step-in"}>
                  {step === STEP_SERVICE ? (
                    <ChoiceSection
                      index={1}
                      title="Escolha o serviço"
                      description="O valor pode variar conforme o barbeiro escolhido na próxima etapa."
                    >
                      {services.length ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {services.map((item) => {
                            const selected = service?.id === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setService(item);
                                  setTime("");
                                  scheduleAdvance(STEP_BARBER);
                                }}
                                aria-pressed={selected}
                                className={`kb-focus group relative overflow-hidden rounded-md border p-5 text-left transition-all duration-300 ${
                                  selected
                                    ? "border-[#c9a24a] bg-[#c9a24a]/10"
                                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a24a]">
                                      {item.category}
                                    </p>
                                    <h3 className="mt-2 text-lg font-semibold text-[#f4f0e8]">
                                      {item.name}
                                    </h3>
                                  </div>
                                  <SelectionMark
                                    selected={selected}
                                    icon={<Scissors size={16} />}
                                  />
                                </div>
                                <div className="mt-5 flex items-end justify-between gap-4">
                                  <span className="kb-editorial text-[1.75rem] text-[#f4f0e8]">
                                    {formatCurrency(
                                      barber
                                        ? resolveBarberServicePrice(
                                            barberPrices,
                                            barber.id,
                                            item.id,
                                            item.price,
                                          )
                                        : item.price,
                                    )}
                                  </span>
                                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs text-[#a9a6a0]">
                                    <Clock3 size={13} /> {item.duration} min
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyState message="Nenhum serviço está disponível neste momento." />
                      )}
                    </ChoiceSection>
                  ) : null}

                  {step === STEP_BARBER ? (
                    <ChoiceSection
                      index={2}
                      title="Escolha o barbeiro"
                      description="Os horários da próxima etapa são da agenda de quem você escolher."
                    >
                      {barbers.length ? (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {barbers.map((item) => {
                            const selected = barber?.id === item.id;
                            const price = service
                              ? resolveBarberServicePrice(
                                  barberPrices,
                                  item.id,
                                  service.id,
                                  service.price,
                                )
                              : null;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setBarber(item);
                                  setTime("");
                                  scheduleAdvance(STEP_SLOT);
                                }}
                                aria-pressed={selected}
                                className={`kb-focus group relative flex items-center gap-4 rounded-md border p-4 text-left transition-all duration-300 sm:flex-col sm:p-6 sm:text-center ${
                                  selected
                                    ? "border-[#c9a24a] bg-[#c9a24a]/10"
                                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                                }`}
                              >
                                <span className="relative shrink-0">
                                  <img
                                    src={item.image}
                                    alt={`Foto de ${item.name}`}
                                    className={`h-16 w-16 rounded-full object-cover ring-2 transition-all duration-300 sm:h-24 sm:w-24 ${
                                      selected
                                        ? "ring-[#c9a24a]"
                                        : "ring-white/10 group-hover:ring-white/25"
                                    }`}
                                  />
                                  {selected ? (
                                    <span className="kb-pop absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[#c9a24a] text-[#120f06] ring-4 ring-[#0d0d0f]">
                                      <Check size={14} strokeWidth={2.4} />
                                    </span>
                                  ) : null}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-lg font-semibold text-[#f4f0e8]">
                                    {item.name}
                                  </span>
                                  <span className="mt-0.5 block text-xs text-[#a9a6a0]">
                                    {item.title}
                                  </span>
                                  <span className="mt-2 flex items-center gap-3 text-xs sm:justify-center">
                                    <span className="inline-flex items-center gap-1 text-[#e6c773]">
                                      <Star size={12} className="fill-current" /> {item.rating}
                                    </span>
                                    {price !== null ? (
                                      <span className="font-semibold text-[#f4f0e8]">
                                        {formatCurrency(price)}
                                      </span>
                                    ) : null}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyState message="Nenhum barbeiro está disponível neste momento." />
                      )}
                    </ChoiceSection>
                  ) : null}

                  {step === STEP_SLOT ? (
                    <ChoiceSection
                      index={3}
                      title="Data e horário"
                      description={`Agenda de ${barber?.name ?? "seu barbeiro"} para os próximos 14 dias.`}
                    >
                      <DateStrip
                        dates={bookingDates}
                        value={date}
                        onChange={(value) => {
                          setDate(value);
                          setTime("");
                        }}
                      />

                      <div className="mt-8">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold capitalize text-[#f4f0e8]">
                            {formatDateLabel(date)}
                          </p>
                          {!loadingTimes && times.length ? (
                            <span className="text-xs text-[#a9a6a0]">
                              {times.length}{" "}
                              {times.length > 1 ? "horários livres" : "horário livre"}
                            </span>
                          ) : null}
                        </div>
                        {loadingTimes ? (
                          <SlotSkeleton />
                        ) : times.length ? (
                          <SlotGroups
                            times={times}
                            value={time}
                            onChange={(slot) => {
                              setTime(slot);
                              scheduleAdvance(STEP_DETAILS);
                            }}
                          />
                        ) : (
                          <EmptyState
                            message="Não há horários livres neste dia. Escolha outra data acima."
                            action={
                              <a
                                href={whatsappUrl(
                                  `Olá! Procuro um horário com ${barber?.name ?? "vocês"} em ${formatDateLabel(date)}. Tem encaixe?`,
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="kb-focus mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#25d366] transition hover:text-[#4ade80]"
                              >
                                <WhatsApp size={15} /> Perguntar por encaixe no WhatsApp
                              </a>
                            }
                          />
                        )}
                      </div>
                    </ChoiceSection>
                  ) : null}

                  {step === STEP_DETAILS ? (
                    <ChoiceSection
                      index={4}
                      title="Seus dados"
                      description={
                        user
                          ? "Confira os dados carregados da sua conta."
                          : "Entre ou crie seu cadastro para o horário ficar na sua conta."
                      }
                    >
                      {!initialized ? (
                        <LoadingState label="Verificando sua conta" compact />
                      ) : !user ? (
                        <div className="relative overflow-hidden rounded-lg border border-[#c9a24a]/30 bg-[#c9a24a]/[0.06] p-6 text-center sm:p-10">
                          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#c9a24a]/40 bg-[#c9a24a]/10 text-[#e6c773]">
                            <LogIn size={24} />
                          </span>
                          <h3 className="mt-5 text-2xl font-semibold text-[#f4f0e8]">
                            Entre para continuar
                          </h3>
                          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#a9a6a0]">
                            Suas escolhas ficam salvas. Depois de entrar, você volta para esta
                            etapa.
                          </p>
                          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => {
                                saveBookingDraft();
                                openAuth("login", "/agendar");
                              }}
                              className="kb-btn kb-btn-gold kb-btn-sm kb-focus"
                            >
                              <LogIn size={16} /> Já tenho conta
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                saveBookingDraft();
                                openAuth("signup", "/agendar");
                              }}
                              className="kb-btn kb-btn-outline kb-btn-sm kb-focus"
                            >
                              <UserRound size={16} /> Criar conta
                            </button>
                          </div>
                        </div>
                      ) : loadingProfile ? (
                        <LoadingState label="Carregando seus dados" compact />
                      ) : (
                        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
                          <div className="space-y-4">
                            <FieldShell icon={<UserRound size={15} />} label="Nome completo">
                              <input
                                value={clientName}
                                onChange={(event) => setClientName(event.target.value)}
                                maxLength={80}
                                autoComplete="name"
                                placeholder="Seu nome"
                                className="kb-focus h-12 w-full rounded-md border border-white/12 bg-white/[0.03] px-4 text-sm text-[#f4f0e8] transition placeholder:text-[#66666b] focus:border-[#c9a24a] focus:bg-white/[0.05]"
                              />
                            </FieldShell>
                            <FieldShell icon={<Phone size={15} />} label="WhatsApp com DDD">
                              <input
                                value={clientPhone}
                                onChange={(event) =>
                                  setClientPhone(formatPhone(event.target.value))
                                }
                                maxLength={19}
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="(11) 99999-9999"
                                className="kb-focus h-12 w-full rounded-md border border-white/12 bg-white/[0.03] px-4 text-sm text-[#f4f0e8] transition placeholder:text-[#66666b] focus:border-[#c9a24a] focus:bg-white/[0.05]"
                              />
                              {(clientName || clientPhone) && !detailsAreValid ? (
                                <span className="mt-2 block text-xs text-[#e7a29b]">
                                  Informe seu nome e um WhatsApp válido com DDD.
                                </span>
                              ) : null}
                            </FieldShell>
                            <FieldShell
                              label={
                                <>
                                  Observação{" "}
                                  <span className="font-normal text-[#737378]">(opcional)</span>
                                </>
                              }
                            >
                              <textarea
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                maxLength={500}
                                rows={3}
                                placeholder="Algo que o barbeiro precise saber?"
                                className="kb-focus w-full resize-none rounded-md border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-[#f4f0e8] transition placeholder:text-[#66666b] focus:border-[#c9a24a] focus:bg-white/[0.05]"
                              />
                            </FieldShell>
                          </div>
                          <div className="rounded-md border border-[#c9a24a]/25 bg-[#c9a24a]/[0.06] p-5 sm:p-6">
                            <ShieldCheck className="text-[#c9a24a]" size={26} />
                            <h3 className="mt-4 text-base font-semibold text-[#f4f0e8]">
                              Conta conectada
                            </h3>
                            <p className="mt-2 break-words text-sm leading-relaxed text-[#a9a6a0]">
                              Você entrou como{" "}
                              <strong className="text-[#f4f0e8]">{roleLabel(role)}</strong>
                              {user.email ? ` (${user.email})` : ""}. Este horário ficará no seu
                              histórico.
                            </p>
                            {profileError ? (
                              <p className="mt-4 text-xs leading-relaxed text-[#e7a29b]">
                                {profileError}
                              </p>
                            ) : null}
                            <Link
                              to={getProfilePath(role)}
                              className="kb-focus mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#e6c773] transition hover:text-[#f4f0e8]"
                            >
                              <Pencil size={13} /> Atualizar meus dados
                            </Link>
                          </div>
                        </div>
                      )}
                    </ChoiceSection>
                  ) : null}

                  {step === STEP_CONFIRM && barber && service ? (
                    <ChoiceSection
                      index={5}
                      title="Revise e confirme"
                      description="Revise e confirme. O horário só fica reservado depois de confirmar."
                    >
                      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                        <div className="rounded-md border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                          <SummaryRow
                            label="Serviço"
                            value={service.name}
                            onEdit={() => goTo(STEP_SERVICE)}
                          />
                          <SummaryRow
                            label="Barbeiro"
                            value={barber.name}
                            onEdit={() => goTo(STEP_BARBER)}
                          />
                          <SummaryRow
                            label="Data"
                            value={formatDateLabel(date)}
                            onEdit={() => goTo(STEP_SLOT)}
                            capitalize
                          />
                          <SummaryRow label="Horário" value={time} onEdit={() => goTo(STEP_SLOT)} />
                          <SummaryRow label="Duração" value={`${service.duration} min`} />
                          <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-5">
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#a9a6a0]">
                              Total
                            </span>
                            <span className="kb-editorial text-4xl text-[#f4f0e8]">
                              {formatCurrency(selectedPrice)}
                            </span>
                          </div>
                        </div>
                        <div className="rounded-md border border-white/10 p-5 sm:p-6">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a24a]">
                            Contato
                          </p>
                          <p className="mt-4 font-semibold text-[#f4f0e8]">{clientName.trim()}</p>
                          <p className="mt-1 text-sm text-[#a9a6a0]">{clientPhone}</p>
                          {notes.trim() ? (
                            <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-relaxed text-[#a9a6a0]">
                              “{notes.trim()}”
                            </p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => goTo(STEP_DETAILS)}
                            className="kb-focus mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#e6c773] transition hover:text-[#f4f0e8]"
                          >
                            <Pencil size={13} /> Editar dados
                          </button>
                          <p className="mt-6 flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-relaxed text-[#a9a6a0]">
                            <MapPin size={14} className="mt-px shrink-0 text-[#c9a24a]" />
                            {brand.address.full}
                          </p>
                        </div>
                      </div>
                    </ChoiceSection>
                  ) : null}
                </div>
              )}

              {submitError ? (
                <div
                  role="alert"
                  className="kb-pop mt-6 rounded-md border border-[#b85c54]/40 bg-[#b85c54]/10 px-4 py-3 text-sm text-[#f0b5af]"
                >
                  {submitError}
                </div>
              ) : null}

              {!loadingOptions && !optionsError ? (
                <div className="mt-10 hidden items-center justify-between gap-3 border-t border-white/10 pt-6 lg:flex">
                  <button
                    type="button"
                    onClick={() => goTo(step - 1)}
                    disabled={step === 0 || submitting}
                    className="kb-btn kb-btn-outline kb-btn-sm kb-focus disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ArrowLeft size={15} /> Voltar
                  </button>
                  <PrimaryAction
                    step={step}
                    canContinue={canContinue}
                    loadingTimes={loadingTimes}
                    submitting={submitting}
                    onNext={next}
                    onConfirm={() => void confirmBooking()}
                  />
                </div>
              ) : null}
            </section>

            <aside className="hidden lg:sticky lg:top-28 lg:block">
              <BookingSummary
                service={service}
                barber={barber}
                date={date}
                time={time}
                price={selectedPrice}
                step={step}
                maxStep={maxStep}
                onEdit={goTo}
              />
            </aside>
          </div>

          <p className="mx-auto mt-8 max-w-md text-center text-xs leading-relaxed text-[#737378]">
            Precisa alterar um horário já marcado?{" "}
            <a
              href={whatsappUrl("Olá! Preciso alterar meu horário na King's Barber.")}
              target="_blank"
              rel="noreferrer"
              className="kb-focus font-semibold text-[#25d366] underline-offset-4 hover:underline"
            >
              Fale com a gente no WhatsApp
            </a>
            .
          </p>
        </div>
      </main>

      {!loadingOptions && !optionsError ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#070707]/94 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              disabled={step === 0 || submitting}
              aria-label="Voltar etapa"
              className="kb-focus grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/15 text-[#f4f0e8] transition disabled:opacity-30"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-[#a9a6a0]">
                {service ? service.name : "Escolha um serviço"}
                {time ? ` · ${time}` : ""}
              </p>
              <p className="text-sm font-bold text-[#f4f0e8]">
                {service ? formatCurrency(selectedPrice) : `Etapa ${step + 1} de ${steps.length}`}
              </p>
            </div>
            <PrimaryAction
              step={step}
              canContinue={canContinue}
              loadingTimes={loadingTimes}
              submitting={submitting}
              onNext={next}
              onConfirm={() => void confirmBooking()}
              compact
            />
          </div>
        </div>
      ) : null}

      <div className="hidden lg:block">
        <WhatsAppFab message="Olá! Estou agendando pelo site e tenho uma dúvida." />
      </div>
    </div>
  );
}

/* ───────────────────────── Estrutura ───────────────────────── */

function BookingHeader() {
  const { initialized, user, role } = useAuth();
  const { openAuth } = useAuthDialog();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0b0b0b]/95 backdrop-blur">
      <div className="kb-container grid h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Link
          to="/"
          className="kb-focus inline-flex items-center gap-2 justify-self-start rounded-full px-3 py-2 text-xs font-semibold text-[#a9a6a0] transition hover:text-[#e6c773]"
        >
          <ArrowLeft size={15} /> <span className="hidden sm:inline">Voltar ao site</span>
        </Link>
        <Link to="/" aria-label="King's Barber — início" className="kb-focus">
          <img
            src="/kings-barber-logo-light.png"
            alt="King's Barber"
            className="h-9 w-auto object-contain sm:h-10"
          />
        </Link>
        <div className="justify-self-end">
          {initialized && user ? (
            <Link
              to={getRoleHome(role)}
              className="kb-focus inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 text-xs font-semibold text-[#f4f0e8] transition hover:border-[#c9a24a]/60 hover:text-[#e6c773]"
            >
              <UserRound size={15} />
              <span className="hidden sm:inline">
                {role === "client" ? "Página inicial" : "Meu painel"}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAuth("login", "/agendar")}
              disabled={!initialized}
              className="kb-focus inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 text-xs font-semibold text-[#f4f0e8] transition hover:border-[#c9a24a]/60 hover:text-[#e6c773] disabled:cursor-wait disabled:opacity-60"
            >
              <LogIn size={15} /> <span className="hidden sm:inline">Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Stepper({
  step,
  maxStep,
  onSelect,
}: {
  step: number;
  maxStep: number;
  onSelect: (step: number) => void;
}) {
  const progress = step / (steps.length - 1);
  return (
    <nav aria-label="Etapas do agendamento" className="mx-auto mt-10 max-w-3xl">
      <ol className="relative flex items-start justify-between">
        <span aria-hidden className="absolute left-[10%] right-[10%] top-[18px] h-px bg-white/10" />
        <span
          aria-hidden
          className="absolute left-[10%] top-[18px] h-px bg-[#c9a24a] transition-all duration-700 [transition-timing-function:cubic-bezier(.22,1,.36,1)]"
          style={{ width: `${progress * 80}%` }}
        />
        {steps.map((item, index) => {
          const done = index < step;
          const current = index === step;
          const reachable = index <= maxStep && index !== step;
          return (
            <li key={item.label} className="relative z-10 flex w-[20%] flex-col items-center">
              <button
                type="button"
                onClick={() => reachable && onSelect(index)}
                disabled={!reachable}
                aria-current={current ? "step" : undefined}
                aria-label={`Etapa ${index + 1}: ${item.label}`}
                className={`kb-focus grid h-9 w-9 place-items-center rounded-full border text-xs font-bold transition-all duration-500 disabled:cursor-default ${
                  done
                    ? "border-[#c9a24a] bg-[#c9a24a] text-[#120f06]"
                    : current
                      ? "scale-110 border-[#e6c773] bg-[#0d0d0f] text-[#e6c773]"
                      : "border-white/15 bg-[#0d0d0f] text-[#737378]"
                } ${reachable ? "hover:scale-110" : ""}`}
              >
                {done ? <Check size={15} strokeWidth={2.4} /> : index + 1}
              </button>
              <span
                className={`mt-2.5 text-center text-[10.5px] font-semibold transition-colors sm:text-xs ${
                  current ? "text-[#f4f0e8]" : "text-[#737378]"
                }`}
              >
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function PrimaryAction({
  step,
  canContinue,
  loadingTimes,
  submitting,
  onNext,
  onConfirm,
  compact = false,
}: {
  step: number;
  canContinue: boolean;
  loadingTimes: boolean;
  submitting: boolean;
  onNext: () => void;
  onConfirm: () => void;
  compact?: boolean;
}) {
  const size = compact ? "!h-12 !px-5" : "kb-btn-sm";
  if (step < steps.length - 1) {
    return (
      <button
        type="button"
        onClick={onNext}
        disabled={!canContinue || loadingTimes}
        className={`kb-btn kb-btn-gold kb-focus ${size} disabled:pointer-events-none disabled:opacity-40`}
      >
        Continuar <ArrowRight size={15} />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onConfirm}
      disabled={submitting || !canContinue}
      className={`kb-btn kb-btn-gold kb-focus ${size} disabled:pointer-events-none disabled:opacity-40`}
    >
      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
      {submitting ? "Confirmando..." : "Confirmar horário"}
    </button>
  );
}

function BookingSummary({
  service,
  barber,
  date,
  time,
  price,
  step,
  maxStep,
  onEdit,
}: {
  service: ServiceRecord | null;
  barber: EmployeeRecord | null;
  date: string;
  time: string;
  price: number;
  step: number;
  maxStep: number;
  onEdit: (step: number) => void;
}) {
  const rows = [
    {
      step: STEP_SERVICE,
      icon: <Scissors size={16} />,
      label: "Serviço",
      value: service ? `${service.name} · ${service.duration} min` : "",
    },
    {
      step: STEP_BARBER,
      icon: <UserRound size={16} />,
      label: "Profissional",
      value: barber?.name ?? "",
    },
    {
      step: STEP_SLOT,
      icon: <CalendarDays size={16} />,
      label: "Data e horário",
      value: time ? `${formatShortDate(date)} às ${time}` : "",
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#121212] backdrop-blur">
      <div className="relative border-b border-white/8 p-6">
        <div className="relative flex items-center gap-3">
          <CrownMark size={26} />
          <p className="text-sm font-semibold text-[#f4f0e8]">Seu agendamento</p>
        </div>
      </div>
      <ul className="space-y-1 p-3">
        {rows.map((row) => {
          const filled = Boolean(row.value);
          const editable = row.step <= maxStep && row.step !== step;
          return (
            <li key={row.label}>
              <button
                type="button"
                disabled={!editable}
                onClick={() => onEdit(row.step)}
                className={`kb-focus group flex w-full items-center gap-3 rounded-md p-3 text-left transition ${
                  editable ? "hover:bg-white/[0.04]" : "cursor-default"
                } ${row.step === step ? "bg-white/[0.04]" : ""}`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-md transition-colors ${
                    filled ? "bg-[#c9a24a]/15 text-[#e6c773]" : "bg-white/[0.04] text-[#56565b]"
                  }`}
                >
                  {row.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#737378]">
                    {row.label}
                  </span>
                  <span
                    className={`block truncate text-sm capitalize-first ${
                      filled ? "font-semibold text-[#f4f0e8]" : "text-[#56565b]"
                    }`}
                  >
                    {filled ? row.value : "A escolher"}
                  </span>
                </span>
                {editable && filled ? (
                  <Pencil
                    size={14}
                    className="text-[#737378] opacity-0 transition group-hover:opacity-100"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-end justify-between border-t border-white/8 p-6">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#a9a6a0]">Total</span>
        <span key={price} className="kb-editorial text-4xl text-[#f4f0e8]">
          {service ? formatCurrency(price) : "—"}
        </span>
      </div>
      <a
        href={mapsSearchUrl}
        target="_blank"
        rel="noreferrer"
        className="kb-focus flex items-center gap-2 border-t border-white/8 px-6 py-4 text-xs text-[#a9a6a0] transition hover:text-[#f4f0e8]"
      >
        <MapPin size={14} className="shrink-0 text-[#c9a24a]" /> {brand.address.full}
      </a>
    </div>
  );
}

function DateStrip({
  dates,
  value,
  onChange,
}: {
  dates: Date[];
  value: string;
  onChange: (value: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scroller.current;
    const selected = container?.querySelector<HTMLButtonElement>("[aria-pressed='true']");
    if (!container || !selected) return;
    const target = selected.offsetLeft - container.clientWidth / 2 + selected.offsetWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [value]);

  return (
    <div className="relative -mx-5 sm:mx-0">
      <div
        ref={scroller}
        className="kb-no-scrollbar flex snap-x gap-2.5 overflow-x-auto px-5 pb-1 sm:px-0"
        role="group"
        aria-label="Escolha o dia"
      >
        {dates.map((day, index) => {
          const key = format(day, "yyyy-MM-dd");
          const selected = key === value;
          const closed = brand.schedule[day.getDay()] === null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={selected}
              aria-label={`${format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}${closed ? " (fechado)" : ""}`}
              className={`kb-focus relative flex w-[4.6rem] shrink-0 snap-start flex-col items-center rounded-md border px-2 py-3.5 transition-all duration-300 ${
                selected
                  ? "border-[#c9a24a] bg-[#c9a24a] text-[#120f06]"
                  : closed
                    ? "border-white/6 bg-transparent text-[#56565b]"
                    : "border-white/10 bg-white/[0.02] text-[#f4f0e8] hover:border-white/25"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                  selected ? "text-[#120f06]/70" : "text-[#a9a6a0]"
                }`}
              >
                {index === 0
                  ? "Hoje"
                  : index === 1
                    ? "Amanhã"
                    : format(day, "EEE", { locale: ptBR }).replace(".", "")}
              </span>
              <span className="kb-editorial mt-1 text-[1.9rem] leading-none">
                {format(day, "dd")}
              </span>
              <span
                className={`mt-1 text-[11px] ${selected ? "text-[#120f06]/70" : "text-[#a9a6a0]"}`}
              >
                {closed ? "fechado" : format(day, "MMM", { locale: ptBR }).replace(".", "")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SlotGroups({
  times,
  value,
  onChange,
}: {
  times: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const hourOf = (slot: string) => Number(slot.slice(0, 2));
  const groups = [
    { label: "Manhã", items: times.filter((slot) => hourOf(slot) < 12) },
    { label: "Tarde", items: times.filter((slot) => hourOf(slot) >= 12 && hourOf(slot) < 18) },
    { label: "Noite", items: times.filter((slot) => hourOf(slot) >= 18) },
  ].filter((group) => group.items.length);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#737378]">
            {group.label}
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 xl:grid-cols-6">
            {group.items.map((slot, index) => (
              <button
                key={slot}
                type="button"
                onClick={() => onChange(slot)}
                aria-pressed={value === slot}
                className={`kb-focus rounded-md border py-3 text-sm font-bold tabular-nums transition-all duration-300 ${
                  value === slot
                    ? "scale-[1.04] border-[#c9a24a] bg-[#c9a24a] text-[#120f06]"
                    : "border-white/10 bg-white/[0.02] text-[#f4f0e8] hover:border-[#c9a24a]/60 hover:bg-[#c9a24a]/8"
                }`}
                style={{ animationDelay: `${index * 25}ms` }}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlotSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 xl:grid-cols-6" aria-busy="true">
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          className="h-12 animate-pulse rounded-md bg-white/[0.04]"
          style={{ animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  );
}

function SelectionMark({ selected, icon }: { selected: boolean; icon: ReactNode }) {
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
        selected
          ? "border-[#c9a24a] bg-[#c9a24a] text-[#120f06]"
          : "border-white/10 text-[#56565b] group-hover:border-white/25 group-hover:text-[#a9a6a0]"
      }`}
    >
      {selected ? <Check size={16} strokeWidth={2.4} className="kb-pop" /> : icon}
    </span>
  );
}

function FieldShell({
  icon,
  label,
  children,
}: {
  icon?: ReactNode;
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#d9d4ca]">
        {icon ? <span className="text-[#c9a24a]">{icon}</span> : null} {label}
      </span>
      {children}
    </label>
  );
}

/* ───────────────────────── Sucesso ───────────────────────── */

function BookingSuccess({
  barber,
  service,
  price,
  date,
  time,
  clientName,
  role,
}: {
  barber: EmployeeRecord;
  service: ServiceRecord;
  price: number;
  date: string;
  time: string;
  clientName: string;
  role: AppRole;
}) {
  const calendarUrl = buildCalendarUrl({ service, barber, date, time });
  const shareMessage = `Olá! Acabei de agendar ${service.name} com ${barber.name} em ${formatDateLabel(date)} às ${time}. Até lá!`;

  return (
    <div className="kb-site grid min-h-screen place-items-center overflow-hidden px-5 py-16">
      <main className="relative z-10 w-full max-w-xl text-center">
        <div className="kb-pop mx-auto grid h-24 w-24 place-items-center rounded-full border border-[#c9a24a]/40 bg-[#c9a24a]/10 text-[#e6c773]">
          <svg viewBox="0 0 52 52" width="46" height="46" fill="none" aria-hidden>
            <circle
              cx="26"
              cy="26"
              r="23"
              stroke="currentColor"
              strokeWidth="2"
              pathLength={1}
              className="kb-draw"
              style={{ animationDuration: "1s" }}
            />
            <path
              d="m16 27 7 7 14-15"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              className="kb-draw"
              style={{ animationDelay: "500ms", animationDuration: "800ms" }}
            />
          </svg>
        </div>
        <p className="kb-eyebrow kb-hero-reveal mt-8 justify-center [animation-delay:200ms]">
          {firstName(clientName)}, seu horário está reservado
        </p>
        <h1 className="kb-editorial kb-hero-reveal mt-4 text-[clamp(2.6rem,8vw,4.4rem)] text-[#f4f0e8] [animation-delay:300ms]">
          Agendamento confirmado
        </h1>
        <p className="kb-hero-reveal mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#a9a6a0] [animation-delay:400ms]">
          Enviamos o registro para a sua conta. Chegue com alguns minutos de antecedência.
        </p>

        <div className="kb-hero-reveal mx-auto mt-9 overflow-hidden rounded-lg border border-white/10 bg-[#121212] text-left [animation-delay:500ms]">
          <div className="flex items-center gap-4 border-b border-white/8 p-5 sm:p-6">
            <img
              src={barber.image}
              alt={`Foto de ${barber.name}`}
              className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[#c9a24a]/50"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-[#f4f0e8]">{service.name}</p>
              <p className="text-sm text-[#a9a6a0]">com {barber.name}</p>
            </div>
            <p className="kb-editorial text-3xl text-[#f4f0e8]">{formatCurrency(price)}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-white/8">
            <div className="p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737378]">
                Data
              </p>
              <p className="mt-1.5 font-semibold capitalize text-[#f4f0e8]">
                {formatShortDate(date)}
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737378]">
                Horário
              </p>
              <p className="mt-1.5 font-semibold text-[#f4f0e8]">{time}</p>
            </div>
          </div>
          <div className="grid gap-px border-t border-white/8 bg-white/8 sm:grid-cols-3">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noreferrer"
              className="kb-focus flex items-center justify-center gap-2 bg-[#0d0d0f] px-4 py-4 text-xs font-bold text-[#f4f0e8] transition hover:bg-[#151517] hover:text-[#e6c773]"
            >
              <CalendarDays size={15} /> Salvar na agenda
            </a>
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="kb-focus flex items-center justify-center gap-2 bg-[#0d0d0f] px-4 py-4 text-xs font-bold text-[#f4f0e8] transition hover:bg-[#151517] hover:text-[#e6c773]"
            >
              <MapPin size={15} /> Como chegar
            </a>
            <a
              href={whatsappUrl(shareMessage)}
              target="_blank"
              rel="noreferrer"
              className="kb-focus flex items-center justify-center gap-2 bg-[#0d0d0f] px-4 py-4 text-xs font-bold text-[#f4f0e8] transition hover:bg-[#151517] hover:text-[#25d366]"
            >
              <WhatsApp size={15} /> Avisar a barbearia
            </a>
          </div>
        </div>

        <div className="kb-hero-reveal mt-8 flex flex-col justify-center gap-3 [animation-delay:650ms] sm:flex-row">
          <Link to={getRoleHome(role)} className="kb-btn kb-btn-gold kb-focus">
            <CheckCircle2 size={17} />
            {role === "client" ? "Ver na página inicial" : "Ir para meu painel"}
          </Link>
          <Link to="/" className="kb-btn kb-btn-outline kb-focus">
            Voltar ao início
          </Link>
        </div>
        <p className="mt-6 text-xs text-[#737378]">Este agendamento está vinculado à sua conta.</p>
      </main>
    </div>
  );
}

/* ───────────────────────── Peças ───────────────────────── */

function ChoiceSection({
  index,
  title,
  description,
  children,
}: {
  index: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c9a24a]">
        Etapa {index} de {steps.length}
      </p>
      <h2 className="kb-editorial mt-2 text-[2.1rem] text-[#f4f0e8] sm:text-[2.6rem]">{title}</h2>
      <p className="mb-7 mt-2 text-sm text-[#a9a6a0]">{description}</p>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  onEdit,
  capitalize = false,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-white/8 py-3 first:pt-0 last:border-0 last:pb-0">
      <span className="text-sm text-[#a9a6a0]">{label}</span>
      <span className="flex items-center gap-2 text-right">
        <span className={`text-sm font-semibold text-[#f4f0e8] ${capitalize ? "capitalize" : ""}`}>
          {value}
        </span>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Alterar ${label.toLowerCase()}`}
            className="kb-focus grid h-7 w-7 place-items-center rounded-full text-[#737378] transition hover:bg-white/5 hover:text-[#e6c773]"
          >
            <Pencil size={13} />
          </button>
        ) : null}
      </span>
    </div>
  );
}

function LoadingState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 text-sm text-[#a9a6a0] ${
        compact ? "min-h-40" : "min-h-[380px]"
      }`}
    >
      <span className="relative grid h-12 w-12 place-items-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-[#c9a24a]/15 border-t-[#c9a24a]" />
        <CrownMark size={20} />
      </span>
      {label}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full border border-white/10 text-[#c9a24a]">
        <CalendarDays size={28} />
      </span>
      <h2 className="kb-editorial mt-5 text-3xl text-[#f4f0e8]">Agenda indisponível</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#a9a6a0]">{message}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className="kb-btn kb-btn-outline kb-btn-sm kb-focus"
        >
          <RefreshCw size={15} /> Tentar novamente
        </button>
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noreferrer"
          className="kb-btn kb-btn-whats kb-btn-sm kb-focus"
        >
          <WhatsApp size={16} /> Agendar pelo WhatsApp
        </a>
      </div>
    </div>
  );
}

function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-dashed border-white/15 px-5 py-12 text-center text-sm text-[#a9a6a0]">
      {message}
      {action}
    </div>
  );
}

/* ───────────────────────── Utilidades ───────────────────────── */

function readBookingDraft(): BookingDraft | null {
  try {
    const raw = window.sessionStorage.getItem(bookingDraftKey);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<BookingDraft>;
    if (
      typeof draft.serviceId !== "string" ||
      typeof draft.barberId !== "string" ||
      typeof draft.date !== "string" ||
      typeof draft.time !== "string" ||
      typeof draft.notes !== "string"
    ) {
      return null;
    }
    return draft as BookingDraft;
  } catch {
    return null;
  }
}

function buildCalendarUrl({
  service,
  barber,
  date,
  time,
}: {
  service: ServiceRecord;
  barber: EmployeeRecord;
  date: string;
  time: string;
}) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  // Horário de parede (sem "Z"): o Google interpreta no fuso informado em `ctz`.
  const start = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const end = new Date(start.getTime() + Number(service.duration || 30) * 60_000);
  const stamp = (value: Date) => value.toISOString().replace(/[-:]/g, "").slice(0, 15);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${service.name} — ${brand.name}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    ctz: brand.timezone,
    details: `Atendimento com ${barber.name}. Dúvidas: ${brand.whatsapp.display}`,
    location: `${brand.name}, ${brand.address.full}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function roleLabel(role: AppRole) {
  if (role === "owner") return "proprietário";
  if (role === "barber") return "barbeiro";
  return "cliente";
}

function getProfilePath(role: AppRole) {
  if (role === "owner") return "/owner/settings" as const;
  if (role === "barber") return "/barber/profile" as const;
  return "/client/profile" as const;
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return format(new Date(year, month - 1, day), "EEEE, dd 'de' MMMM", { locale: ptBR });
}

function formatShortDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return format(new Date(year, month - 1, day), "EEE, dd/MM", { locale: ptBR });
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length > 11) {
    const country = digits.slice(0, 2);
    const area = digits.slice(2, 4);
    const first = digits.slice(4, 9);
    const last = digits.slice(9);
    return `+${country} (${area}) ${first}${last ? `-${last}` : ""}`;
  }
  if (digits.length > 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length > 2) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length) return `(${digits}`;
  return "";
}

function getBookingErrorMessage(error: unknown) {
  if (error instanceof Error && error.cause && typeof error.cause === "object") {
    const cause = error.cause as { message?: unknown };
    if (typeof cause.message === "string" && cause.message) return cause.message;
  }
  return error instanceof Error && error.message
    ? error.message
    : "Não foi possível confirmar o agendamento. Tente novamente.";
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "cliente";
}
