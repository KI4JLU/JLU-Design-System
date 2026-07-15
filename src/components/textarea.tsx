import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Shared multiline text field. Mirrors <Input> styling (tokens, focus ring,
 * `aria-invalid` validation optics) for raw <textarea> call sites.
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-24 w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface outline-none transition-all",
      "placeholder:text-on-surface-variant",
      "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-focus-ring",
      "disabled:cursor-not-allowed disabled:opacity-60",
      "aria-[invalid=true]:border-error aria-[invalid=true]:focus-visible:ring-error",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
