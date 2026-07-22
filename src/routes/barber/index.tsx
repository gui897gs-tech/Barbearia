import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, StatCard } from "@/components/AppShell";
import { appointments, revenueWeek, fmtBRL } from "@/lib/sample-data";
import { DollarSign, Calendar, Star, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/barber/")({
  head: () => ({ meta: [{ title: "Painel do Barbeiro — Maison Lame" }] }),
  component: () => {
    const mine = appointments.filter((a) => a.barber === "Lucas Moreau");
    return (
      <AppShell role="barber">
        <PageHeader eyebrow="Bom dia, Lucas" title="Seu dia na cadeira" subtitle="Foco silencioso. Lâminas afiadas. Agenda cheia." />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Faturamento de hoje" value={fmtBRL(680)} delta="+R$ 90" icon={DollarSign} />
          <StatCard label="Atendimentos" value={`${mine.length}`} delta="2 restantes" icon={Calendar} />
          <StatCard label="Avaliação" value="4,9 ★" delta="142 avaliações" icon={Star} />
          <StatCard label="Comissão (mês)" value={fmtBRL(5904)} delta="+12%" icon={TrendingUp} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 lg:col-span-2">
            <div className="font-display text-lg mb-4">Faturamento semanal</div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={revenueWeek}>
                  <defs>
                    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4A63A" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#D4A63A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2A2A2A" vertical={false} />
                  <XAxis dataKey="day" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: 12 }} />
                  <Area dataKey="revenue" stroke="#D4A63A" strokeWidth={2} fill="url(#bg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="font-display text-lg mb-4">A seguir</div>
            <div className="space-y-4">
              {mine.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-[color:var(--gold)]/40 transition">
                  <div className="text-gold font-display text-lg w-14">{a.time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.client}</div>
                    <div className="text-xs text-muted-foreground">{a.service}</div>
                  </div>
                  <div className="text-sm text-gold">{fmtBRL(a.price)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    );
  },
});
