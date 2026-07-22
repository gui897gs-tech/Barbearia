import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, StatCard } from "@/components/AppShell";
import { revenueMonth, employeePerf, fmtBRL } from "@/lib/sample-data";
import { DollarSign, TrendingUp, CreditCard, Wallet } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Pie, PieChart } from "recharts";

export const Route = createFileRoute("/owner/financial")({
  head: () => ({ meta: [{ title: "Financeiro — Maison Lame" }] }),
  component: () => {
    const split = [
      { name: "Serviços", value: 68, color: "#D4A63A" },
      { name: "Produtos", value: 22, color: "#8a6a1f" },
      { name: "Gorjetas", value: 10, color: "#3a2e10" },
    ];
    return (
      <AppShell role="owner">
        <PageHeader eyebrow="Contabilidade" title="Visão financeira" subtitle="Receitas, custos e comissões — tudo em um só lugar." />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Faturamento mensal" value={fmtBRL(57880)} delta="+22%" icon={DollarSign} />
          <StatCard label="Lucro" value={fmtBRL(36420)} delta="63% de margem" icon={TrendingUp} />
          <StatCard label="Cartão" value={fmtBRL(44236)} icon={CreditCard} />
          <StatCard label="Dinheiro" value={fmtBRL(13644)} icon={Wallet} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 lg:col-span-2">
            <div className="font-display text-lg mb-4">Tendência dos últimos 12 meses</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueMonth}>
                  <defs>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4A63A" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#D4A63A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2A2A2A" vertical={false} />
                  <XAxis dataKey="month" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#D4A63A" strokeWidth={2} fill="url(#g2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="font-display text-lg mb-4">Divisão de receita</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={split} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={4}>
                    {split.map((s, i) => <Cell key={i} fill={s.color} stroke="none" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {split.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </div>
                  <span className="text-muted-foreground">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-lg">Comissões deste mês</div>
            <button className="text-xs text-gold">Exportar CSV</button>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3">Barbeiro</th>
                <th className="py-3">Faturamento</th>
                <th className="py-3">Taxa</th>
                <th className="py-3 text-right">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {employeePerf.map((b) => (
                <tr key={b.id} className="border-b border-border/40">
                  <td className="py-4 flex items-center gap-3">
                    <img src={b.image} className="h-9 w-9 rounded-full object-cover ring-1 ring-[color:var(--gold)]/40" />
                    <span className="font-medium">{b.name}</span>
                  </td>
                  <td className="py-4">{fmtBRL(b.revenue)}</td>
                  <td className="py-4 text-muted-foreground">30%</td>
                  <td className="py-4 text-right text-gold">{fmtBRL(b.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppShell>
    );
  },
});
