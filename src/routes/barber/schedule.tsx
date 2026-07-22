import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Play,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  AppointmentRecord,
  BarberAppointmentStatus,
  updateBarberAppointmentStatus,
} from "@/data/repositories/business-repository";
import { useBarberWorkspace } from "@/features/barber/use-barber-workspace";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";
import { formatCurrency, formatDateKey, isCancelledStatus } from "@/shared/utils/format";

export const Route = createFileRoute("/barber/schedule")({
  head: () => ({ meta: [{ title: "Agenda — King's Barber" }] }),
  component: BarberSchedule,
});

function BarberSchedule() {
  const { profile, appointments, loading, error, refetchAppointments } = useBarberWorkspace();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  const selectedKey = formatDateKey(selectedDate);
  const selectedAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.appointment_date === selectedKey)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, selectedKey],
  );
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const week = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  async function changeStatus(appointmentId: string, status: BarberAppointmentStatus) {
    setUpdatingId(appointmentId);
    try {
      await updateBarberAppointmentStatus(appointmentId, status);
      await refetchAppointments();
      notifySuccess("Atendimento atualizado.");
    } catch (caughtError) {
      notifyError(caughtError);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AppShell role="barber">
      <PageHeader
        eyebrow="Ritmo da cadeira"
        title="Sua agenda"
        subtitle="Acompanhe o dia e registre o andamento de cada atendimento."
      />

      <section className="glass-card mb-6 rounded-2xl p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Semana anterior"
            onClick={() => setSelectedDate((date) => addDays(date, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="font-display text-lg capitalize">
              {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <button
              className="text-xs font-semibold uppercase tracking-[0.16em] text-gold hover:underline"
              onClick={() => setSelectedDate(new Date())}
            >
              Voltar para hoje
            </button>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Próxima semana"
            onClick={() => setSelectedDate((date) => addDays(date, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {week.map((day) => {
            const active = isSameDay(day, selectedDate);
            const count = appointments.filter(
              (appointment) => appointment.appointment_date === formatDateKey(day),
            ).length;
            return (
              <button
                key={day.toISOString()}
                aria-pressed={active}
                onClick={() => setSelectedDate(day)}
                className={`rounded-xl border px-1 py-3 text-center transition sm:px-3 ${
                  active
                    ? "border-gold bg-gold text-primary-foreground shadow-[0_10px_30px_-16px_var(--gold)]"
                    : "border-border bg-background/40 hover:border-gold/50"
                }`}
              >
                <span className="block text-[9px] font-bold uppercase tracking-wider sm:text-[10px]">
                  {format(day, "EEE", { locale: ptBR }).replace(".", "")}
                </span>
                <span className="mt-1 block font-display text-xl">{format(day, "dd")}</span>
                <span className="mt-1 block text-[9px] opacity-70">{count || "—"}</span>
              </button>
            );
          })}
        </div>
      </section>

      {loading ? (
        <LoadingState />
      ) : !profile ? (
        <EmptyState text="Seu usuário ainda não está vinculado a um perfil profissional." />
      ) : selectedAppointments.length ? (
        <div className="relative space-y-3 before:absolute before:bottom-6 before:left-[2.15rem] before:top-6 before:w-px before:bg-border sm:before:left-[2.65rem]">
          {selectedAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              updating={updatingId === appointment.id}
              onChangeStatus={changeStatus}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          text={`Nenhum atendimento em ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}.`}
        />
      )}
    </AppShell>
  );
}

function AppointmentCard({
  appointment,
  updating,
  onChangeStatus,
}: {
  appointment: AppointmentRecord;
  updating: boolean;
  onChangeStatus: (id: string, status: BarberAppointmentStatus) => Promise<void>;
}) {
  const cancelled = isCancelledStatus(appointment.status);

  return (
    <article className="glass-card relative grid gap-4 rounded-2xl p-4 pl-20 sm:grid-cols-[1fr_auto] sm:p-5 sm:pl-24">
      <div className="absolute left-3 top-5 z-10 flex w-14 flex-col items-center rounded-xl border border-gold/35 bg-background px-2 py-2 sm:left-4 sm:w-16">
        <Clock3 className="mb-1 h-3.5 w-3.5 text-gold" />
        <span className="font-display text-lg">{appointment.time}</span>
      </div>
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h2 className="truncate font-display text-xl">{appointment.client}</h2>
          <StatusBadge status={appointment.status} />
        </div>
        <p className="text-sm text-muted-foreground">{appointment.service}</p>
        {appointment.notes ? (
          <p className="mt-2 border-l border-gold/40 pl-3 text-xs text-muted-foreground">
            {appointment.notes}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-start gap-3 sm:items-end">
        <span className="font-display text-lg text-gold">{formatCurrency(appointment.price)}</span>
        {!cancelled && appointment.status !== "Concluído" ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {appointment.status !== "Em atendimento" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={updating}
                onClick={() => onChangeStatus(appointment.id, "Em atendimento")}
              >
                {updating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Iniciar
              </Button>
            ) : null}
            <Button
              size="sm"
              disabled={updating}
              onClick={() => onChangeStatus(appointment.id, "Concluído")}
            >
              {updating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Concluir
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {status}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-gold" /> Carregando agenda
    </div>
  );
}

function EmptyState({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="glass-card flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center text-sm text-muted-foreground">
      <div className="text-gold">{icon ?? <CalendarDays className="h-6 w-6" />}</div>
      {text}
    </div>
  );
}
