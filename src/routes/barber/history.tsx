import { createFileRoute } from "@tanstack/react-router";
import { History, Loader2, Scissors } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader, StatCard } from "@/components/layout/app-shell";
import { useBarberWorkspace } from "@/features/barber/use-barber-workspace";
import { notifyError } from "@/shared/notifications/toast";
import {
  formatCurrency,
  formatShortDate,
  isCancelledStatus,
  isCompletedStatus,
} from "@/shared/utils/format";

export const Route = createFileRoute("/barber/history")({
  head: () => ({ meta: [{ title: "Histórico — King's Barber" }] }),
  component: BarberHistory,
});

type HistoryFilter = "all" | "completed" | "cancelled";

function BarberHistory() {
  const { profile, appointments, loading, error } = useBarberWorkspace();
  const [filter, setFilter] = useState<HistoryFilter>("all");

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  const pastAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => {
          if (filter === "completed") return isCompletedStatus(appointment.status);
          if (filter === "cancelled") return isCancelledStatus(appointment.status);
          return true;
        })
        .sort((a, b) =>
          `${b.appointment_date ?? ""} ${b.time}`.localeCompare(
            `${a.appointment_date ?? ""} ${a.time}`,
          ),
        ),
    [appointments, filter],
  );
  const completed = appointments.filter((appointment) => isCompletedStatus(appointment.status));
  const revenue = completed.reduce((total, appointment) => total + appointment.price, 0);

  return (
    <AppShell role="barber">
      <PageHeader
        eyebrow="Arquivo de trabalho"
        title="Histórico de atendimentos"
        subtitle="Consulte o que passou pela sua cadeira sem perder o contexto."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Concluídos" value={String(completed.length)} icon={Scissors} />
        <StatCard label="Faturamento registrado" value={formatCurrency(revenue)} icon={History} />
        <StatCard
          label="Ticket médio"
          value={formatCurrency(completed.length ? revenue / completed.length : 0)}
          icon={Scissors}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2" aria-label="Filtrar histórico">
        {(
          [
            ["all", "Todos"],
            ["completed", "Concluídos"],
            ["cancelled", "Cancelados"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              filter === value
                ? "border-gold bg-gold text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-gold/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Carregando histórico
        </div>
      ) : !profile ? (
        <EmptyHistory text="Seu usuário ainda não possui um perfil profissional vinculado." />
      ) : pastAppointments.length ? (
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Serviço</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {pastAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatShortDate(appointment.appointment_date)} · {appointment.time}
                    </td>
                    <td className="px-6 py-4 font-medium">{appointment.client}</td>
                    <td className="px-6 py-4">{appointment.service}</td>
                    <td className="px-6 py-4 font-medium text-gold">
                      {formatCurrency(appointment.price)}
                    </td>
                    <td className="px-6 py-4">
                      <Status status={appointment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border md:hidden">
            {pastAppointments.map((appointment) => (
              <article key={appointment.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg">{appointment.client}</h2>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(appointment.appointment_date)} às {appointment.time}
                    </p>
                  </div>
                  <span className="font-display text-gold">
                    {formatCurrency(appointment.price)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{appointment.service}</span>
                  <Status status={appointment.status} />
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <EmptyHistory text="Nenhum atendimento corresponde a este filtro." />
      )}
    </AppShell>
  );
}

function Status({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {status}
    </span>
  );
}

function EmptyHistory({ text }: { text: string }) {
  return (
    <div className="glass-card flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center text-sm text-muted-foreground">
      <History className="h-6 w-6 text-gold" /> {text}
    </div>
  );
}
