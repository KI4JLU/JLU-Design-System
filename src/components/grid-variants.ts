import { cva } from "class-variance-authority";

/**
 * Grid — responsive column grid. `cols` is the DESKTOP column count; the
 * mobile collapse (1 column, then stepwise up) is built in, so call sites
 * never write their own breakpoint ladder.
 *
 * **`cols="auto"` is the one that does not count columns at all**, and for a
 * card grid it is usually the right answer. The numbered variants are a
 * BREAKPOINT ladder: they change at the viewport's width, in steps, wherever
 * Tailwind's `md`/`xl` happen to fall. That is correct for a layout with a
 * designed column count and wrong for a wall of cards, where what matters is
 * how many cards FIT — `cols={3}` reaches three only at `xl` (1280px), so
 * every width from 768 to 1279 renders two columns with room to spare.
 *
 * `auto` fills as many equal tracks as fit at `--grid-min-card` (17.5rem /
 * 280px), so the count follows the actual width of the container and keeps
 * following it inside a shell whose side columns collapse and expand.
 *
 * `auto-fill` rather than `auto-fit`: `auto-fit` collapses the empty tracks, so
 * a grid holding one card stretches it across the whole row. A card that is
 * card-sized whether it has neighbours or not is what a wall of cards needs.
 */
export const gridVariants = cva("grid", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
      auto: "grid-cols-[repeat(auto-fill,minmax(min(17.5rem,100%),1fr))]",
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
