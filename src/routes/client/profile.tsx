import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { barbers } from "@/lib/sample-data";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/client/profile")({
  head: () => ({ meta: [{ title: "Perfil — Maison Lame" }] }),
  component: () => (
    <AppShell role="client">
      <PageHeader eyebrow="Sua conta" title="Perfil" subtitle="Seus dados e preferências." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="h-28 w-28 rounded-full gradient-gold grid place-items-center text-primary-foreground font-display text-4xl mx-auto">TA</div>
          <div className="font-display text-2xl mt-4">Tiago Almeida</div>
          <div className="text-sm text-muted-foreground">Membro desde 2024</div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/40 px-3 py-1 text-xs text-gold">
            <Heart className="h-3 w-3 fill-current"/> Membro Ouro
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="font-display text-lg mb-4">Dados pessoais</div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["Nome completo", "Tiago Almeida"],
                ["E-mail", "tiago@almeida.com.br"],
                ["Telefone", "+55 11 98412-2217"],
                ["Aniversário", "14 de Março, 1989"],
              ].map(([l, v]) => (
                <div key={l}>
                  <label className="text-xs text-muted-foreground">{l}</label>
                  <input defaultValue={v} className="mt-1 w-full rounded-xl bg-card border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-[color:var(--gold)] transition" />
                </div>
              ))}
            </div>
            <button className="mt-6 rounded-xl gradient-gold px-5 py-2.5 text-sm font-medium text-primary-foreground">Salvar</button>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="font-display text-lg mb-4">Barbeiro favorito</div>
            <div className="flex items-center gap-4">
              <img src={barbers[0].image} className="h-14 w-14 rounded-full object-cover ring-2 ring-[color:var(--gold)]/40" />
              <div className="flex-1">
                <div className="font-medium">{barbers[0].name}</div>
                <div className="text-xs text-muted-foreground">{barbers[0].title}</div>
              </div>
              <button className="text-xs text-gold">Alterar</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  ),
});
