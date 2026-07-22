import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { clientHistory, fmtBRL } from "@/lib/sample-data";

export const Route = createFileRoute("/barber/history")({
  head: () => ({ meta: [{ title: "Histórico — Maison Lame" }] }),
  component: () => (
    <AppShell role="barber">
      <PageHeader eyebrow="Arquivo" title="Histórico de atendimentos" subtitle="Cada cadeira, cada cliente." />
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Serviço</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Faturamento</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...clientHistory, ...clientHistory].map((h, i) => (
              <tr key={i} className="border-b border-border/40 hover:bg-accent/30 transition">
                <td className="px-6 py-4">{h.date}</td>
                <td className="px-6 py-4 text-gold">{h.service}</td>
                <td className="px-6 py-4">Tiago Almeida</td>
                <td className="px-6 py-4">{fmtBRL(h.price)}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-border text-muted-foreground">{h.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  ),
});
