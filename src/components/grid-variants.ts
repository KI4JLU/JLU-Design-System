import { cva } from "class-variance-authority";

/**
 * Grid — responsive column grid. `cols` is the DESKTOP column count; the
 * mobile collapse (1 column, then stepwise up) is built in, so call sites
 * never write their own breakpoint ladder.
 */
export const gridVariants = cva("grid", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
    },
    gap: {
      sm: "gap-stack-sm",
      md: "gap-stack-md",
      lg: "gap-stack-lg",
      gutter: "gap-gutter",
    },
  },
  defaultVariants: {
    cols: 2,
    gap: "gutter",
  },
});
