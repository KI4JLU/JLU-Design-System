import { cva } from "class-variance-authority";

/**
 * Stack — one-dimensional flex layout. `gap` speaks the spacing-token
 * vocabulary (stack-sm/md/lg, gutter) so vertical rhythm stays one dial;
 * no raw pixel gaps at call sites.
 */
export const stackVariants = cva("flex", {
  variants: {
    direction: {
      column: "flex-col",
      row: "flex-row",
    },
    gap: {
      none: "gap-0",
      sm: "gap-stack-sm",
      md: "gap-stack-md",
      lg: "gap-stack-lg",
      gutter: "gap-gutter",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    },
    wrap: {
      true: "flex-wrap",
    },
  },
  defaultVariants: {
    direction: "column",
    gap: "md",
  },
});
