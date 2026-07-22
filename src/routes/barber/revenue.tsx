import { createFileRoute } from "@tanstack/react-router";
import { endOfMonth, format, isWithinInterval, startOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Loader2, Percent, ReceiptText, Wallet } from "lucide-react";
import { useEffect } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, PageHeader, StatCard } from "@/components/layout/app-shell";
import { AppointmentRecord } from "@/data/repositories/business-repository";
import { useBarberWorkspace } from "@/features/barber/use-barber-workspace";
import { notifyError } from "@/shared/notifications/toast";
import { formatCurrency, formatDateKey, isCompletedStatus } from "@/shared/utils/format";

export const Route = createFileRoute("/barber/revenue")({
  head: () => ({ meta: [{ title: "Faturamento — King's Barber" }] }),
  component: BarberRevenue,
});

function BarberRevenue() {
  const { profile, appointments, loading, error } = useBarberWorkspace();

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  const now = new Date();
  const completed = appointments.filter((appointment) => isCompletedStatus(appointment.status));
  const monthAppointments = completed.filter((appointment) =>
    isAppointmentWithin(appointment, startOfMonth(now), endOfMonth(now)),
  );
  const monthRevenue = sumRevenue(monthAppointments);
  const commissionRate = profile?.commissionRate ?? 30;
  const commission = monthRevenue * (commissionRate / 100);
  const weekData = buildDailyData(completed, 7);
  const yearData = buildMonthlyData(completed, now.getFullYear());

  return (
    <AppShell role="barber">
      <PageHeader
        eyebrow="Produção registrada"
        title="Faturamento e comissão"
        subtitle="Valores calculados somente a partir de atendimentos concluídos."
      />

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Calculando faturamento
        </div>
      ) : profile ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Faturamento do mês"
              value={formatCurrency(monthRevenue)}
              icon={DollarSign}
            />
            <StatCard
              label="Atendimentos concluídos"
              value={String(monthAppointments.length)}
              icon={ReceiptText}
            />
            <StatCard label="Taxa de comissão" value={`${commissionRate}%`} icon={Percent} />
            <StatCard label="Comissão estimada" value={formatCurrency(commission)} icon={Wallet} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <RevenueChart
              title="Últimos sete dias"
              description="Produção diária concluída"
              data={weekData}
              dataKey="label"
            />
            <RevenueChart
              title={`Ano de ${now.getFullYear()}`}
              description="Evolução mensal do faturamento"
              data={yearData}
              dataKey="label"
            />
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            A comissão é uma estimativa sobre os atendimentos concluídos no sistema. Fechamentos,
            descontos e repasses devem ser conciliados pelo proprietário.
          </p>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Seu usuário ainda não está vinculado a um perfil profissional.
        </div>
      )}
    </AppShell>
  );
}

function RevenueChart({
  title,
  description,
  data,
  dataKey,
}: {
  title: string;
  description: string;
  data: Array<{ label: string; revenue: number; appointments: number }>;
  dataKey: string;
}) {
  return (
    <section className="glass-card rounded-2xl p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-xl">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {data.some((item) => item.revenue > 0) ? (
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey={dataKey}
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={52}
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
              <Bar dataKey="revenue" fill="var(--gold)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
          Ainda não há atendimentos concluídos neste período.
        </div>
      )}
    </section>
  );
}

function buildDailyData(appointments: AppointmentRecord[], days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = subDays(new Date(), days - index - 1);
    const key = formatDateKey(date);
    const matching = appointments.filter((appointment) => appointment.appointment_date === key);
    return {
      label: format(date, "EEE", { locale: ptBR }).replace(".", ""),
      revenue: sumRevenue(matching),
      appointments: matching.length,
    };
  });
}

function buildMonthlyData(appointments: AppointmentRecord[], year: number) {
  return Array.from({ length: 12 }, (_, month) => {
    const matching = appointments.filter((appointment) => {
      if (!appointment.appointment_date) return false;
      const date = new Date(`${appointment.appointment_date}T12:00:00`);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    return {
      label: format(new Date(year, month, 1), "MMM", { locale: ptBR }).replace(".", ""),
      revenue: sumRevenue(matching),
      appointments: matching.length,
    };
  });
}

function sumRevenue(appointments: AppointmentRecord[]) {
  return appointments.reduce((total, appointment) => total + appointment.price, 0);
}

function isAppointmentWithin(appointment: AppointmentRecord, start: Date, end: Date) {
  if (!appointment.appointment_date) return false;
  return isWithinInterval(new Date(`${appointment.appointment_date}T12:00:00`), { start, end });
}
