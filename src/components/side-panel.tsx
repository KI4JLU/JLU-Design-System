import * as React from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { SIDE_PANEL_RAIL_WIDTH, sidePanelVariants } from "./side-panel-variants";

/**
 * Collapsible pane frame: width, collapsed state and border edge for a
 * workspace side pane (history on the left, sources on the right, …).
 *
 * **Controlled only.** `isOpen` and `width` are consumer state — a workspace
 * usually keeps both in a context and persists them, and two panes plus a
 * template have to agree on them. The frame keeps no open/width state of its
 * own, so there is one source of truth.
 *
 * **The collapse/expand control belongs to the frame, not to `children`:** it
 * is the only control that exists while the pane is collapsed. Passing it in
 * as content would make it disappear exactly when it is needed.
 *
 * While collapsed the pane shrinks to a `SIDE_PANEL_RAIL_WIDTH` rail showing
 * the expand button and the optional `collapsedPreview`; `children` stay
 * mounted but hidden (attribute `hidden` + `display:none`), so scroll position
 * and half-typed input survive a collapse. All labels are props — a consumer
 * may be bilingual; this follows `navLabel` on `AppShellLayout` rather than
 * inventing a second pattern. The `<aside>` is a `complementary` landmark: with
 * more than one pane on screen, pass an `aria-label` so they can be told apart.
 *
 * Viewport behaviour is **not** here. Like `Sidebar` (positioning/drawer live
 * in `AppShell`), deciding whether a pane is shown at all on a narrow screen —
 * typically one pane at a time plus a `BottomTabBar` — belongs to the
 * composing workspace template, so the same frame works in both places.
 */
export interface SidePanelProps extends React.HTMLAttributes<HTMLElement> {
  /** Which edge the pane sits on — drives the border edge and the chevron direction. */
  side: "left" | "right";
  /** Expanded (true) or collapsed to the rail (false). Consumer state. */
  isOpen: boolean;
  /** Expanded width in px. Consumer state (drag-resizable via `ResizeHandle`). */
  width: number;
  onExpand: () => void;
  onCollapse: () => void;
  /** Accessible name of the expand button (shown while collapsed). */
  expandLabel: string;
  /** Accessible name of the collapse button (shown while expanded). */
  collapseLabel: string;
  /** Optional icon strip shown in the collapsed rail below the expand button. */
  collapsedPreview?: React.ReactNode;
  children: React.ReactNode;
}

const SidePanel = React.forwardRef<HTMLElement, SidePanelProps>(
  (
    {
      side,
      isOpen,
      width,
      onExpand,
      onCollapse,
      expandLabel,
      collapseLabel,
      collapsedPreview,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    // One id for the pane body, referenced by whichever toggle is on screen —
    // aria-expanded without aria-controls leaves the region unidentified.
    const bodyId = React.useId();
    // Two icons, not one: a chevron has to point the way the control moves the
    // pane. Collapsing pushes the pane at its own edge (a left pane goes left),
    // expanding pulls it back toward the content. lucide's path data is the
    // authority — panel-left-close's chevron apexes left, panel-left-open's
    // right, and the Right pair mirrors that.
    const CollapseIcon = side === "left" ? PanelLeftClose : PanelRightClose;
    const ExpandIcon = side === "left" ? PanelLeftOpen : PanelRightOpen;

    return (
      <aside
        ref={ref}
        // Merged, not spread over: a consumer adding an unrelated style (a
        // z-index, say) must not silently drop the width.
        style={{ width: isOpen ? width : SIDE_PANEL_RAIL_WIDTH, ...style }}
        className={cn(sidePanelVariants({ side }), className)}
        {...props}
      >
        {!isOpen && (
          <div className="flex min-h-0 flex-1 flex-col items-center gap-stack-md overflow-y-auto py-stack-md">
            <Button
              variant="ghost"
              size="icon"
              aria-label={expandLabel}
              aria-expanded={false}
              aria-controls={bodyId}
              onClick={onExpand}
            >
              <ExpandIcon className="h-5 w-5" aria-hidden />
            </Button>
            {collapsedPreview}
          </div>
        )}

        {/*
          Two mechanisms on purpose, and they agree rather than fight: the
          `hidden` *attribute* is what removes the collapsed body from the
          accessibility tree, the display *utility* is what removes it from the
          layout. Only the utility is ours — `[hidden] { display: none }` comes
          from Tailwind's preflight (verified in the built CSS, where it is even
          `!important`), and a consumer that compiles Tailwind without preflight
          would style the attribute not at all.
        */}
        <div
          id={bodyId}
          hidden={!isOpen}
          className={cn("min-h-0 flex-1 flex-col", isOpen ? "flex" : "hidden")}
        >
          <div className="flex justify-end px-gutter pt-stack-sm">
            <Button
              variant="ghost"
              size="icon"
              aria-label={collapseLabel}
              aria-expanded={true}
              aria-controls={bodyId}
              onClick={onCollapse}
            >
              <CollapseIcon className="h-5 w-5" aria-hidden />
            </Button>
          </div>
          {children}
        </div>
      </aside>
    );
  },
);
SidePanel.displayName = "SidePanel";

export { SidePanel };
