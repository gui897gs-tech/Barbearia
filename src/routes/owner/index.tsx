import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader, StatCard } from "@/components/layout/app-shell";
import {
  AppointmentRecord,
  EmployeeRecord,
  listAppointments,
  listEmployees,
  listProducts,
  ProductRecord,
  saveAppointment,
} from "@/data/repositories/business-repository";
import {
  Appointment,
  AppointmentDialog,
} from "@/features/appointments/components/appointment-dialog";
import { DollarSign, Calendar, Users, TrendingUp, Plus, ArrowUpRight } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";
import { formatCurrency, formatDateKey, isCompletedStatus } from "@/shared/utils/format";

export const Route = createFileRoute("/owner/")({
  head: () => ({ meta: [{ title: "Painel do Dono - King's Barber" }] }),
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const [appointmentList, setAppointmentList] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [productList, setProductList] = useState<ProductRecord[]>([]);
  const [addingAppointment, setAddingAppointment] = useState(false);
  const [revenueRange, setRevenueRange] = useState<"Semana" | "Mês" | "Ano">("Semana");

  useEffect(() => {
    void Promise.all([listAppointments(), listEmployees(), listProducts()])
      .then(([appointments, employeeRows, products]) => {
        setAppointmentList(appointments);
        setEmployees(employeeRows);
        setProductList(products);
      })
      .catch(notifyError);
  }, []);

  async function handleCreate(appointment: Appointment) {
    try {
      const saved = await saveAppointment({
        ...appointment,
        appointment_date: new Date().toISOString().slice(0, 10),
      });
      setAppointmentList((items) => [...items, saved].sort((a, b) => a.time.localeCompare(b.time)));
      setAddingAppointment(false);
      notifySuccess("Agendamento criado.");
    } catch (error) {
      notifyError(error);
    }
  }

  const todayKey = formatDateKey(new Date());
  const todayAppointments = appointmentList.filter(
    (appointment) => appointment.appointment_date === todayKey,
  );
  const completedToday = todayAppointments.filter((appointment) =>
    isCompletedStatus(appointment.status),
  );
  const todayRevenue = sumRevenue(completedToday);
  const chartConfig = getRevenueChartConfig(revenueRange, appointmentList);
  const annualChart = getRevenueChartConfig("Ano", appointmentList);
  const activeEmployees = employees.filter((employee) => employee.active !== false);
  const topEmployees = activeEmployees
    .map((employee) => {
      const completed = appointmentList.filter(
        (appointment) =>
          (appointment.barber_id === employee.id || appointment.barber === employee.name) &&
          isCompletedStatus(appointment.status),
      );
      return { ...employee, revenue: sumRevenue(completed), appts: completed.length };
    })
    .sort((a, b) => b.revenue - a.revenue);
  const bestProduct = [...productList].sort((a, b) => b.sold - a.sold)[0];

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow={`Hoje — ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}`}
        title="Visão geral da barbearia"
        subtitle="Uma vista clara da casa: agenda, faturamento e o ritmo da equipe."
        action={
          <button
            type="button"
            onClick={() => setAddingAppointment(true)}
            className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground gold-glow"
          >
            <Plus className="h-4 w-4" /> Novo agendamento
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Faturamento de hoje"
          value={formatCurrency(todayRevenue)}
          delta="Atendimentos concluídos"
          icon={DollarSign}
        />
        <StatCard
          label="Agendamentos"
          value={String(todayAppointments.length)}
          delta="Hoje"
          icon={Calendar}
        />
        <StatCard
          label="Barbeiros ativos"
          value={`${activeEmployees.length} / ${employees.length || activeEmployees.length}`}
          delta={activeEmployees.length ? "Equipe sincronizada" : "Nenhum barbeiro cadastrado"}
          icon={Users}
        />
        <StatCard
          label="Ticket médio"
          value={formatCurrency(completedToday.length ? todayRevenue / completedToday.length : 0)}
          delta={`${completedToday.length} concluídos hoje`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Faturamento - {chartConfig.subtitle}
              </div>
              <div className="font-display text-2xl mt-1">{formatCurrency(chartConfig.total)}</div>
            </div>
            <div className="flex gap-2 text-xs">
              {(["Semana", "Mês", "Ano"] as const).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setRevenueRange(label)}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    revenueRange === label
                      ? "border-[color:var(--gold)] text-gold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartConfig.data}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Faturamento"]}
                  labelFormatter={(label) => `${chartConfig.subtitle}: ${label}`}
                  contentStyle={{
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  stroke="var(--gold)"
                  strokeWidth={2}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-lg">Top barbeiros</div>
            <ArrowUpRight className="h-4 w-4 text-gold" />
          </div>
          <div className="space-y-4">
            {topEmployees.map((barber, index) => (
              <div key={barber.id} className="flex items-center gap-3">
                <span className="text-gold font-display w-5">{index + 1}</span>
                <img
                  src={barber.image}
                  alt={barber.name}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-[color:var(--gold)]/40"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{barber.name}</div>
                  <div className="text-xs text-muted-foreground">{barber.appts} atendimentos</div>
                </div>
                <div className="text-sm text-gold">{formatCurrency(barber.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-lg">Agendamentos de hoje</div>
            <button
              type="button"
              onClick={() => setAddingAppointment(true)}
              className="text-xs text-gold"
            >
              Novo
            </button>
          </div>
          <div className="divide-y divide-border">
            {todayAppointments.slice(0, 6).map((appointment) => (
              <div key={appointment.id} className="py-3 flex items-center gap-4">
                <div className="text-gold font-display text-lg w-16">{appointment.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{appointment.client}</div>
                  <div className="text-xs text-muted-foreground">
                    {appointment.service} - {appointment.barber}
                  </div>
                </div>
                <div className="text-sm">{formatCurrency(appointment.price)}</div>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${
                    appointment.status === "Confirmado"
                      ? "border-[color:var(--gold)]/40 text-gold"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {appointment.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="font-display text-lg mb-4">Faturamento anual</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualChart.data}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide tickFormatter={(value) => formatCurrency(Number(value))} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Faturamento"]}
                  contentStyle={{
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="faturamento" fill="var(--gold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">Produto mais vendido</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="font-medium">{bestProduct?.name || "-"}</div>
              <div className="text-gold text-sm">
                {bestProduct ? `${bestProduct.sold} vendidos` : "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {addingAppointment && (
        <AppointmentDialog onClose={() => setAddingAppointment(false)} onSave={handleCreate} />
      )}
    </AppShell>
  );
}

function getRevenueChartConfig(range: "Semana" | "Mês" | "Ano", appointments: AppointmentRecord[]) {
  const completed = appointments.filter((appointment) => isCompletedStatus(appointment.status));
  const now = new Date();
  if (range === "Mês") {
    const data = Array.from({ length: 5 }, (_, index) => {
      const startDay = index * 7 + 1;
      const endDay = Math.min(
        startDay + 6,
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
      );
      return {
        label: `${startDay}–${endDay}`,
        faturamento: sumRevenue(
          completed.filter((item) => {
            if (!item.appointment_date) return false;
            const date = new Date(`${item.appointment_date}T12:00:00`);
            return (
              date.getFullYear() === now.getFullYear() &&
              date.getMonth() === now.getMonth() &&
              date.getDate() >= startDay &&
              date.getDate() <= endDay
            );
          }),
        ),
      };
    });
    return {
      subtitle: "este mês",
      data,
      total: data.reduce((sum, item) => sum + item.faturamento, 0),
    };
  }

  if (range === "Ano") {
    const labels = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const data = labels.map((label, month) => ({
      label,
      faturamento: sumRevenue(
        completed.filter((item) => {
          if (!item.appointment_date) return false;
          const date = new Date(`${item.appointment_date}T12:00:00`);
          return date.getFullYear() === now.getFullYear() && date.getMonth() === month;
        }),
      ),
    }));
    return {
      subtitle: "este ano",
      data,
      total: data.reduce((sum, item) => sum + item.faturamento, 0),
    };
  }

  const data = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    return {
      label: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      faturamento: sumRevenue(
        completed.filter((item) => item.appointment_date === formatDateKey(date)),
      ),
    };
  });
  return {
    subtitle: "esta semana",
    data,
    total: data.reduce((sum, item) => sum + item.faturamento, 0),
  };
}

function sumRevenue(appointments: AppointmentRecord[]) {
  return appointments.reduce((sum, appointment) => sum + appointment.price, 0);
}
