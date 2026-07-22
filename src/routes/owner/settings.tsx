import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/owner/settings")({
  head: () => ({ meta: [{ title: "Configurações — Maison Lame" }] }),
  component: () => (
    <AppShell role="owner">
      <PageHeader eyebrow="Barbearia" title="Configurações" subtitle="Preferências da casa, agenda e marca." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="font-display text-lg mb-4">Dados da barbearia</div>
          <div className="space-y-4">
            {[
              ["Nome da barbearia", "King's Barber"],
              ["Endereço", "Rua Oscar Freire, 1234 — São Paulo"],
              ["Telefone", "+55 11 4002-8922"],
              ["E-mail", "concierge@maisonlame.com.br"],
            ].map(([l, v]) => (
              <div key={l}>
                <label className="text-xs text-muted-foreground">{l}</label>
                <input defaultValue={v} className="mt-1 w-full rounded-xl bg-card border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-[color:var(--gold)] transition" />
              </div>
            ))}
            <button className="rounded-xl gradient-gold px-5 py-2.5 text-sm font-medium text-primary-foreground gold-glow">Salvar alterações</button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="font-display text-lg mb-3">Horário de funcionamento</div>
            <div className="space-y-2 text-sm">
              {["Seg-Sex","Sábado","Domingo"].map((d, i) => (
                <div key={d} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{d}</span>
                  <span className="text-gold">{i === 2 ? "Fechado" : "09:00 — 19:00"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="font-display text-lg mb-3">Plano</div>
            <div className="text-xs uppercase tracking-wider text-gold">Atelier</div>
            <div className="font-display text-2xl mt-1">R$ 249 / mês</div>
            <p className="text-xs text-muted-foreground mt-2">Barbeiros ilimitados, analytics premium, suporte concierge.</p>
            <button className="mt-4 w-full rounded-xl border border-[color:var(--gold)]/50 py-2 text-xs text-gold hover:bg-[color:var(--gold)]/10 transition">Gerenciar assinatura</button>
          </div>
        </div>
      </div>
    </AppShell>
  ),
});
