import { cva } from "class-variance-authority";

/**
 * One row card of a side panel (SidebarCard). `shape` follows the app-wide
 * Style (useUiShape): `rounded` = card radius, `pill` = capsule with tighter
 * padding — and back to `rounded-2xl` once the card grows a meta line, as the
 * composer does when its text wraps.
 */
/**
 * The row geometry of every side-panel row — cards, and the user-menu trigger
 * under them — per shape, so their leading icons line up on one axis: 1px
 * border (transparent where a row draws none), this inset, then a 28px tile.
 */
export const sidebarRowInset = {
  rounded: "gap-3 px-3 py-2.5",
  pill: "gap-2.5 py-[7px] pr-2.5 pl-2",
} as const;

export const sidebarCardVariants = cva(
  [
    "group/sidebar-card flex w-full min-w-0 cursor-pointer items-center border text-left text-on-surface shadow-card transition-colors",
    "focus-within:outline-none",
  ],
  {
    variants: {
      shape: {
        rounded: `rounded-xl ${sidebarRowInset.rounded}`,
        pill: `rounded-full has-[[data-slot=sidebar-card-meta]>*]:rounded-2xl ${sidebarRowInset.pill}`,
      },
      state: {
        idle: "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-high",
        active: "border-primary bg-primary/10",
      },
    },
    defaultVariants: { shape: "rounded", state: "idle" },
  },
);

/** The tinted icon tile at the start of a card (and in the rail). */
export const sidebarIconTileVariants = cva(
  "flex size-7 shrink-0 items-center justify-center bg-secondary-container text-[15px] leading-none text-primary [&>svg]:size-[18px]",
  {
    variants: {
      shape: { rounded: "rounded-[6px]", pill: "rounded-full" },
    },
    defaultVariants: { shape: "rounded" },
  },
);

/** Radius of the card's own icon buttons (menu, extra actions). */
export const sidebarControlShape = {
  rounded: "rounded-action",
  pill: "rounded-full",
} as const;
