import * as React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import {
  SidebarCollapsedContext,
  SidebarSurfaceContext,
} from "./sidebar-context";

/**
 * Structural navigation column: optional header (logo/brand), a scrollable
 * <nav> for NavItems, optional footer (user menu). Purely the column itself —
 * positioning, the border and any viewport behaviour belong to whatever
 * composes it.
 *
 * **Standalone since 0.30.0.** `AppShell` no longer renders this component:
 * its nav column is a `SidePanel` (collapsing to the 60px rail, with a
 * `header` slot and its own toggle), so `Sidebar` is what an app reaches for
 * when it needs a nav column *outside* the shell. Nothing here changed — the
 * props, the 80px collapsed width and the toggle are exactly as in 0.29.0 —
 * but the shell is no longer one of its call sites.
 *
 * **Collapsing is controlled, never remembered.** `collapsed` /
 * `onCollapsedChange` are consumer state, like `SidePanel`'s `isOpen` and
 * `SectionedGridLayout`'s `isOpen`/`onOpenChange`: the app owns it (a URL
 * parameter, a context, `localStorage`), this column only renders what it is
 * told. There is deliberately **no** `defaultCollapsed` — a component that
 * remembered anything would be a second truth next to the app's, and the
 * sidebar's width is exactly the kind of thing an app persists per user.
 *
 * **The toggle belongs to the column, not to the `header` slot.** Same reason
 * `SidePanel` owns its expand control: the toggle is the only way back out of
 * the collapsed state, so it must survive collapsing — and it carries a
 * contract (`aria-expanded` + `aria-controls` pointing at the <nav>, a label
 * pair for both directions) that an arbitrary node hung into a slot could not
 * be held to. It renders as the trailing item of the header row, right-aligned
 * inline with the brand node, and appears only when `onCollapsedChange` is
 * given — without a handler a toggle could not do anything.
 *
 * **The drawer case is gone (0.30.0).** `AppShell` used to render this same
 * node a second time inside a mobile drawer and to suppress the toggle and the
 * collapsed width there, via `SidebarSurfaceContext`. There is no drawer any
 * more, so nothing produces that value and every mount behaves as
 * „standalone"; the reader below is kept only so a `Sidebar` inside some other
 * consumer's provider still behaves. See `sidebar-context.ts`.
 */
export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** Brand area above the navigation (logo, product name). Hidden while collapsed. */
  header?: React.ReactNode;
  /** Pinned area below the navigation (user menu). */
  footer?: React.ReactNode;
  /** Accessible name of the <nav> landmark. */
  label?: string;
  /**
   * Icon-width (`true`) or full-width (`false`). Consumer state — pass
   * `onCollapsedChange` to get the toggle that requests a change.
   */
  collapsed?: boolean;
  /**
   * The toggle was pressed; carries the requested state, never the old one.
   * Omitting it renders no toggle: `collapsed` then still works as a
   * presentational prop for an app that drives the state from elsewhere.
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Accessible name of the toggle while expanded. Default "Navigation einklappen". */
  collapseLabel?: string;
  /** Accessible name of the toggle while collapsed. Default "Navigation ausklappen". */
  expandLabel?: string;
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  (
    {
      className,
      header,
      footer,
      label = "Hauptnavigation",
      collapsed = false,
      onCollapsedChange,
      collapseLabel = "Navigation einklappen",
      expandLabel = "Navigation ausklappen",
      children,
      ...props
    },
    ref,
  ) => {
    // The <nav> is what the toggle expands and collapses, so it needs a stable
    // id to point `aria-controls` at — `aria-expanded` on its own leaves the
    // controlled region unidentified (same reasoning as SidePanel's bodyId).
    // useId is per mount, so AppShell's two copies cannot collide.
    const navId = React.useId();
    const inDrawer = React.useContext(SidebarSurfaceContext) === "drawer";
    const isCollapsed = collapsed && !inDrawer;
    const showToggle = onCollapsedChange !== undefined && !inDrawer;

    return (
      <SidebarCollapsedContext.Provider value={isCollapsed}>
        <aside
          ref={ref}
          data-collapsed={isCollapsed ? "true" : undefined}
          className={cn(
            "flex h-full shrink-0 flex-col bg-surface-container-lowest",
            // Both widths come from tokens; `--width-sidebar` is exactly what
            // `w-64` resolved to before, so the expanded column did not move.
            isCollapsed ? "w-(--width-sidebar-collapsed)" : "w-(--width-sidebar)",
            className,
          )}
          {...props}
        >
          {(header || showToggle) && (
            <div
              className={cn(
                "flex h-16 items-center gap-stack-sm px-4",
                isCollapsed && "justify-center px-2",
              )}
            >
              {/* Wrapped rather than spread into the row so the brand can be
                  removed as one unit: at 80px there is room for the toggle or
                  the wordmark, not both, and the toggle is the one that has to
                  stay. The wrapper repeats the row's gap, so a multi-node
                  brand keeps its spacing. */}
              {header && !isCollapsed && (
                <span className="flex min-w-0 items-center gap-stack-sm">{header}</span>
              )}
              {showToggle && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={isCollapsed ? undefined : "ml-auto"}
                  aria-label={isCollapsed ? expandLabel : collapseLabel}
                  aria-expanded={!isCollapsed}
                  aria-controls={navId}
                  onClick={() => onCollapsedChange(!isCollapsed)}
                >
                  {/* lucide's own naming is the authority for the direction:
                      panel-left-close's chevron apexes left (the column moves
                      to its own edge), panel-left-open's right. Same pair
                      SidePanel uses for a left-hand pane. */}
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-5 w-5" aria-hidden />
                  ) : (
                    <PanelLeftClose className="h-5 w-5" aria-hidden />
                  )}
                </Button>
              )}
            </div>
          )}
          <nav
            id={navId}
            aria-label={label}
            className={cn(
              "flex flex-1 flex-col gap-2 overflow-y-auto p-4",
              // Only the horizontal padding shrinks: the vertical rhythm of
              // the rows is unchanged, and the collapsed width is derived from
              // exactly these 8px (see --width-sidebar-collapsed).
              isCollapsed && "px-2",
            )}
          >
            {children}
          </nav>
          {/* `flex justify-center`, not an `mx-auto` on the footer node: the
              node is typically a Button, i.e. inline-flex, and auto margins do
              nothing to an inline-level box — it rendered visibly off-centre.
              Centering from the container works whatever the consumer hangs
              in here. */}
          {footer && (
            <div className={cn("p-4", isCollapsed && "flex justify-center px-2")}>
              {footer}
            </div>
          )}
        </aside>
      </SidebarCollapsedContext.Provider>
    );
  },
);
Sidebar.displayName = "Sidebar";

export { Sidebar };
