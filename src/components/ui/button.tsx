import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const base =
  "kb-press relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  default: "bg-[color:var(--gold)] text-primary-foreground hover:bg-[color:var(--gold-hover)]",
  destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
  outline:
    "border border-border bg-card/60 text-foreground backdrop-blur hover:border-[color:var(--gold)]/60 hover:text-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
  ghost: "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
  link: "text-gold underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-10 px-5",
  sm: "h-9 rounded-lg px-3.5 text-xs",
  lg: "h-12 px-8 text-[15px]",
  icon: "h-10 w-10",
};

export function buttonClasses({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
});
