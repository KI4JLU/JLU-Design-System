import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { fieldVariants } from "./field-variants";

/**
 * Shared text input. Replaces the ~12 duplicated
 * `w-full ... border-outline-variant rounded-lg focus:ring-2 ...` snippets.
 * Honors `aria-invalid` for accessible validation styling.
 * `variant="inline"` is the borderless in-flow field for in-row editing
 * (e.g. an editable rule inside a list row) — styles live in
 * ./field-variants, shared with Textarea.
 */
export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof fieldVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(fieldVariants({ variant, className }))}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
