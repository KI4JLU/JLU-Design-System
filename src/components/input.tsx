import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Shared text input. Replaces the ~12 duplicated
 * `w-full ... border-outline-variant rounded-lg focus:ring-2 ...` snippets.
 * Honors `aria-invalid` for accessible validation styling.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface outline-none transition-all",
        "placeholder:text-on-surface-variant",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-focus-ring",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-[invalid=true]:border-error aria-[invalid=true]:focus-visible:ring-error",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
