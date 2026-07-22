import { createFileRoute } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Download, Loader2, Scissors, TrendingUp, Users } from "lucide-react";
import { useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageHeader, StatCard } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { AppointmentRecord } from "@/data/repositories/business-repository";
import { useOwnerData } from "@/features/owner/use-owner-data";
import { downloadCsv } from "@/shared/export/csv";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";
import { formatCurrency, formatDateKey, isCompletedStatus } from "@/shared/utils/format";

export const Route = createFileRoute("/owner/reports")({
  head: () => ({ meta: [{ title: "Relatórios — King's Barber" }] }),
  component: OwnerReports,
});

function OwnerReports() {
  const { appointments, loading, error } = useOwnerData();

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  const completed = appointments.filter((appointment) => isCompletedStatus(appointment.status));
  const uniqueClients = new Set(completed.map(clientKey)).size;
  const returningClients = countReturningClients(completed);
  const visitsPerClient = uniqueClients ? completed.length / uniqueClients : 0;
  const retention = uniqueClients ? (returningClients / uniqueClients) * 100 : 0;
  const weekData = buildWeekData(completed);
  const services = rankServices(completed);

  function exportReport() {
    const downloaded = downloadCsv(
      `relatorio-atendimentos-${formatDateKey(new Date())}.csv`,
      appointments.map((appointment) => ({
        data: appointment.appointment_date,
        horario: appointment.time,
        cliente: appointment.client,
        servico: appointment.service,
        barbeiro: appointment.barber,
        status: appointment.status,
        valor: appointment.price,
      })),
    );
    if (downloaded) notifySuccess("Relatório CSV gerado.");
    else notifyError("Não há dados para exportar.");
  }

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Leitura da operação"
        title="Relatórios"
        subtitle="Indicadores calculados a partir dos atendimentos registrados."
        action={
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Clientes atendidos" value={String(uniqueClients)} icon={Users} />
            <StatCard
              label="Clientes recorrentes"
              value={`${retention.toFixed(0)}%`}
              delta="2 ou mais visitas"
              icon={TrendingUp}
            />
            <StatCard
              label="Visitas por cliente"
              value={visitsPerClient.toFixed(1)}
              icon={Calendar}
            />
            <StatCard
              label="Atendimentos concluídos"
              value={String(completed.length)}
              icon={Scissors}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Atendimentos nos últimos 7 dias">
              <BarChart data={weekData}>
                <ChartGrid />
                <XAxis {...axisProps} dataKey="day" />
                <YAxis {...axisProps} />
                <ChartTooltip />
                <Bar
                  dataKey="appointments"
                  name="Atendimentos"
                  fill="var(--gold)"
                  radius={[7, 7, 0, 0]}
                />
              </BarChart>
            </ChartCard>
            <ChartCard title="Faturamento concluído nos últimos 7 dias">
              <LineChart data={weekData}>
                <ChartGrid />
                <XAxis {...axisProps} dataKey="day" />
                <YAxis {...axisProps} />
                <ChartTooltip currency />
                <Line
                  dataKey="revenue"
                  name="Faturamento"
                  stroke="var(--gold)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--gold)", r: 3 }}
                />
              </LineChart>
            </ChartCard>
          </div>

          <section className="glass-card mt-6 rounded-2xl p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="font-display text-xl">Serviços mais realizados</h2>
              <p className="text-xs text-muted-foreground">Somente atendimentos concluídos.</p>
            </div>
            {services.length ? (
              <div className="space-y-3">
                {services.slice(0, 8).map((service, index) => (
                  <div
                    key={service.name}
                    className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-border/60 pb-3 last:border-0"
                  >
                    <span className="font-display text-lg text-gold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${(service.count / services[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{service.count}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(service.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
};
function ChartGrid() {
  return <CartesianGrid stroke="var(--border)" vertical={false} />;
}
function ChartTooltip({ currency = false }: { currency?: boolean }) {
  return (
    <Tooltip
      formatter={(value) => (currency ? formatCurrency(Number(value)) : Number(value))}
      contentStyle={{
        background: "var(--popover)",
        color: "var(--popover-foreground)",
        border: "1px solid var(--border)",
        borderRadius: 12,
      }}
    />
  );
}
function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <section className="glass-card rounded-2xl p-5 sm:p-6">
      <h2 className="mb-5 font-display text-xl">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </section>
  );
}
function Loading() {
  return (
    <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-gold" /> Gerando indicadores
    </div>
  );
}
function Empty() {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      Ainda não há atendimentos concluídos.
    </div>
  );
}
function clientKey(appointment: AppointmentRecord) {
  return appointment.customer_id || appointment.client.trim().toLocaleLowerCase("pt-BR");
}
function countReturningClients(appointments: AppointmentRecord[]) {
  const counts = new Map<string, number>();
  appointments.forEach((item) =>
    counts.set(clientKey(item), (counts.get(clientKey(item)) ?? 0) + 1),
  );
  return [...counts.values()].filter((count) => count >= 2).length;
}
function buildWeekData(appointments: AppointmentRecord[]) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = subDays(new Date(), 6 - index);
    const matching = appointments.filter((item) => item.appointment_date === formatDateKey(date));
    return {
      day: format(date, "EEE", { locale: ptBR }).replace(".", ""),
      appointments: matching.length,
      revenue: matching.reduce((sum, item) => sum + item.price, 0),
    };
  });
}
function rankServices(appointments: AppointmentRecord[]) {
  const map = new Map<string, { name: string; count: number; revenue: number }>();
  appointments.forEach((item) => {
    const current = map.get(item.service) ?? { name: item.service, count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += item.price;
    map.set(item.service, current);
  });
  return [...map.values()].sort((a, b) => b.count - a.count);
}
