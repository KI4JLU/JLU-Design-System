import { cva } from "class-variance-authority";

/**
 * Container — horizontally centered page column. Page margins come from the
 * spacing tokens (`gutter` on mobile, `margin-page` from md up); the maximum
 * width is the `--max-width-container-max` token (arbitrary-value syntax,
 * since Tailwind 4 has no `--max-width-*` utility namespace).
 */
export const containerVariants = cva("mx-auto w-full px-gutter md:px-margin-page", {
  variants: {
    size: {
      default: "max-w-(--max-width-container-max)",
      narrow: "max-w-2xl",
    },
  },
  defaultVariants: {
    size: "default",
  },
});
