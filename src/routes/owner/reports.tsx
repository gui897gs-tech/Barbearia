import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, StatCard } from "@/components/AppShell";
import { revenueWeek } from "@/lib/sample-data";
import { Download, TrendingUp, Users, Calendar } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/owner/reports")({
  head: () => ({ meta: [{ title: "Relatórios — Maison Lame" }] }),
  component: () => (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Insights"
        title="Relatórios"
        subtitle="Números silenciosos, verdades claras."
        action={
          <button className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:border-[color:var(--gold)]/60 transition">
            <Download className="h-4 w-4" /> Exportar
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Retenção de clientes" value="74%" delta="+6%" icon={Users} />
        <StatCard label="Visitas / cliente" value="2,4 / mês" delta="+0,3" icon={Calendar} />
        <StatCard label="Crescimento (YoY)" value="+34%" delta="Em alta" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="font-display text-lg mb-4">Atendimentos por dia</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={revenueWeek}>
                <CartesianGrid stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="day" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: 12 }} />
                <Bar dataKey="appts" fill="#D4A63A" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="font-display text-lg mb-4">Tendência de faturamento</div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={revenueWeek}>
                <CartesianGrid stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="day" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: 12 }} />
                <Line dataKey="revenue" stroke="#D4A63A" strokeWidth={2.5} dot={{ fill: "#D4A63A", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  ),
});
