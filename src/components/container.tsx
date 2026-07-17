import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { containerVariants } from "./container-variants";

/**
 * Centered page column with token-based side margins (`gutter` → mobile,
 * `margin-page` → desktop) and the `container-max` maximum width.
 * `size="narrow"` gives the single-column reading/form width.
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
