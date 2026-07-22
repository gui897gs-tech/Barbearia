import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, StatCard } from "@/components/AppShell";
import { revenueWeek, revenueMonth, fmtBRL } from "@/lib/sample-data";
import { DollarSign, Percent, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/barber/revenue")({
  head: () => ({ meta: [{ title: "Faturamento — Maison Lame" }] }),
  component: () => (
    <AppShell role="barber">
      <PageHeader eyebrow="Ganhos" title="Faturamento e comissão" subtitle="Seu ofício, em números." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Este mês" value={fmtBRL(19680)} delta="+22%" icon={DollarSign} />
        <StatCard label="Taxa de comissão" value="30%" icon={Percent} />
        <StatCard label="A receber" value={fmtBRL(5904)} delta="31 de Maio" icon={Wallet} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="font-display text-lg mb-4">Esta semana</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={revenueWeek}>
                <CartesianGrid stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="day" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: 12 }} />
                <Bar dataKey="revenue" fill="#D4A63A" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="font-display text-lg mb-4">Este ano</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={revenueMonth}>
                <CartesianGrid stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="month" stroke="#A0A0A0" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: 12 }} />
                <Bar dataKey="revenue" fill="#D4A63A" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  ),
});
