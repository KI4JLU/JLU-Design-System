import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { stackVariants } from "./stack-variants";

/**
 * One-dimensional layout primitive: stacks children vertically (default) or
 * in a row, with gaps from the spacing tokens (`stack-sm/md/lg`, `gutter`).
 * Use `asChild` to apply the layout to a semantic element (<ul>, <nav>, …).
 */
export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
  asChild?: boolean;
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction, gap, align, justify, wrap, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(stackVariants({ direction, gap, align, justify, wrap, className }))}
        {...props}
      />
    );
  },
);
Stack.displayName = "Stack";

export { Stack };
