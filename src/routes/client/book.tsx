import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { barbers, services, fmtBRL } from "@/lib/sample-data";
import { Check, Clock, Star } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/client/book")({
  head: () => ({ meta: [{ title: "Agendar — Maison Lame" }] }),
  component: BookFlow,
});

const steps = ["Barbeiro", "Serviço", "Data", "Horário", "Confirmar"];

function BookFlow() {
  const [step, setStep] = useState(0);
  const [barber, setBarber] = useState(barbers[0]);
  const [service, setService] = useState(services[0]);
  const [date, setDate] = useState(22);
  const [time, setTime] = useState("14:00");

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const days = Array.from({ length: 14 }, (_, i) => 21 + i);
  const times = ["09:00","10:00","11:00","12:00","14:00","15:00","16:00","17:00","18:00"];

  return (
    <AppShell role="client">
      <PageHeader eyebrow="Reservar" title="Agende seu ritual" subtitle="Cinco passos. Uma obra-prima." />

      <div className="glass-card rounded-2xl p-4 md:p-6 mb-6">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-none">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3 shrink-0">
              <div className={`grid h-9 w-9 place-items-center rounded-full text-sm font-medium transition ${
                i < step ? "bg-gold text-primary-foreground" :
                i === step ? "ring-1 ring-[color:var(--gold)] text-gold" :
                "border border-border text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className={`text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</div>
              {i < steps.length - 1 && <div className="hidden md:block w-12 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 md:p-10 min-h-[420px]">
        {step === 0 && (
          <div>
            <div className="font-display text-2xl mb-6">Escolha seu barbeiro</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {barbers.map((b) => (
                <button key={b.id} onClick={() => setBarber(b)} className={`rounded-2xl p-5 text-left border transition ${
                  barber.id === b.id ? "border-[color:var(--gold)] ring-1 ring-[color:var(--gold)] gold-glow" : "border-border hover:border-[color:var(--gold)]/40"
                }`}>
                  <img src={b.image} className="h-20 w-20 rounded-full object-cover mx-auto ring-2 ring-[color:var(--gold)]/30" />
                  <div className="font-display text-lg text-center mt-3">{b.name}</div>
                  <div className="text-xs text-center text-muted-foreground">{b.title}</div>
                  <div className="flex items-center justify-center gap-1 text-gold mt-2 text-sm">
                    <Star className="h-3.5 w-3.5 fill-current" /> {b.rating}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="font-display text-2xl mb-6">Selecione um serviço</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((s) => (
                <button key={s.id} onClick={() => setService(s)} className={`rounded-2xl p-5 text-left border transition ${
                  service.id === s.id ? "border-[color:var(--gold)] gold-glow" : "border-border hover:border-[color:var(--gold)]/40"
                }`}>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-gold">{s.category}</div>
                  <div className="font-display text-lg mt-2">{s.name}</div>
                  <div className="mt-4 flex items-end justify-between">
                    <div className="text-2xl font-display text-gradient-gold">{fmtBRL(s.price)}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3"/> {s.duration}m</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="font-display text-2xl mb-6">Escolha uma data — Maio 2026</div>
            <div className="grid grid-cols-7 gap-2">
              {["D","S","T","Q","Q","S","S"].map((d, i) => (
                <div key={i} className="text-center text-xs text-muted-foreground py-2">{d}</div>
              ))}
              {days.map((d) => (
                <button key={d} onClick={() => setDate(d)} className={`aspect-square rounded-xl border text-sm font-medium transition ${
                  date === d ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-gold gold-glow" : "border-border hover:border-[color:var(--gold)]/40"
                }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="font-display text-2xl mb-6">Escolha um horário</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {times.map((t) => (
                <button key={t} onClick={() => setTime(t)} className={`rounded-xl border py-3 text-sm font-medium transition ${
                  time === t ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-gold gold-glow" : "border-border hover:border-[color:var(--gold)]/40"
                }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="font-display text-2xl mb-6">Confirme seu agendamento</div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border p-6 space-y-4">
                {[
                  ["Barbeiro", barber.name],
                  ["Serviço", service.name],
                  ["Data", `${date} de Maio, 2026`],
                  ["Horário", time],
                  ["Duração", `${service.duration} min`],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-4 flex justify-between items-end">
                  <span className="text-muted-foreground text-sm">Total</span>
                  <span className="font-display text-3xl text-gradient-gold">{fmtBRL(service.price)}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-[color:var(--gold)]/40 bg-gradient-to-br from-[color:var(--gold)]/10 to-transparent p-6">
                <div className="text-[11px] uppercase tracking-[0.25em] text-gold">Nota Maison</div>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Chegue com 5 minutos de antecedência. Cancelamentos em menos de 12h têm taxa de 30%. Oferecemos um espresso de boas-vindas na chegada.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <button onClick={prev} disabled={step === 0} className="rounded-xl border border-border px-5 py-2.5 text-sm disabled:opacity-30">
            Voltar
          </button>
          {step < 4 ? (
            <button onClick={next} className="rounded-xl gradient-gold px-6 py-2.5 text-sm font-medium text-primary-foreground gold-glow">
              Continuar
            </button>
          ) : (
            <Link to="/client" className="rounded-xl gradient-gold px-6 py-2.5 text-sm font-medium text-primary-foreground gold-glow">
              Confirmar agendamento
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}
