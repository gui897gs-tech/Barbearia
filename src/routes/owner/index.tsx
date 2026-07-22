import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader, StatCard } from "@/components/AppShell";
import { revenueWeek, revenueMonth, fmtBRL } from "@/lib/sample-data";
import { EmployeeRecord, listAppointments, listEmployees, listProducts, ProductRecord, saveAppointment } from "@/lib/business-data";
import {
  Appointment,
  AppointmentDialog,
} from "@/components/AppointmentDialog";
import { DollarSign, Calendar, Users, TrendingUp, Plus, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/owner/")({
  head: () => ({ meta: [{ title: "Painel do Dono - Maison Lame" }] }),
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const [appointmentList, setAppointmentList] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [productList, setProductList] = useState<ProductRecord[]>([]);
  const [addingAppointment, setAddingAppointment] = useState(false);
  const [revenueRange, setRevenueRange] = useState<"Semana" | "Mes" | "Ano">("Semana");

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    listAppointments(today).then(setAppointmentList);
    listEmployees().then(setEmployees);
    listProducts().then(setProductList);
  }, []);

  async function handleCreate(appointment: Appointment) {
    const saved = await saveAppointment({
      ...appointment,
      appointment_date: new Date().toISOString().slice(0, 10),
    });
    const nextAppointments = [...appointmentList, saved].sort((a, b) => a.time.localeCompare(b.time));
    setAppointmentList(nextAppointments);
    setAddingAppointment(false);
  }

  const chartConfig = getRevenueChartConfig(revenueRange);
  const activeEmployees = employees.filter((employee) => employee.active !== false);
  const topEmployees = [...activeEmployees].sort((a, b) => b.revenue - a.revenue);
  const bestProduct = [...productList].sort((a, b) => b.sold - a.sold)[0];

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Hoje - Quinta, 21 de Maio"
        title="Visao geral da barbearia"
        subtitle="Uma vista calma da casa: agendamentos, faturamento e os talentos no salao."
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
        <StatCard label="Faturamento de hoje" value={fmtBRL(3680)} delta="+12,4% vs ontem" icon={DollarSign} />
        <StatCard label="Agendamentos" value={String(appointmentList.length)} delta="Hoje" icon={Calendar} />
        <StatCard
          label="Barbeiros ativos"
          value={`${activeEmployees.length} / ${employees.length || activeEmployees.length}`}
          delta={activeEmployees.length ? "Equipe sincronizada" : "Nenhum barbeiro cadastrado"}
          icon={Users}
        />
        <StatCard label="Ticket medio" value={fmtBRL(160)} delta="+R$ 12" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Faturamento - {chartConfig.subtitle}</div>
              <div className="font-display text-2xl mt-1">{fmtBRL(chartConfig.total)}</div>
            </div>
            <div className="flex gap-2 text-xs">
              {(["Semana", "Mes", "Ano"] as const).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setRevenueRange(label)}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    revenueRange === label ? "border-[color:var(--gold)] text-gold" : "border-border text-muted-foreground hover:text-foreground"
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
                    <stop offset="0%" stopColor="#D4A63A" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#D4A63A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="label" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => fmtBRL(Number(value))} />
                <Tooltip
                  formatter={(value) => [fmtBRL(Number(value)), "Faturamento"]}
                  labelFormatter={(label) => `${chartConfig.subtitle}: ${label}`}
                  contentStyle={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: 12 }}
                />
                <Area type="monotone" dataKey="faturamento" stroke="#D4A63A" strokeWidth={2} fill="url(#g1)" />
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
                <img src={barber.image} alt={barber.name} className="h-10 w-10 rounded-full object-cover ring-1 ring-[color:var(--gold)]/40" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{barber.name}</div>
                  <div className="text-xs text-muted-foreground">{barber.appts} atendimentos</div>
                </div>
                <div className="text-sm text-gold">{fmtBRL(barber.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-lg">Agendamentos de hoje</div>
            <button type="button" onClick={() => setAddingAppointment(true)} className="text-xs text-gold">
              Novo
            </button>
          </div>
          <div className="divide-y divide-border">
            {appointmentList.slice(0, 6).map((appointment) => (
              <div key={appointment.id} className="py-3 flex items-center gap-4">
                <div className="text-gold font-display text-lg w-16">{appointment.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{appointment.client}</div>
                  <div className="text-xs text-muted-foreground">{appointment.service} - {appointment.barber}</div>
                </div>
                <div className="text-sm">{fmtBRL(appointment.price)}</div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${
                  appointment.status === "Confirmado" ? "border-[color:var(--gold)]/40 text-gold" : "border-border text-muted-foreground"
                }`}>
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
              <BarChart data={revenueMonth.map((item) => ({ ...item, faturamento: item.revenue }))}>
                <CartesianGrid stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="month" stroke="#A0A0A0" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide tickFormatter={(value) => fmtBRL(Number(value))} />
                <Tooltip
                  formatter={(value) => [fmtBRL(Number(value)), "Faturamento"]}
                  contentStyle={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: 12 }}
                />
                <Bar dataKey="faturamento" fill="#D4A63A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">Produto mais vendido</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="font-medium">{bestProduct?.name || "-"}</div>
              <div className="text-gold text-sm">{bestProduct ? `${bestProduct.sold} vendidos` : "-"}</div>
            </div>
          </div>
        </div>
      </div>

      {addingAppointment && (
        <AppointmentDialog
          onClose={() => setAddingAppointment(false)}
          onSave={handleCreate}
        />
      )}
    </AppShell>
  );
}

function getRevenueChartConfig(range: "Semana" | "Mes" | "Ano") {
  if (range === "Mes") {
    const data = Array.from({ length: 5 }, (_, index) => ({
      label: `${index + 1}a sem`,
      faturamento: [8400, 11200, 9800, 12600, 7200][index],
    }));
    return {
      subtitle: "este mes",
      data,
      total: data.reduce((sum, item) => sum + item.faturamento, 0),
    };
  }

  if (range === "Ano") {
    const data = revenueMonth.map((item) => ({ label: item.month, faturamento: item.revenue }));
    return {
      subtitle: "este ano",
      data,
      total: data.reduce((sum, item) => sum + item.faturamento, 0),
    };
  }

  const data = revenueWeek.map((item) => ({ label: item.day, faturamento: item.revenue }));
  return {
    subtitle: "esta semana",
    data,
    total: data.reduce((sum, item) => sum + item.faturamento, 0),
  };
}
