import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * Loading spinner. Replaces the ad-hoc `LoaderCircle` + `animate-spin`
 * copies. Announces itself to screen readers via role="status" and a
 * visually hidden label (override with `label` when "Wird geladen …"
 * doesn't fit the context). Inherits its color from the surrounding text
 * (currentColor), so it works inside buttons and tinted surfaces alike.
 */
const spinnerSizes = {
  sm: "h-4 w-4",
  default: "h-5 w-5",
  lg: "h-8 w-8",
} as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: keyof typeof spinnerSizes;
  /** Screen-reader label. Default: "Wird geladen …" */
  label?: string;
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = "default", label = "Wird geladen …", ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <LoaderCircle aria-hidden="true" className={cn("animate-spin", spinnerSizes[size])} />
      <span className="sr-only">{label}</span>
    </span>
  ),
);
Spinner.displayName = "Spinner";

export { Spinner };
