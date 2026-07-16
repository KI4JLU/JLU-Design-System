import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { menuItemVariants } from "./menu-item-variants";

/**
 * Row inside a dropdown/popover menu or listbox. Renders a <button> (pass
 * type="button"); use `asChild` for links. ARIA roles stay at the call site
 * (role="option"/"menuitem" + aria-selected), since they depend on the
 * surrounding pattern. Styling is complete — className is layout-only
 * (e.g. `ml-auto` on a trailing Check icon via justify-between content).
 */
export interface MenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof menuItemVariants> {
  asChild?: boolean;
}

const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ className, variant, selected, highlighted, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(menuItemVariants({ variant, selected, highlighted, className }))}
        {...props}
      />
    );
  },
);
MenuItem.displayName = "MenuItem";

export { MenuItem };
