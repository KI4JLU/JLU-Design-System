import { cva } from "class-variance-authority";

/**
 * NavItem style variants (cva). Formalizes the sidebar-row pattern:
 * pill-shaped rows, `level` picks top-level vs. nested sizing, `active`
 * carries the current-page state (bg-primary top / secondary-container sub).
 * Note: the active top-level row deliberately switches to the label font
 * (font-label-sm) — that is the app's established look, kept 1:1.
 */
export const navItemVariants = cva(
  "flex w-full items-center rounded-full transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&_svg]:shrink-0",
  {
    variants: {
      level: {
        top: "gap-4 px-4 py-3 font-body-base text-body-base",
        sub: "gap-3 px-3 py-2 font-body-base text-sm",
      },
      active: {
        true: "",
        false: "text-on-surface-variant hover:bg-secondary-container",
      },
    },
    compoundVariants: [
      {
        level: "top",
        active: true,
        className: "bg-primary text-on-primary font-label-sm",
      },
      {
        level: "sub",
        active: true,
        className: "bg-secondary-container text-on-secondary-container",
      },
    ],
    defaultVariants: {
      level: "top",
      active: false,
    },
  },
);
