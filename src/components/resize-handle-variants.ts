import { cva } from "class-variance-authority";

/**
 * ResizeHandle style variants (cva) — **the standard splitter shape since
 * 0.38.0: zero width in layout, a wide hit zone overlaid on the pane border.**
 *
 * The host box has **no layout width** (`w-0`). A flex item of 0px does not
 * push its neighbours apart, so the `SidePanel`'s border and the main column
 * touch exactly as if no handle were in the row — which is the point: until
 * 0.37.0 the handle was a 6px transparent flex item, and what showed through
 * it was the shell root's `bg-surface`. Between two
 * `bg-surface-container-lowest` neighbours that reads as a tinted stripe, and
 * no single track colour can match both sides of it at every height (reported
 * from JustRAG's KB screen, 2026-09-21 — „there is a whole div between header
 * and sidebar").
 *
 * The grab target is therefore an **`::after` overlay**, not the box itself:
 * `absolute inset-y-0 -left-1 w-2` — 8px wide, straddling the border line with
 * 4px reaching into each neighbour — lifted above both of them with
 * `relative z-10`. Everything visual and interactive that used to sit on the
 * host now sits on the pseudo-element: the rest/hover/dragging fill, the focus
 * ring (a `ring` needs a box to sit on, and the host's is 0px wide) and the
 * `col-resize` cursor. The cursor stays declared on the host as well —
 * harmless, and it keeps the declaration where a reader looks for it first.
 *
 * The handle still draws **no** border of its own — the pane border belongs to
 * `SidePanel` (`sidePanelVariants.side`), which is why the consumer needs no
 * negative margin to collapse two neighbouring 1px lines.
 *
 * `dragging` is driven by the handle itself (it owns the pointer drag), not by
 * a consumer prop — see the ownership note in `resize-handle.tsx`.
 *
 * Geometry and hit-testing are pinned in Chromium, not in jsdom:
 * `AppShellLayout` → `HandleHasNoLayoutWidth`.
 */
export const resizeHandleVariants = cva(
  [
    // Host: a zero-width, full-height flex item. `relative` + `z-10` make it
    // the containing block for the overlay and lift that overlay above both
    // neighbours, so the pointer reaches it instead of the panes underneath.
    "relative z-10 w-0 shrink-0 self-stretch cursor-col-resize touch-none select-none",
    "focus-visible:outline-none",
    // The grab zone: 8px centred on the border line (4px into each side).
    "after:absolute after:inset-y-0 after:-left-1 after:w-2 after:content-['']",
    "after:cursor-col-resize after:transition-colors",
    // The focus ring is inset on the overlay — the host has no box to draw on.
    "focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-focus-ring",
  ].join(" "),
  {
    variants: {
      dragging: {
        true: "after:bg-primary",
        false: "after:bg-transparent hover:after:bg-outline-variant",
      },
    },
    defaultVariants: {
      dragging: false,
    },
  },
);
