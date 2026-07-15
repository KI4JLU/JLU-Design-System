import { cva } from "class-variance-authority";

/**
 * Button style variants (cva). Kept in its own module so files can share it
 * (e.g. to style a Link like a button via `buttonVariants({ variant })`)
 * without tripping the react-refresh "only export components" rule.
 * All colors reference semantic tokens — see docs/DESIGN_SYSTEM.md.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-label-sm text-label-sm whitespace-nowrap transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary shadow-sm hover:brightness-110",
        secondary:
          "bg-secondary-container text-on-secondary-container hover:brightness-105",
        outline:
          "border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container-high",
        ghost: "text-on-surface hover:bg-surface-container-high",
        destructive: "bg-error text-on-error shadow-sm hover:brightness-110",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-xs",
        lg: "px-8 py-4",
        icon: "p-2 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
