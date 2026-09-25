import * as React from "react";
import { cn } from "../lib/utils";
import { useScrollbarGutter } from "../lib/use-scrollbar-gutter";
import { useScrollFade } from "../lib/use-scroll-fade";

export interface SidebarScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Room on the right the scrollbar may take, in px. The area's right padding
   * is this minus the scrollbar's width, so content keeps its width whether a
   * bar shows or not. Default 16 — the side panels' inset.
   */
  gutter?: number;
  /** Fade the content out at an edge with more to scroll (px; 0 = hard crop). Default 24. */
  fade?: number;
  /** Render as a list (`<ul>`) instead of a `<div>`. */
  as?: "div" | "ul";
}

/**
 * The scrolling part of a side panel (a chat list, a source list) under a
 * fixed head: `min-h-0 flex-1 overflow-y-auto`, with the scrollbar kept in
 * the right gutter (`useScrollbarGutter`) so cards are exactly as wide as the
 * controls above them, and content fading out at an edge with more to scroll
 * instead of a hard crop (`useScrollFade`). Place it where it can reach the column's right inset,
 * e.g. with a negative right margin equal to `gutter`.
 */
const SidebarScrollArea = React.forwardRef<HTMLElement, SidebarScrollAreaProps>(
  ({ gutter = 16, fade = 24, as = "div", className, ...props }, forwardedRef) => {
    const innerRef = React.useRef<HTMLElement | null>(null);
    React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLElement);
    useScrollbarGutter(innerRef, gutter);
    useScrollFade(innerRef, { size: fade, enabled: fade > 0 });
    const Comp = as as React.ElementType;
    return (
      <Comp
        ref={innerRef}
        data-slot="sidebar-scroll-area"
        className={cn("min-h-0 flex-1 overflow-y-auto", className)}
        {...props}
      />
    );
  },
);
SidebarScrollArea.displayName = "SidebarScrollArea";

export { SidebarScrollArea };
