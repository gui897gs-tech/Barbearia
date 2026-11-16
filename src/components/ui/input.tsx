import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input(
  { className, type, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn("kb-field h-11 px-4 file:border-0 file:bg-transparent file:text-sm", className)}
      {...props}
    />
  );
});
