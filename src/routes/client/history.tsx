import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarX2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { formatCurrency } from "@/shared/utils/format";
import {
  AppointmentRecord,
  cancelClientAppointment,
  listClientAppointments,
} from "@/data/repositories/business-repository";
import { useAuth } from "@/features/auth/auth-context";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";

export const Route = createFileRoute("/client/history")({
  head: () => ({ meta: [{ title: "Histórico — King's Barber" }] }),
  component: ClientHistoryPage,
});

function ClientHistoryPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    void listClientAppointments(user.id)
      .then((items) => {
        if (active) setAppointments(items);
      })
      .catch(notifyError)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  async function handleCancel(appointment: AppointmentRecord) {
    if (!user) return;
    setCancelingId(appointment.id);
    try {
      await cancelClientAppointment(appointment.id, user.id);
      setAppointments((items) =>
        items.map((item) =>
          item.id === appointment.id ? { ...item, status: "Cancelado pelo cliente" } : item,
        ),
      );
      notifySuccess("Agendamento cancelado.");
    } catch (error) {
      notifyError(error);
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <AppShell role="client">
      <PageHeader
        eyebrow="Suas visitas"
        title="Histórico de agendamentos"
        subtitle="Acompanhe seus próximos horários e atendimentos anteriores."
        action={
          <Link
            to="/client/book"
            className="rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground gold-glow"
          >
            Novo agendamento
          </Link>
        }
      />

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Carregando seu histórico
        </div>
      ) : appointments.length ? (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const future = isFutureAppointment(appointment);
            const cancelable = future && appointment.status === "Confirmado";
            return (
              <article
                key={appointment.id}
                className="glass-card flex flex-col gap-4 rounded-2xl p-5 transition hover:gold-glow md:flex-row md:items-center"
              >
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl gradient-gold font-display text-lg text-primary-foreground">
                  {appointment.service[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium">{appointment.service}</h2>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatAppointmentDate(appointment)} · com {appointment.barber}
                  </p>
                </div>
                <div className="font-display text-lg text-gold">
                  {formatCurrency(appointment.price)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/client/book"
                    className="rounded-xl border border-[color:var(--gold)]/40 px-3 py-2 text-xs text-gold transition hover:bg-[color:var(--gold)]/10"
                  >
                    Agendar novamente
                  </Link>
                  {cancelable && (
                    <button
                      type="button"
                      onClick={() => handleCancel(appointment)}
                      disabled={cancelingId === appointment.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 px-3 py-2 text-xs text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                    >
                      {cancelingId === appointment.id && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Cancelar
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="glass-card flex min-h-64 flex-col items-center justify-center rounded-3xl p-8 text-center">
          <CalendarX2 className="h-8 w-8 text-gold" />
          <h2 className="mt-4 font-display text-2xl">Nenhum agendamento ainda</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Assim que você reservar um horário, todos os detalhes aparecerão aqui.
          </p>
          <Link
            to="/client/book"
            className="mt-6 rounded-xl gradient-gold px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Escolher um horário
          </Link>
        </div>
      )}
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const canceled = status.startsWith("Cancelado");
  const completed = status === "Concluído" || status === "Concluido";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        canceled
          ? "bg-destructive/10 text-destructive"
          : completed
            ? "bg-emerald-500/10 text-emerald-500"
            : "bg-[color:var(--gold)]/10 text-gold"
      }`}
    >
      {status}
    </span>
  );
}

function appointmentDate(appointment: AppointmentRecord) {
  if (appointment.starts_at) return new Date(appointment.starts_at);
  const [year, month, day] = (appointment.appointment_date ?? "").split("-").map(Number);
  const [hours, minutes] = appointment.time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function isFutureAppointment(appointment: AppointmentRecord) {
  return appointmentDate(appointment).getTime() > Date.now();
}

function formatAppointmentDate(appointment: AppointmentRecord) {
  const value = appointmentDate(appointment);
  if (Number.isNaN(value.getTime()))
    return `${appointment.appointment_date ?? "Data pendente"} · ${appointment.time}`;
  return format(value, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
}
