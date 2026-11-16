import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, Laptop, Moon, Sun, type IconComponent } from "@/components/icons";
import { Theme, useTheme } from "@/features/theme/theme-provider";
import { cn } from "@/shared/utils/cn";

const options: Array<{ value: Theme; label: string; icon: IconComponent }> = [
  { value: "light", label: "Tema claro", icon: Sun },
  { value: "dark", label: "Tema escuro", icon: Moon },
  { value: "system", label: "Usar o sistema", icon: Laptop },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, mounted, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointer);
    const activeIndex = Math.max(
      0,
      options.findIndex((option) => option.value === theme),
    );
    requestAnimationFrame(() => itemRefs.current[activeIndex]?.focus());
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, [open, theme]);

  function close(focusTrigger = true) {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }

  function handleMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Tab") {
      close(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Alterar tema"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={!mounted}
        onClick={() => setOpen((current) => !current)}
        className="kb-press group grid h-10 w-10 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground backdrop-blur transition hover:border-[color:var(--gold)]/60 hover:text-foreground disabled:opacity-50"
      >
        <CurrentIcon
          size={17}
          className="transition-transform duration-500 group-hover:rotate-[24deg]"
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Tema"
          onKeyDown={handleMenuKey}
          className="kb-pop absolute right-0 top-[calc(100%+8px)] z-[90] w-52 origin-top-right rounded-2xl border border-border bg-popover/95 p-1.5 text-popover-foreground shadow-[0_24px_60px_-24px_rgb(0_0_0/0.5)] backdrop-blur-xl"
        >
          {options.map((option, index) => {
            const Icon = option.icon;
            const selected = theme === option.value;
            return (
              <button
                key={option.value}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(option.value);
                  close();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm outline-none transition focus-visible:bg-accent hover:bg-accent",
                  selected ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon size={16} className={selected ? "text-gold" : undefined} />
                <span className="flex-1">{option.label}</span>
                {selected ? <Check size={15} className="text-gold" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
