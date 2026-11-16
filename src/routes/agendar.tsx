import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  LogIn,
  Phone,
  RefreshCw,
  Scissors,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/shared/utils/format";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar horário — King's Barber" },
      {
        name: "description",
        content:
          "Entre na sua conta, escolha o serviço, o barbeiro e o melhor horário na King's Barber.",
      },
      { name: "theme-color", content: "#050505" },
    ],
  }),
  component: PublicBookingPage,
});

const steps = ["Serviço", "Barbeiro", "Data", "Horário", "Seus dados", "Confirmar"];
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
  const bookingDates = useMemo(
    () => Array.from({ length: 14 }, (_, index) => addDays(new Date(), index)),
    [],
  );
  const [step, setStep] = useState(0);
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

  useEffect(() => {
    if (loadingOptions || draftRestored) return;
    const draft = readBookingDraft();
    if (draft) {
      const draftService = services.find((item) => item.id === draft.serviceId);
      const draftBarber = barbers.find((item) => item.id === draft.barberId);
      if (draftService && draftBarber) {
        setService(draftService);
        setBarber(draftBarber);
        setDate(draft.date);
        setTime(draft.time);
        setNotes(draft.notes);
        setStep(4);
      }
      window.sessionStorage.removeItem(bookingDraftKey);
    }
    setDraftRestored(true);
  }, [barbers, draftRestored, loadingOptions, services]);

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
  const canContinue =
    (step === 0 && Boolean(service)) ||
    (step === 1 && Boolean(barber)) ||
    (step === 2 && Boolean(date)) ||
    (step === 3 && Boolean(time)) ||
    (step === 4 && Boolean(time) && detailsAreValid && !loadingProfile) ||
    step === 5;

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

  function next() {
    if (!canContinue) return;
    setSubmitError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previous() {
    setSubmitError("");
    setStep((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmBooking() {
    if (!user) {
      setStep(4);
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
      if (message.toLocaleLowerCase("pt-BR").includes("horário")) setStep(3);
    } finally {
      setSubmitting(false);
    }
  }

  if (appointmentId && barber && service) {
    return (
      <BookingSuccess
        barber={barber}
        service={service}
        date={date}
        time={time}
        clientName={clientName}
        role={role}
      />
    );
  }

  return (
    <div className="kb-site min-h-screen bg-[#050505] text-[#f4f0e8]">
      <header className="relative z-10 border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Link to="/" hash="inicio" className="kb-focus" aria-label="Voltar ao início">
            <img
              src="/kings-barber-logo-light.png"
              alt="King's Barber"
              className="h-12 w-auto object-contain"
            />
          </Link>
          {initialized && user ? (
            <Link
              to={getRoleHome(role)}
              className="kb-focus inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#a7a7aa] transition hover:text-[#e2c16b]"
            >
              <UserRound size={16} /> {role === "client" ? "Início" : "Meu painel"}
            </Link>
          ) : (
            <Link
              to="/login"
              search={{ redirect: "/agendar", mode: "login" }}
              className="kb-focus inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#a7a7aa] transition hover:text-[#e2c16b]"
            >
              <LogIn size={16} /> Entrar
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
        <div className="mb-8 max-w-2xl sm:mb-12">
          <Link
            to="/"
            hash="inicio"
            className="kb-focus inline-flex items-center gap-2 text-xs text-[#a7a7aa] transition hover:text-[#e2c16b]"
          >
            <ArrowLeft size={14} /> Voltar para o site
          </Link>
          <p className="kb-eyebrow mt-7">Agendamento online</p>
          <h1 className="kb-editorial mt-3 text-[clamp(2.5rem,7vw,4.5rem)]">Reserve seu horário</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#a7a7aa] sm:text-base">
            Escolha o serviço e o melhor horário. Ao entrar, seus dados são preenchidos
            automaticamente e o agendamento fica vinculado à sua conta.
          </p>
        </div>

        <div className="mb-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#0e0e10] p-3 sm:p-4">
          <div className="flex min-w-[620px] items-center justify-between">
            {steps.map((label, index) => (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs transition ${
                      index < step
                        ? "border-[#c9a24a] bg-[#c9a24a] text-[#131007]"
                        : index === step
                          ? "border-[#c9a24a] text-[#e2c16b]"
                          : "border-white/15 text-[#737378]"
                    }`}
                    aria-current={index === step ? "step" : undefined}
                  >
                    {index < step ? <Check size={14} /> : index + 1}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      index === step ? "text-[#f4f0e8]" : "text-[#737378]"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < steps.length - 1 ? (
                  <span className="mx-3 h-px flex-1 bg-white/10" />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <section className="min-h-[460px] rounded-[24px] border border-white/10 bg-[#0e0e10] p-5 sm:p-8 lg:p-10">
          {loadingOptions ? (
            <LoadingState label="Abrindo a agenda" />
          ) : optionsError ? (
            <ErrorState
              message={optionsError}
              onRetry={() => setReloadKey((current) => current + 1)}
            />
          ) : (
            <>
              {step === 0 ? (
                <ChoiceSection
                  eyebrow="Primeiro passo"
                  title="Qual serviço você procura?"
                  description="O tempo e o valor podem variar conforme o serviço escolhido."
                >
                  {services.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {services.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setService(item);
                            setTime("");
                          }}
                          aria-pressed={service?.id === item.id}
                          className={`kb-focus rounded-2xl border p-5 text-left transition ${
                            service?.id === item.id
                              ? "border-[#c9a24a] bg-[#c9a24a]/8"
                              : "border-white/10 bg-[#141416] hover:border-white/25"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a24a]">
                                {item.category}
                              </p>
                              <h3 className="mt-2 text-base font-semibold text-[#f4f0e8]">
                                {item.name}
                              </h3>
                            </div>
                            {service?.id === item.id ? (
                              <CheckCircle2 className="shrink-0 text-[#c9a24a]" size={20} />
                            ) : (
                              <Scissors className="shrink-0 text-[#56565b]" size={19} />
                            )}
                          </div>
                          <div className="mt-6 flex items-end justify-between gap-4">
                            <span className="text-xl font-semibold text-[#e2c16b]">
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
                            <span className="flex items-center gap-1 text-xs text-[#a7a7aa]">
                              <Clock3 size={13} /> {item.duration} min
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Nenhum serviço está disponível neste momento." />
                  )}
                </ChoiceSection>
              ) : null}

              {step === 1 ? (
                <ChoiceSection
                  eyebrow="Seu profissional"
                  title="Escolha o barbeiro"
                  description="Selecione quem vai cuidar do seu atendimento."
                >
                  {barbers.length ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {barbers.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setBarber(item);
                            setTime("");
                          }}
                          aria-pressed={barber?.id === item.id}
                          className={`kb-focus flex items-center gap-4 rounded-2xl border p-4 text-left transition sm:block sm:p-6 ${
                            barber?.id === item.id
                              ? "border-[#c9a24a] bg-[#c9a24a]/8"
                              : "border-white/10 bg-[#141416] hover:border-white/25"
                          }`}
                        >
                          <img
                            src={item.image}
                            alt={`Foto de ${item.name}`}
                            className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-white/15 sm:mx-auto sm:h-28 sm:w-28"
                          />
                          <div className="min-w-0 sm:mt-5 sm:text-center">
                            <div className="flex items-center gap-2 sm:justify-center">
                              <h3 className="truncate text-lg font-semibold text-[#f4f0e8]">
                                {item.name}
                              </h3>
                              {barber?.id === item.id ? (
                                <CheckCircle2 className="shrink-0 text-[#c9a24a]" size={18} />
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-[#a7a7aa]">{item.title}</p>
                            <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#e2c16b]">
                              <Star size={12} className="fill-current" /> {item.rating}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Nenhum barbeiro está disponível neste momento." />
                  )}
                </ChoiceSection>
              ) : null}

              {step === 2 ? (
                <ChoiceSection
                  eyebrow="Escolha o dia"
                  title="Quando você quer vir?"
                  description="A agenda abaixo mostra os próximos 14 dias."
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                    {bookingDates.map((day) => {
                      const value = format(day, "yyyy-MM-dd");
                      const selected = value === date;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setDate(value);
                            setTime("");
                          }}
                          aria-pressed={selected}
                          className={`kb-focus rounded-2xl border px-3 py-4 text-center transition ${
                            selected
                              ? "border-[#c9a24a] bg-[#c9a24a]/8 text-[#e2c16b]"
                              : "border-white/10 bg-[#141416] hover:border-white/25"
                          }`}
                        >
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a7a7aa]">
                            {format(day, "EEE", { locale: ptBR })}
                          </span>
                          <span className="kb-editorial mt-1 block text-3xl">
                            {format(day, "dd")}
                          </span>
                          <span className="block text-xs">
                            {format(day, "MMM", { locale: ptBR })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </ChoiceSection>
              ) : null}

              {step === 3 ? (
                <ChoiceSection
                  eyebrow="Horários livres"
                  title="Qual horário fica melhor?"
                  description={`${barber?.name ?? "Barbeiro"} · ${formatDateLabel(date)}`}
                >
                  {loadingTimes ? (
                    <LoadingState label="Consultando horários disponíveis" compact />
                  ) : times.length ? (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
                      {times.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTime(slot)}
                          aria-pressed={time === slot}
                          className={`kb-focus rounded-xl border py-3.5 text-sm font-semibold transition ${
                            time === slot
                              ? "border-[#c9a24a] bg-[#c9a24a] text-[#131007]"
                              : "border-white/10 bg-[#141416] text-[#f4f0e8] hover:border-[#c9a24a]/60"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="Não há horários livres neste dia. Volte e escolha outra data." />
                  )}
                </ChoiceSection>
              ) : null}

              {step === 4 ? (
                <ChoiceSection
                  eyebrow="Quase pronto"
                  title="Como podemos falar com você?"
                  description={
                    user
                      ? "Confira os dados carregados da sua conta antes de continuar."
                      : "Entre ou crie seu cadastro para vincular o horário à sua conta."
                  }
                >
                  {!initialized ? (
                    <LoadingState label="Verificando sua conta" compact />
                  ) : !user ? (
                    <div className="rounded-2xl border border-[#c9a24a]/30 bg-[#c9a24a]/5 p-6 sm:p-8">
                      <div className="grid h-12 w-12 place-items-center rounded-full border border-[#c9a24a]/40 bg-[#c9a24a]/10 text-[#e2c16b]">
                        <LogIn size={22} />
                      </div>
                      <h3 className="mt-5 text-xl font-semibold text-[#f4f0e8]">
                        Acesse sua conta para continuar
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#a7a7aa]">
                        O login conecta este agendamento ao ambiente correto. Clientes acompanham
                        seus horários, enquanto barbeiros e proprietários voltam ao próprio painel.
                      </p>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                          to="/login"
                          search={{ redirect: "/agendar", mode: "login" }}
                          onClick={saveBookingDraft}
                          className="kb-btn kb-btn-gold kb-btn-sm kb-focus"
                        >
                          <LogIn size={16} /> Entrar
                        </Link>
                        <Link
                          to="/login"
                          search={{ redirect: "/agendar", mode: "signup" }}
                          onClick={saveBookingDraft}
                          className="kb-btn kb-btn-outline kb-btn-sm kb-focus"
                        >
                          <UserRound size={16} /> Criar cadastro
                        </Link>
                      </div>
                    </div>
                  ) : loadingProfile ? (
                    <LoadingState label="Carregando seus dados" compact />
                  ) : (
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                      <div className="space-y-4">
                        <label className="block">
                          <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#d6d2ca]">
                            <UserRound size={14} className="text-[#c9a24a]" /> Nome completo
                          </span>
                          <input
                            value={clientName}
                            onChange={(event) => setClientName(event.target.value)}
                            maxLength={80}
                            autoComplete="name"
                            placeholder="Seu nome"
                            className="kb-focus h-12 w-full rounded-xl border border-white/12 bg-[#141416] px-4 text-sm text-[#f4f0e8] placeholder:text-[#66666b]"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#d6d2ca]">
                            <Phone size={14} className="text-[#c9a24a]" /> WhatsApp com DDD
                          </span>
                          <input
                            value={clientPhone}
                            onChange={(event) => setClientPhone(formatPhone(event.target.value))}
                            maxLength={19}
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="(11) 99999-9999"
                            className="kb-focus h-12 w-full rounded-xl border border-white/12 bg-[#141416] px-4 text-sm text-[#f4f0e8] placeholder:text-[#66666b]"
                          />
                          {(clientName || clientPhone) && !detailsAreValid ? (
                            <span className="mt-2 block text-xs text-[#e7a29b]">
                              Informe seu nome e um WhatsApp válido com DDD.
                            </span>
                          ) : null}
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold text-[#d6d2ca]">
                            Observação{" "}
                            <span className="font-normal text-[#737378]">(opcional)</span>
                          </span>
                          <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Algo que o barbeiro precisa saber?"
                            className="kb-focus w-full resize-none rounded-xl border border-white/12 bg-[#141416] px-4 py-3 text-sm text-[#f4f0e8] placeholder:text-[#66666b]"
                          />
                        </label>
                      </div>
                      <div className="rounded-2xl border border-[#c9a24a]/25 bg-[#c9a24a]/5 p-5 sm:p-6">
                        <ShieldCheck className="text-[#c9a24a]" size={24} />
                        <h3 className="mt-4 text-base font-semibold">Dados da sua conta</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#a7a7aa]">
                          Você entrou como{" "}
                          <strong className="text-[#f4f0e8]">{roleLabel(role)}</strong>
                          {user.email ? ` (${user.email})` : ""}. Este horário ficará associado ao
                          seu acesso.
                        </p>
                        {profileError ? (
                          <p className="mt-4 text-xs leading-relaxed text-[#e7a29b]">
                            {profileError}
                          </p>
                        ) : null}
                        <Link
                          to={getProfilePath(role)}
                          className="kb-focus mt-5 inline-flex text-xs font-semibold text-[#e2c16b] transition hover:text-[#f4f0e8]"
                        >
                          Atualizar meus dados
                        </Link>
                      </div>
                    </div>
                  )}
                </ChoiceSection>
              ) : null}

              {step === 5 && barber && service ? (
                <ChoiceSection
                  eyebrow="Revise os dados"
                  title="Tudo certo para confirmar?"
                  description="O horário só fica reservado depois de tocar em confirmar."
                >
                  <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                    <div className="rounded-2xl border border-white/10 bg-[#141416] p-5 sm:p-6">
                      <SummaryRow label="Serviço" value={service.name} />
                      <SummaryRow label="Barbeiro" value={barber.name} />
                      <SummaryRow label="Data" value={formatDateLabel(date)} />
                      <SummaryRow label="Horário" value={time} />
                      <SummaryRow label="Duração" value={`${service.duration} min`} />
                      <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-5">
                        <span className="text-xs uppercase tracking-[0.16em] text-[#a7a7aa]">
                          Total
                        </span>
                        <span className="text-2xl font-semibold text-[#e2c16b]">
                          {formatCurrency(selectedPrice)}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 p-5 sm:p-6">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a24a]">
                        Contato
                      </p>
                      <p className="mt-4 font-semibold text-[#f4f0e8]">{clientName.trim()}</p>
                      <p className="mt-1 text-sm text-[#a7a7aa]">{clientPhone}</p>
                      {notes.trim() ? (
                        <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-relaxed text-[#a7a7aa]">
                          {notes.trim()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </ChoiceSection>
              ) : null}
            </>
          )}

          {submitError ? (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-[#b85c54]/40 bg-[#b85c54]/10 px-4 py-3 text-sm text-[#f0b5af]"
            >
              {submitError}
            </div>
          ) : null}

          {!loadingOptions && !optionsError ? (
            <div className="mt-10 flex items-center justify-between gap-3 border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={previous}
                disabled={step === 0 || submitting}
                className="kb-btn kb-btn-outline kb-btn-sm kb-focus disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowLeft size={15} /> Voltar
              </button>
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canContinue || loadingTimes}
                  className="kb-btn kb-btn-gold kb-btn-sm kb-focus disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void confirmBooking()}
                  disabled={submitting || !canContinue}
                  className="kb-btn kb-btn-gold kb-btn-sm kb-focus disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {submitting ? "Confirmando..." : "Confirmar horário"}
                </button>
              )}
            </div>
          ) : null}
        </section>

        <p className="mt-6 text-center text-xs leading-relaxed text-[#737378]">
          Precisa alterar um horário já marcado? Fale diretamente com a King's Barber pelo WhatsApp.
        </p>
      </main>
    </div>
  );
}

function BookingSuccess({
  barber,
  service,
  date,
  time,
  clientName,
  role,
}: {
  barber: EmployeeRecord;
  service: ServiceRecord;
  date: string;
  time: string;
  clientName: string;
  role: AppRole;
}) {
  return (
    <div className="kb-site grid min-h-screen place-items-center bg-[#050505] px-5 py-10 text-[#f4f0e8]">
      <main className="relative z-10 w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0e0e10] p-6 text-center sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#c9a24a]/40 bg-[#c9a24a]/10 text-[#e2c16b]">
          <CheckCircle2 size={32} />
        </div>
        <p className="kb-eyebrow mt-7">Horário confirmado</p>
        <h1 className="kb-editorial mt-3 text-[clamp(2.4rem,7vw,4rem)]">
          Até breve, {firstName(clientName)}.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#a7a7aa]">
          Seu horário está reservado. Guarde os dados abaixo e chegue com alguns minutos de
          antecedência.
        </p>

        <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-white/10 bg-[#141416] p-5 text-left sm:p-6">
          <SummaryRow label="Serviço" value={service.name} />
          <SummaryRow label="Barbeiro" value={barber.name} />
          <SummaryRow label="Data" value={formatDateLabel(date)} />
          <SummaryRow label="Horário" value={time} />
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" hash="inicio" className="kb-btn kb-btn-gold kb-focus">
            {role === "client" ? "Ver meu agendamento" : "Voltar ao início"}
          </Link>
          <Link
            to={role === "client" ? "/agendar" : getRoleHome(role)}
            className="kb-btn kb-btn-outline kb-focus"
          >
            {role === "client" ? "Agendar outro horário" : "Ir para meu painel"}
          </Link>
        </div>
        <p className="mt-6 text-xs text-[#737378]">Este agendamento está vinculado à sua conta.</p>
      </main>
    </div>
  );
}

function ChoiceSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c9a24a]">
        {eyebrow}
      </p>
      <h2 className="kb-editorial mt-2 text-3xl sm:text-4xl">{title}</h2>
      <p className="mb-7 mt-3 text-sm text-[#a7a7aa]">{description}</p>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-5 border-b border-white/8 py-3 first:pt-0 last:border-0 last:pb-0">
      <span className="text-sm text-[#a7a7aa]">{label}</span>
      <span className="text-right text-sm font-semibold text-[#f4f0e8]">{value}</span>
    </div>
  );
}

function LoadingState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-sm text-[#a7a7aa] ${compact ? "min-h-40" : "min-h-[380px]"}`}
    >
      <Loader2 size={18} className="animate-spin text-[#c9a24a]" /> {label}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
      <CalendarDays size={32} className="text-[#c9a24a]" />
      <h2 className="kb-editorial mt-5 text-3xl">Agenda indisponível</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#a7a7aa]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="kb-btn kb-btn-outline kb-btn-sm kb-focus mt-6"
      >
        <RefreshCw size={15} /> Tentar novamente
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center text-sm text-[#a7a7aa]">
      {message}
    </div>
  );
}

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
