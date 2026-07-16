import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { navItemVariants } from "./nav-item-variants";

/**
 * Sidebar/menu navigation row: icon + label (+ optional trailing element,
 * e.g. a chevron with `ml-auto`). `active` marks the current page and sets
 * `aria-current="page"`. Use `asChild` to render a router <Link>; without it
 * a <button> is rendered (pass type="button" in forms). Styling is complete —
 * consumers add no skin classes (className is for layout exceptions only).
 */
export interface NavItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof navItemVariants> {
  asChild?: boolean;
}

const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(
  ({ className, level, active, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        aria-current={active ? "page" : undefined}
        className={cn(navItemVariants({ level, active, className }))}
        {...props}
      />
    );
  },
);
NavItem.displayName = "NavItem";

export { NavItem };
