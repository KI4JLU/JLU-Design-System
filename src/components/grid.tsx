import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { gridVariants } from "./grid-variants";

/**
 * Responsive grid primitive. `cols` is the desktop column count (1–4); the
 * collapse to fewer columns on smaller screens is handled internally. Gaps
 * come from the spacing tokens (`stack-*`, `gutter`) — no raw pixel values.
 */
export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  asChild?: boolean;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp ref={ref} className={cn(gridVariants({ cols, gap, className }))} {...props} />
    );
  },
);
Grid.displayName = "Grid";

export { Grid };
