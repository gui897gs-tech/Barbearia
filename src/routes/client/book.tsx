import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Clock, Loader2, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { formatCurrency } from "@/shared/utils/format";
import {
  bookClientAppointment,
  EmployeeRecord,
  getAvailableSlots,
  listEmployees,
  listServices,
  ServiceRecord,
} from "@/data/repositories/business-repository";
import { useAuth } from "@/features/auth/auth-context";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";

export const Route = createFileRoute("/client/book")({
  head: () => ({ meta: [{ title: "Agendar — King's Barber" }] }),
  component: BookFlow,
});

const steps = ["Barbeiro", "Serviço", "Data", "Horário", "Confirmar"];

function BookFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const bookingDates = useMemo(
    () => Array.from({ length: 14 }, (_, index) => addDays(new Date(), index)),
    [],
  );
  const [step, setStep] = useState(0);
  const [barbers, setBarbers] = useState<EmployeeRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [barber, setBarber] = useState<EmployeeRecord | null>(null);
  const [service, setService] = useState<ServiceRecord | null>(null);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    void Promise.all([listEmployees(), listServices()])
      .then(([employeeRows, serviceRows]) => {
        if (!active) return;
        const activeBarbers = employeeRows.filter((employee) => employee.active !== false);
        const activeServices = serviceRows.filter((item) => item.active !== false);
        setBarbers(activeBarbers);
        setServices(activeServices);
        setBarber(activeBarbers[0] ?? null);
        setService(activeServices[0] ?? null);
      })
      .catch(notifyError)
      .finally(() => {
        if (active) setLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!barber || !service || !date) return;
    let active = true;
    setLoadingTimes(true);
    setTime("");

    void getAvailableSlots({ barberId: barber.id, serviceId: service.id, date })
      .then((availableSlots) => {
        if (!active) return;
        setTimes(availableSlots);
        setTime(availableSlots[0] ?? "");
      })
      .catch((error) => {
        if (!active) return;
        setTimes([]);
        notifyError(error);
      })
      .finally(() => {
        if (active) setLoadingTimes(false);
      });

    return () => {
      active = false;
    };
  }, [barber, date, service]);

  const canContinue =
    (step === 0 && Boolean(barber)) ||
    (step === 1 && Boolean(service)) ||
    (step === 2 && Boolean(date)) ||
    (step === 3 && Boolean(time)) ||
    step === 4;

  const next = () => {
    if (canContinue) setStep((current) => Math.min(current + 1, 4));
  };
  const prev = () => setStep((current) => Math.max(current - 1, 0));

  async function handleConfirm() {
    if (!barber || !service || !time || !user) return;
    setSubmitting(true);
    try {
      await bookClientAppointment({
        barber,
        service,
        date,
        time,
        customerId: user.id,
        clientName: String(user.user_metadata?.full_name || user.email || "Cliente"),
      });
      notifySuccess("Agendamento confirmado.");
      navigate({ to: "/client/history" });
    } catch (error) {
      notifyError(error);
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role="client">
      <PageHeader
        eyebrow="Reservar"
        title="Agende seu horário"
        subtitle="Escolha o profissional, o serviço e um horário realmente disponível."
      />

      <div className="glass-card mb-6 rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-none">
          {steps.map((label, index) => (
            <div key={label} className="flex shrink-0 items-center gap-3">
              <div
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-medium transition ${
                  index < step
                    ? "bg-gold text-primary-foreground"
                    : index === step
                      ? "ring-1 ring-[color:var(--gold)] text-gold"
                      : "border border-border text-muted-foreground"
                }`}
                aria-current={index === step ? "step" : undefined}
              >
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div
                className={`text-sm font-medium ${index === step ? "text-foreground" : "text-muted-foreground"}`}
              >
                {label}
              </div>
              {index < steps.length - 1 && (
                <div className="mx-2 hidden h-px w-12 bg-border md:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card min-h-[420px] rounded-3xl p-6 md:p-10">
        {loadingOptions ? (
          <LoadingState label="Carregando profissionais e serviços" />
        ) : (
          <>
            {step === 0 && (
              <section>
                <h2 className="mb-6 font-display text-2xl">Escolha seu barbeiro</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {barbers.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setBarber(item)}
                      aria-pressed={barber?.id === item.id}
                      className={`rounded-2xl border p-5 text-left transition ${
                        barber?.id === item.id
                          ? "border-[color:var(--gold)] ring-1 ring-[color:var(--gold)] gold-glow"
                          : "border-border hover:border-[color:var(--gold)]/40"
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={`Foto de ${item.name}`}
                        className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-[color:var(--gold)]/30"
                      />
                      <div className="mt-3 text-center font-display text-lg">{item.name}</div>
                      <div className="text-center text-xs text-muted-foreground">{item.title}</div>
                      <div className="mt-2 flex items-center justify-center gap-1 text-sm text-gold">
                        <Star className="h-3.5 w-3.5 fill-current" /> {item.rating}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {step === 1 && (
              <section>
                <h2 className="mb-6 font-display text-2xl">Selecione um serviço</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setService(item)}
                      aria-pressed={service?.id === item.id}
                      className={`rounded-2xl border p-5 text-left transition ${
                        service?.id === item.id
                          ? "border-[color:var(--gold)] gold-glow"
                          : "border-border hover:border-[color:var(--gold)]/40"
                      }`}
                    >
                      <div className="text-[11px] uppercase tracking-[0.2em] text-gold">
                        {item.category}
                      </div>
                      <div className="mt-2 font-display text-lg">{item.name}</div>
                      <div className="mt-4 flex items-end justify-between">
                        <div className="font-display text-2xl text-gradient-gold">
                          {formatCurrency(item.price)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {item.duration} min
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {step === 2 && (
              <section>
                <h2 className="mb-6 font-display text-2xl">Escolha uma data</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {bookingDates.map((day) => {
                    const value = format(day, "yyyy-MM-dd");
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setDate(value)}
                        aria-pressed={date === value}
                        className={`rounded-2xl border px-3 py-4 text-center transition ${
                          date === value
                            ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-gold gold-glow"
                            : "border-border hover:border-[color:var(--gold)]/40"
                        }`}
                      >
                        <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {format(day, "EEE", { locale: ptBR })}
                        </span>
                        <span className="mt-1 block font-display text-2xl">
                          {format(day, "dd")}
                        </span>
                        <span className="block text-xs">
                          {format(day, "MMM", { locale: ptBR })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {step === 3 && (
              <section>
                <h2 className="mb-2 font-display text-2xl">Escolha um horário</h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Horários atualizados para {barber?.name} em {formatDateLabel(date)}.
                </p>
                {loadingTimes ? (
                  <LoadingState label="Consultando a agenda" />
                ) : times.length ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {times.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setTime(slot)}
                        aria-pressed={time === slot}
                        className={`rounded-xl border py-3 text-sm font-medium transition ${
                          time === slot
                            ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-gold gold-glow"
                            : "border-border hover:border-[color:var(--gold)]/40"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Não há horários disponíveis nesta data. Volte e escolha outro dia.
                  </div>
                )}
              </section>
            )}

            {step === 4 && barber && service && (
              <section>
                <h2 className="mb-6 font-display text-2xl">Confirme seu agendamento</h2>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4 rounded-2xl border border-border p-6">
                    {[
                      ["Barbeiro", barber.name],
                      ["Serviço", service.name],
                      ["Data", formatDateLabel(date)],
                      ["Horário", time],
                      ["Duração", `${service.duration} min`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-right font-medium">{value}</span>
                      </div>
                    ))}
                    <div className="flex items-end justify-between border-t border-border pt-4">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-display text-3xl text-gradient-gold">
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 p-6">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-gold">
                      Antes de confirmar
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      O horário só é reservado ao confirmar. Se outra pessoa o escolher antes, a
                      agenda solicitará uma nova opção.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        <div className="mt-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0 || submitting}
            className="rounded-xl border border-border px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-30"
          >
            Voltar
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canContinue || loadingOptions || (step === 3 && loadingTimes)}
              className="rounded-xl gradient-gold px-6 py-2.5 text-sm font-medium text-primary-foreground gold-glow disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !time}
              className="inline-flex items-center gap-2 rounded-xl gradient-gold px-6 py-2.5 text-sm font-medium text-primary-foreground gold-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Confirmando..." : "Confirmar agendamento"}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-gold" />
      {label}
    </div>
  );
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return format(new Date(year, month - 1, day), "EEEE, dd 'de' MMMM", { locale: ptBR });
}
