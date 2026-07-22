import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { appointments } from "@/lib/sample-data";

export const Route = createFileRoute("/barber/schedule")({
  head: () => ({ meta: [{ title: "Agenda — Maison Lame" }] }),
  component: () => {
    const days = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
    const hours = Array.from({ length: 10 }, (_, i) => 9 + i);
    return (
      <AppShell role="barber">
        <PageHeader eyebrow="Esta semana" title="Sua agenda" subtitle="A coreografia das suas horas." />
        <div className="glass-card rounded-2xl p-4 md:p-6 overflow-x-auto scrollbar-none">
          <div className="min-w-[700px] grid" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
            <div />
            {days.map((d, i) => (
              <div key={d} className={`text-center pb-4 border-b border-border ${i === 3 ? "text-gold" : "text-muted-foreground"}`}>
                <div className="text-xs uppercase tracking-wider">{d}</div>
                <div className="font-display text-xl mt-1">{18 + i}</div>
              </div>
            ))}
            {hours.map((h) => (
              <div key={h} className="contents">
                <div className="text-xs text-muted-foreground py-4 pr-2 text-right border-b border-border/40">{h}:00</div>
                {days.map((d, di) => {
                  const filled = di < 5 && (h % 2 === 0 || h === 13);
                  const appt = di === 3 ? appointments.find((a) => parseInt(a.time) === h && a.barber === "Lucas Moreau") : undefined;
                  return (
                    <div key={`${h}-${d}`} className="border-b border-l border-border/40 p-1 min-h-[64px]">
                      {appt ? (
                        <div className="h-full rounded-lg bg-gradient-to-br from-[color:var(--gold)]/20 to-transparent border border-[color:var(--gold)]/40 p-2">
                          <div className="text-[10px] text-gold">{appt.service}</div>
                          <div className="text-xs font-medium truncate">{appt.client}</div>
                        </div>
                      ) : filled ? (
                        <div className="h-full rounded-lg bg-accent/30 border border-border/60" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  },
});
