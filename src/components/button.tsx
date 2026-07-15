import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { buttonVariants } from "./button-variants";

/**
 * Shared button. Colors reference semantic tokens (see docs/DESIGN_SYSTEM.md);
 * `active:scale-95` + `hover:brightness-*` keep the app's existing tactile feel.
 * Use `asChild` to render a Link/anchor with button styling.
 * Style variants live in ./button-variants (import `buttonVariants` from there).
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
