import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { badgeVariants } from "./badge-variants";

/**
 * Status badge/chip. `tone` speaks the semantic status vocabulary
 * (success/warning/error/info/…), `appearance` picks the shape:
 * `filled` pill (status labels, KPI deltas) or `text` inline icon+text
 * (health checks). Icons are passed as children (lucide, width/height 1em);
 * add `animate-spin` on a loader icon at the call site.
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, appearance, tone, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ appearance, tone, className }))}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";

export { Badge };
