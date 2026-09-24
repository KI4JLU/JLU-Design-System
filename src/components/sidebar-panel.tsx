import * as React from "react";
import { cn } from "../lib/utils";
import { SidebarScrollArea } from "./sidebar-scroll-area";

export interface SidebarPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** The column's heading ("Verlauf", "Quellen hinzufügen"). */
  title?: React.ReactNode;
  /** Beside the heading, right-aligned (a small control, a count). */
  titleAside?: React.ReactNode;
  /** Fixed content under the heading: the primary action, a search, a selection bar. */
  head?: React.ReactNode;
  /**
   * Navigation rows (`NavItem`s) that stay put between the head and the
   * scrolling list — so one column can carry page navigation AND a content
   * list (`SidebarCard`s). Omit for a list-only or a nav-only column (a
   * nav-only column passes its rows as `children` and lets them scroll).
   */
  nav?: React.ReactNode;
  /** Fade at scrollable edges in px (0 = hard crop). Default 24. */
  fade?: number;
}

/**
 * The body of a side column — the SAME frame on the left and the right, so a
 * change to one is a change to both: a fixed head (title row + `head`, then
 * optional `nav` rows) and, below it, the column's list, which alone scrolls (`SidebarScrollArea`:
 * scrollbar kept in the right gutter, content fading at scrollable edges).
 *
 * Fills its column (`h-full`). `AppShellLayout` drops its nav padding around
 * a SidebarPanel, so the left and the right column start from the same box
 * and their headings share a baseline by construction.
 */
const SidebarPanel = React.forwardRef<HTMLDivElement, SidebarPanelProps>(
  ({ title, titleAside, head, nav, fade = 24, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-panel"
      className={cn("flex h-full min-h-0 flex-col", className)}
      {...props}
    >
      <div data-slot="sidebar-panel-head" className="flex flex-none flex-col gap-3 px-4 pt-4 pb-3">
        {title && (
          <div className="flex min-h-8 items-center justify-between gap-2">
            <h2 className="m-0 text-sm font-semibold text-primary">{title}</h2>
            {titleAside}
          </div>
        )}
        {head}
        {nav && (
          <div data-slot="sidebar-panel-nav" className="flex flex-col gap-1">
            {nav}
          </div>
        )}
      </div>
      <SidebarScrollArea gutter={16} fade={fade} className="pb-6 pl-4">
        {children}
      </SidebarScrollArea>
    </div>
  ),
);
SidebarPanel.displayName = "SidebarPanel";

export { SidebarPanel };
