import * as React from "react";
import { cn } from "../lib/utils";
import type { AccentColor } from "./appearance-context";

export interface AccentSwatchProps extends React.HTMLAttributes<HTMLSpanElement> {
  accent: AccentColor;
}

/** A round dot in an accent colour (the accent's light-theme primary) — for pickers. */
const AccentSwatch = React.forwardRef<HTMLSpanElement, AccentSwatchProps>(({ accent, className, style, ...props }, ref) => (
  <span
    ref={ref}
    aria-hidden="true"
    className={cn("inline-block size-3 shrink-0 rounded-full", className)}
    style={{ background: `var(--accent-swatch-${accent})`, ...style }}
    {...props}
  />
));
AccentSwatch.displayName = "AccentSwatch";

export { AccentSwatch };
