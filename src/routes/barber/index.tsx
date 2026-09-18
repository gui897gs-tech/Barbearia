import { createFileRoute } from "@tanstack/react-router";
import { Calendar, DollarSign, Loader2, Star, TrendingUp } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageHeader, StatCard } from "@/components/layout/app-shell";
import { useBarberWorkspace } from "@/features/barber/use-barber-workspace";
import { notifyError } from "@/shared/notifications/toast";
import { formatCurrency, formatDateKey, isCompletedStatus } from "@/shared/utils/format";

export const Route = createFileRoute("/barber/")({
  head: () => ({ meta: [{ title: "Painel do Barbeiro — King's Barber" }] }),
  component: BarberDashboard,
});

function BarberDashboard() {
  const { profile, appointments, loading, error } = useBarberWorkspace();

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  const todayKey = formatDateKey(new Date());
  const todayAppointments = appointments
    .filter((appointment) => appointment.appointment_date === todayKey)
    .sort((a, b) => a.time.localeCompare(b.time));
  const todayRevenue = todayAppointments
    .filter((appointment) => isCompletedStatus(appointment.status))
    .reduce((sum, appointment) => sum + appointment.price, 0);
  const upcoming = todayAppointments.filter(
    (appointment) => appointment.status === "Confirmado" && appointment.time >= currentTimeKey(),
  );
  const weekData = useMemo(() => buildWeekData(appointments), [appointments]);

  return (
    <AppShell role="barber">
      <PageHeader
        eyebrow={profile ? `Olá, ${profile.name.split(" ")[0]}` : "Seu workspace"}
        title="Seu dia na cadeira"
        subtitle="Agenda, atendimentos e desempenho reunidos em um só lugar."
      />

      {loading ? (
        <LoadingState />
      ) : profile ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Faturamento de hoje"
              value={formatCurrency(todayRevenue)}
              icon={DollarSign}
            />
            <StatCard
              label="Atendimentos hoje"
              value={String(todayAppointments.length)}
              delta={`${upcoming.length} a seguir`}
              icon={Calendar}
            />
            <StatCard label="Avaliação" value={`${profile.rating} ★`} icon={Star} />
            <StatCard
              label="Valor fixo mensal"
              value={formatCurrency(profile.fixedFee ?? 0)}
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="glass-card rounded-2xl p-5 sm:p-6 lg:col-span-2">
              <h2 className="mb-4 font-display text-xl">Últimos sete dias</h2>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={weekData}>
                    <defs>
                      <linearGradient id="barber-revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.38} />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        background: "var(--popover)",
                        color: "var(--popover-foreground)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                      }}
                    />
                    <Area
                      dataKey="revenue"
                      stroke="var(--gold)"
                      strokeWidth={2}
                      fill="url(#barber-revenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="glass-card rounded-2xl p-5 sm:p-6">
              <h2 className="mb-4 font-display text-xl">A seguir</h2>
              {upcoming.length ? (
                <div className="space-y-3">
                  {upcoming.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <div className="w-12 font-display text-lg text-gold">{appointment.time}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{appointment.client}</div>
                        <div className="text-xs text-muted-foreground">{appointment.service}</div>
                      </div>
                      <div className="text-sm text-gold">{formatCurrency(appointment.price)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhum atendimento restante hoje.
                </p>
              )}
            </section>
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Seu usuário ainda não está vinculado a um perfil de barbeiro. Solicite o vínculo ao
          proprietário.
        </div>
      )}
    </AppShell>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-gold" /> Carregando seu painel
    </div>
  );
}

function buildWeekData(appointments: ReturnType<typeof useBarberWorkspace>["appointments"]) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = formatDateKey(date);
    return {
      day: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      revenue: appointments
        .filter(
          (appointment) =>
            appointment.appointment_date === key && isCompletedStatus(appointment.status),
        )
        .reduce((sum, appointment) => sum + appointment.price, 0),
    };
  });
}

function currentTimeKey() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
