import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  AppointmentRecord,
  deleteAppointment,
  listAppointments,
  saveAppointment,
} from "@/data/repositories/business-repository";
import { AppointmentDialog } from "@/features/appointments/components/appointment-dialog";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";
import { formatCurrency, formatDateKey, isCancelledStatus } from "@/shared/utils/format";

export const Route = createFileRoute("/owner/appointments")({
  head: () => ({ meta: [{ title: "Agendamentos — King's Barber" }] }),
  component: AppointmentsPage,
});

const statusOptions = [
  "Pendente",
  "Confirmado",
  "Em atendimento",
  "Concluído",
  "Não compareceu",
  "Cancelado",
];

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [addingAppointment, setAddingAppointment] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const dateKey = formatDateKey(selectedDate);
  const brazilianDate = new Intl.DateTimeFormat("pt-BR").format(selectedDate);

  useEffect(() => {
    setLoading(true);
    void listAppointments(dateKey)
      .then(setAppointments)
      .catch(notifyError)
      .finally(() => setLoading(false));
  }, [dateKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return appointments
      .filter((appointment) =>
        query
          ? [appointment.client, appointment.service, appointment.barber].some((value) =>
              value.toLocaleLowerCase("pt-BR").includes(query),
            )
          : true,
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, search]);

  async function handleCreate(appointment: AppointmentRecord) {
    try {
      const saved = await saveAppointment({ ...appointment, appointment_date: dateKey });
      setAppointments((items) => [...items, saved]);
      setAddingAppointment(false);
      notifySuccess("Agendamento criado.");
    } catch (error) {
      notifyError(error);
    }
  }

  async function changeStatus(appointment: AppointmentRecord, status: string) {
    setUpdatingId(appointment.id);
    try {
      const saved = await saveAppointment({ ...appointment, status });
      setAppointments((items) => items.map((item) => (item.id === appointment.id ? saved : item)));
      notifySuccess("Status atualizado.");
    } catch (error) {
      notifyError(error);
    } finally {
      setUpdatingId(null);
    }
  }

  async function remove(appointment: AppointmentRecord) {
    if (!window.confirm(`Excluir o agendamento de ${appointment.client}?`)) return;
    setUpdatingId(appointment.id);
    try {
      await deleteAppointment(appointment.id);
      setAppointments((items) => items.filter((item) => item.id !== appointment.id));
      notifySuccess("Agendamento excluído.");
    } catch (error) {
      notifyError(error);
    } finally {
      setUpdatingId(null);
    }
  }

  function changeDay(offset: number) {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + offset);
      return next;
    });
  }

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Controle de agenda"
        title="Agendamentos"
        subtitle="Todos os horários do dia, incluindo encaixes de meia hora."
        action={
          <Button onClick={() => setAddingAppointment(true)}>
            <Plus className="h-4 w-4" /> Novo agendamento
          </Button>
        }
      />

      <section className="glass-card rounded-2xl p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <Button
              variant="outline"
              size="icon"
              aria-label="Dia anterior"
              onClick={() => changeDay(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <label className="relative min-w-44 cursor-pointer">
              <span className="sr-only">Data da agenda</span>
              <span
                aria-hidden="true"
                className="profile-input flex items-center justify-between gap-4 text-center font-display"
              >
                <span className="flex-1">{brazilianDate}</span>
                <CalendarDays className="h-4 w-4 shrink-0" />
              </span>
              <input
                type="date"
                value={dateKey}
                onChange={(event) => setSelectedDate(new Date(`${event.target.value}T12:00:00`))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            <Button
              variant="outline"
              size="icon"
              aria-label="Próximo dia"
              onClick={() => changeDay(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cliente, serviço ou barbeiro"
              className="profile-input profile-input-with-icon"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-gold" /> Carregando agenda
          </div>
        ) : filtered.length ? (
          <div className="space-y-3">
            {filtered.map((appointment) => (
              <article
                key={appointment.id}
                className="grid gap-4 rounded-xl border border-border bg-background/35 p-4 transition hover:border-gold/35 md:grid-cols-[5rem_1fr_auto] md:items-center"
              >
                <div>
                  <p className="font-display text-2xl text-gold">{appointment.time}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {appointment.duration_minutes ?? 30} min
                  </p>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg">{appointment.client}</h2>
                    {isCancelledStatus(appointment.status) ? (
                      <span className="rounded-full border border-destructive/30 px-2 py-0.5 text-[9px] uppercase text-destructive">
                        Cancelado
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {appointment.service} · {appointment.barber}
                  </p>
                  {appointment.notes ? (
                    <p className="mt-2 text-xs text-muted-foreground">{appointment.notes}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className="mr-2 font-display text-lg">
                    {formatCurrency(appointment.price)}
                  </span>
                  <select
                    aria-label={`Status de ${appointment.client}`}
                    value={appointment.status}
                    disabled={updatingId === appointment.id}
                    onChange={(event) => void changeStatus(appointment, event.target.value)}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
                  >
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir agendamento de ${appointment.client}`}
                    disabled={updatingId === appointment.id}
                    onClick={() => void remove(appointment)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            <CalendarDays className="h-6 w-6 text-gold" />
            {search
              ? "Nenhum agendamento corresponde à busca."
              : "Nenhum horário reservado nesta data."}
          </div>
        )}
      </section>

      {addingAppointment ? (
        <AppointmentDialog onClose={() => setAddingAppointment(false)} onSave={handleCreate} />
      ) : null}
    </AppShell>
  );
}
