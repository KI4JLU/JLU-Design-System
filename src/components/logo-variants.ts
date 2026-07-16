import { cva } from "class-variance-authority";

/**
 * Logo — the platform wordmark. One font-size dial per size; the badge
 * scales with it via em-based padding/radius, so every size keeps the
 * proportions of the brand template (badge radius ≈ ¼ of its height).
 */
export const logoVariants = cva(
  "inline-flex items-center gap-[0.3em] whitespace-nowrap font-headline-md font-bold leading-none text-on-surface",
  {
    variants: {
      size: {
        sm: "text-body-base",
        default: "text-headline-md-mobile",
        lg: "text-headline-md",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);
