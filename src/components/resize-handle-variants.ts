import { cva } from "class-variance-authority";

/**
 * ResizeHandle style variants (cva). The handle is a thin, borderless track
 * between two panes: invisible at rest, tinted on hover, filled with
 * `bg-primary` while it is being dragged. It draws **no** border of its own —
 * the pane border belongs to `SidePanel` (`sidePanelVariants.side`), which is
 * why the consumer no longer needs a negative margin to collapse two
 * neighbouring 1px lines.
 *
 * `dragging` is driven by the handle itself (it owns the pointer drag), not by
 * a consumer prop — see the ownership note in `resize-handle.tsx`.
 */
export const resizeHandleVariants = cva(
  [
    "w-1.5 shrink-0 self-stretch cursor-col-resize touch-none select-none",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
  ].join(" "),
  {
    variants: {
      dragging: {
        true: "bg-primary",
        false: "bg-transparent hover:bg-outline-variant",
      },
    },
    defaultVariants: {
      dragging: false,
    },
  },
);
