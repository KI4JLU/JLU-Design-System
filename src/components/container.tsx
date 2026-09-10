import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { containerVariants } from "./container-variants";

/**
 * Centered page column with token-based side margins (`gutter` → mobile,
 * `margin-page` → desktop). `size` names the role of the page, not a size step:
 * `page` (1440px, the page maximum — the default), `content` (1000px, a
 * centered content column) and `reading` (672px, one column of running text or
 * form fields). Never set the width with a `max-w-*` class at the call site —
 * pick the size, or add one here.
 */
export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  asChild?: boolean;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp ref={ref} className={cn(containerVariants({ size, className }))} {...props} />
    );
  },
);
Container.displayName = "Container";

export { Container };
