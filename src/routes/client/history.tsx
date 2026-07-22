import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { clientHistory, fmtBRL } from "@/lib/sample-data";

export const Route = createFileRoute("/client/history")({
  head: () => ({ meta: [{ title: "Histórico — Maison Lame" }] }),
  component: () => (
    <AppShell role="client">
      <PageHeader eyebrow="Suas visitas" title="Histórico de agendamentos" subtitle="Cada capítulo do seu estilo." />
      <div className="space-y-3">
        {clientHistory.map((h) => (
          <div key={h.id} className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:gold-glow transition">
            <div className="grid h-14 w-14 place-items-center rounded-xl gradient-gold text-primary-foreground font-display text-lg">
              {h.service[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{h.service}</div>
              <div className="text-xs text-muted-foreground">{h.date} · com {h.barber}</div>
            </div>
            <div className="text-gold font-display text-lg">{fmtBRL(h.price)}</div>
            <button className="hidden md:inline-flex rounded-xl border border-[color:var(--gold)]/40 px-3 py-1.5 text-xs text-gold hover:bg-[color:var(--gold)]/10 transition">
              Agendar novamente
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  ),
});
