import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/** Interruptor acessível (role="switch") com trilho animado. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, className, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-[color:var(--gold)] bg-[color:var(--gold)]" : "border-border bg-input",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none absolute left-[3px] h-5 w-5 rounded-full bg-background shadow-md transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)]",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
});
