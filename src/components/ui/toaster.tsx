import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Sparkles, X } from "@/components/icons";
import { dismissToast, subscribeToasts, type ToastItem } from "@/shared/notifications/toast-store";

const toneStyles = {
  success: { icon: CheckCircle2, accent: "var(--gold)" },
  error: { icon: AlertTriangle, accent: "var(--destructive)" },
  info: { icon: Sparkles, accent: "var(--gold)" },
} as const;

/** Pilha de notificações própria, com entrada em mola e barra de tempo. */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => subscribeToasts(setItems), []);

  return (
    <section
      aria-label="Notificações"
      className="pointer-events-none fixed inset-x-3 bottom-24 z-[120] flex flex-col items-center gap-2.5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end lg:bottom-6"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </section>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const [leaving, setLeaving] = useState(false);
  const tone = toneStyles[item.tone];
  const Icon = tone.icon;

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), item.duration);
    return () => window.clearTimeout(leaveTimer);
  }, [item.duration]);

  useEffect(() => {
    if (!leaving) return;
    const removeTimer = window.setTimeout(() => dismissToast(item.id), 260);
    return () => window.clearTimeout(removeTimer);
  }, [item.id, leaving]);

  return (
    <div
      role={item.tone === "error" ? "alert" : "status"}
      data-leaving={leaving || undefined}
      className="kb-toast pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-popover/95 p-4 pr-11 text-popover-foreground shadow-[0_24px_60px_-28px_rgb(0_0_0/0.55)] backdrop-blur-xl"
      style={{ "--toast-accent": tone.accent } as React.CSSProperties}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--toast-accent)]/12 text-[color:var(--toast-accent)]">
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug">{item.title}</p>
          {item.description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        aria-label="Fechar notificação"
        onClick={() => setLeaving(true)}
        className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <X size={14} />
      </button>
      <span
        aria-hidden
        className="kb-toast-timer absolute inset-x-0 bottom-0 h-[2px] origin-left bg-[color:var(--toast-accent)]"
        style={{ animationDuration: `${item.duration}ms` }}
      />
    </div>
  );
}
