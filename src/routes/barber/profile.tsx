import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { barbers, services } from "@/lib/sample-data";
import { Mail, Phone, Award } from "lucide-react";

export const Route = createFileRoute("/barber/profile")({
  head: () => ({ meta: [{ title: "Perfil — Maison Lame" }] }),
  component: () => {
    const me = barbers[0];
    return (
      <AppShell role="barber">
        <PageHeader eyebrow="Seu cartão" title="Perfil" subtitle="Como os clientes te veem." />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-8 text-center">
            <img src={me.image} className="h-32 w-32 rounded-full object-cover mx-auto ring-2 ring-[color:var(--gold)]/50" />
            <div className="font-display text-2xl mt-4">{me.name}</div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold mt-1">{me.title}</div>
            <div className="mt-4 flex items-center justify-center gap-1 text-gold">
              {"★★★★★".split("").map((s,i)=><span key={i}>{s}</span>)}
              <span className="text-muted-foreground ml-2 text-sm">{me.rating}</span>
            </div>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2"><Mail className="h-4 w-4"/> lucas@maisonlame.com.br</div>
              <div className="flex items-center justify-center gap-2"><Phone className="h-4 w-4"/> +55 11 99812-3387</div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="font-display text-lg mb-3">Bio</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Formado pela Académie Maison Lame em 2018. Especialista em cortes clássicos com tesoura, fades esculpidos e rituais de toalha quente. Conhecido pela cadeira tranquila e precisão arquitetônica.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <div className="font-display text-lg mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-gold"/> Especialidades</div>
              <div className="flex flex-wrap gap-2">
                {services.slice(0,4).map((s) => (
                  <span key={s.id} className="rounded-full border border-[color:var(--gold)]/40 px-3 py-1 text-xs text-gold">{s.name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  },
});
