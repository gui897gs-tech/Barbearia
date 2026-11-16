import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea ref={ref} className={cn("kb-field min-h-[96px] px-4 py-3", className)} {...props} />
    );
  },
);
