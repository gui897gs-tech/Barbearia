import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { barbers, services, clientHistory, fmtBRL } from "@/lib/sample-data";
import { Calendar, Heart, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/client/")({
  head: () => ({ meta: [{ title: "Maison Lame — Agende seu ritual" }] }),
  component: () => (
    <AppShell role="client">
      <PageHeader
        eyebrow="Bem-vindo, Tiago"
        title="A cadeira espera por você."
        subtitle="Agende seu próximo ritual na Maison Lame."
        action={
          <Link to="/client/book" className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground gold-glow">
            <Sparkles className="h-4 w-4" /> Agendar agora
          </Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(500px 300px at 80% 20%, rgba(212,166,58,0.25), transparent 60%)" }} />
          <div className="relative">
            <div className="text-[11px] uppercase tracking-[0.25em] text-gold">Próximo agendamento</div>
            <div className="font-display text-3xl mt-2">Corte Signature com Lucas</div>
            <div className="text-muted-foreground mt-1">Sexta, 22 de Maio · 14:00</div>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button className="rounded-xl gradient-gold px-4 py-2 text-sm font-medium text-primary-foreground">Reagendar</button>
              <button className="rounded-xl border border-border px-4 py-2 text-sm hover:border-[color:var(--gold)]/50 transition">Cancelar</button>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold"><Heart className="h-3.5 w-3.5"/> Barbeiro favorito</div>
          <img src={barbers[0].image} className="h-24 w-24 rounded-full object-cover ring-2 ring-[color:var(--gold)]/50 mx-auto mt-6" />
          <div className="text-center font-display text-xl mt-3">{barbers[0].name}</div>
          <div className="text-center text-xs text-muted-foreground">{barbers[0].title}</div>
          <Link to="/client/book" className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[color:var(--gold)]/40 py-2 text-xs text-gold hover:bg-[color:var(--gold)]/10 transition">
            Agendar com Lucas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-xl">Rituais populares</div>
          <Link to="/client/book" className="text-xs text-gold">Ver todos</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.slice(0,4).map((s) => (
            <Link to="/client/book" key={s.id} className="glass-card rounded-2xl p-5 hover:gold-glow transition group">
              <div className="text-[11px] uppercase tracking-[0.2em] text-gold">{s.category}</div>
              <div className="font-display text-lg mt-2">{s.name}</div>
              <div className="mt-4 flex items-end justify-between">
                <div className="text-2xl font-display text-gradient-gold">{fmtBRL(s.price)}</div>
                <div className="text-xs text-muted-foreground">{s.duration} min</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="font-display text-lg mb-4 flex items-center gap-2"><Calendar className="h-4 w-4 text-gold"/> Visitas recentes</div>
          <div className="divide-y divide-border">
            {clientHistory.slice(0,3).map((h) => (
              <div key={h.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{h.service}</div>
                  <div className="text-xs text-muted-foreground">{h.date} · {h.barber}</div>
                </div>
                <div className="text-sm text-gold">{fmtBRL(h.price)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="text-[11px] uppercase tracking-[0.25em] text-gold">Fidelidade Maison</div>
          <div className="font-display text-2xl mt-2">3 visitas para o próximo ritual</div>
          <div className="mt-4 h-2 rounded-full bg-accent overflow-hidden">
            <div className="h-full gradient-gold" style={{ width: "70%" }} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">7 de 10 selos conquistados</div>
        </div>
      </div>
    </AppShell>
  ),
});
