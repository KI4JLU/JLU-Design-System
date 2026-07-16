import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * Accessible checkbox built on Radix (role="checkbox", keyboard toggle,
 * form association, `checked="indeterminate"` support). Token styling
 * analogous to Switch: checked fills with primary, unchecked shows the
 * outline. Pair it with <Label htmlFor> or FormControl for the
 * accessible name.
 */
const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded border border-outline bg-surface transition-colors",
      "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-on-primary",
      "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-on-primary",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      "disabled:cursor-not-allowed disabled:opacity-60",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      {props.checked === "indeterminate" ? (
        <Minus aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
      ) : (
        <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
