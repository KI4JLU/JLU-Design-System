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
 * `leadingIcon` renders a decorative icon inside the field (the search-field
 * pattern: absolutely positioned icon + left padding). The icon carries no
 * meaning for screen readers — the accessible name still comes from a
 * Label/aria-label.
 */
export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof fieldVariants> {
  /** Decorative icon inside the field, leading edge (e.g. `<Search />`). */
  leadingIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, leadingIcon, ...props }, ref) => {
    const input = (
      <input
        type={type}
        ref={ref}
        className={cn(fieldVariants({ variant }), leadingIcon && "pl-10", className)}
        {...props}
      />
    );
    if (!leadingIcon) return input;
    return (
      <span className="relative block w-full">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant [&_svg]:h-4 [&_svg]:w-4"
        >
          {leadingIcon}
        </span>
        {input}
      </span>
    );
  },
);
Input.displayName = "Input";

export { Input };
