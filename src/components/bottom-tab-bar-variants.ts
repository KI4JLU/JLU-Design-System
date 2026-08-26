import { cva } from "class-variance-authority";

/**
 * BottomTabBar variants (cva).
 *
 * The bar is fixed to the bottom edge and 60px tall — the same chrome unit as
 * `SIDE_PANEL_RAIL_WIDTH`, so the collapsed rail and the mobile bar match. The
 * `env(safe-area-inset-bottom)` padding keeps the tabs clear of the iOS home
 * indicator; it is an environment value, not a spacing decision, so there is no
 * token for it. Consumers that need a non-fixed bar override the position via
 * `className` (layout-only, `cn()` resolves the conflict).
 */
export const bottomTabBarVariants = cva(
  [
    "fixed inset-x-0 bottom-0 z-50 flex h-15 items-center justify-around",
    "border-t border-outline-variant bg-surface-container-lowest pb-[env(safe-area-inset-bottom,0px)]",
  ].join(" "),
);

/**
 * A single tab. `active` only recolors — the label never changes size, so the
 * bar does not reflow when the selection moves. `min-h-11 min-w-11` is the
 * 44px touch target from the accessibility bar; `gap-1` (4px) is below the
 * smallest spacing token (`stack-sm` = 8px), which would push the label past
 * the bar's height.
 */
export const bottomTabBarTabVariants = cva(
  [
    "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 py-stack-sm",
    "font-label-sm text-label-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
  ].join(" "),
  {
    variants: {
      active: {
        true: "text-primary",
        false: "text-on-surface-variant hover:text-on-surface",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

/**
 * The icon pill behind a tab's icon. The active tint uses `bg-primary/10`
 * (the documented way to build a tint — DESIGN_SYSTEM §7, 0.21.0 — since there
 * are deliberately no `--color-*-rgb` tokens). Icon size is set here so
 * consumers pass a bare `<History />` and every tab matches.
 */
export const bottomTabBarIconVariants = cva(
  "flex h-7 w-9 items-center justify-center rounded-xl transition-colors [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0",
  {
    variants: {
      active: {
        true: "bg-primary/10",
        false: "",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);
