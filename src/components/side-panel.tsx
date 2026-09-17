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
 * **The toggle row can carry a `header`, and the toggle sits on the edge that
 * faces the content.** A left pane reads `[header … toggle]`, a right pane
 * `[toggle … header]` — mirrored, so both panes put their control next to the
 * main column rather than against the window edge, and so the two headers plus
 * the main column's bar line up as one `h-16` chrome row. `header` is
 * expanded-only; there is deliberately **no** `footer` slot — a composing
 * shell pins its own footer inside `children`.
 *
 * While collapsed the pane shrinks to a `SIDE_PANEL_RAIL_WIDTH` rail showing
 * the expand button and the optional `collapsedPreview`; `children` stay
 * mounted but hidden (attribute `hidden` + `display:none`), so scroll position
 * and half-typed input survive a collapse. All labels are props — a consumer
 * may be bilingual; this follows `navLabel` on `AppShellLayout` rather than
 * inventing a second pattern. The `<aside>` is a `complementary` landmark: with
 * more than one pane on screen, pass an `aria-label` so they can be told apart.
 *
 * Viewport behaviour is **not** here. Deciding whether a pane is shown at all
 * on a narrow screen — typically one pane at a time plus a `BottomTabBar` —
 * belongs to the composing template (`WorkspaceLayout`, and since 0.30.0
 * `AppShell`, which share `useIsDesktop` in `lib/pane-layout.ts`), so the same
 * frame works in every one of those places.
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
  /**
   * Brand/title node rendered in the toggle row while expanded (a pane title,
   * a logo, a small action pair). Hidden while collapsed — the rail holds only
   * the expand button and `collapsedPreview`, exactly as `Sidebar.header` is
   * dropped from the collapsed column. Pass a node that can shrink
   * (`className="truncate"` on a title): the slot is `min-w-0`, so a long
   * title clips instead of pushing the toggle off the row.
   */
  header?: React.ReactNode;
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
      header,
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

    // Defined once and placed twice (see the header row below): only the
    // POSITION differs per side, and the aria contract — label,
    // `aria-expanded`, `aria-controls` — must not be able to drift between two
    // copies of the same control. `ml-auto` is the left pane's only extra: it
    // pins the toggle to the trailing edge when no `header` fills the row.
    const collapseToggle = (
      <Button
        variant="ghost"
        size="icon"
        className={cn("shrink-0", side === "left" && "ml-auto")}
        aria-label={collapseLabel}
        aria-expanded={true}
        aria-controls={bodyId}
        onClick={onCollapse}
      >
        <CollapseIcon className="h-5 w-5" aria-hidden />
      </Button>
    );

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
          {/*
            One fixed-height chrome row, `h-16` like `AppShellLayout`'s bar and
            `Sidebar`'s header row, so the left pane's header, the main
            column's bar and the right pane's header sit on one baseline. The
            height is on the row, not derived from the button, so it does not
            change when a taller or shorter `header` node is passed. (The
            collapsed RAIL keeps its 60px width — that is
            `SIDE_PANEL_RAIL_WIDTH`, a different measurement; see the TODO in
            `side-panel-variants.ts`.)
          */}
          <div className="flex h-16 items-center gap-stack-sm px-gutter">
            {/* The toggle sits on the edge that FACES THE CONTENT, in both
                directions: a left pane's row reads [header … toggle], a right
                pane's [toggle … header]. DOM order carries it — on a right
                pane the toggle is emitted first — so the tab order and a
                screen reader's reading order match what is on screen, which a
                purely visual `order-*` utility would break. */}
            {side === "right" && collapseToggle}
            {/* Wrapped rather than spread into the row, like `Sidebar`'s brand
                slot: a multi-node header keeps the row's gap, and `min-w-0`
                lets a `truncate`d title clip instead of pushing the toggle out
                of the row. */}
            {/* Unmounted while collapsed, not just hidden — the opposite of
                `children`, on purpose. `children` are kept mounted because a
                pane body holds scroll position and half-typed input; a header
                is chrome (a title, a logo), it has nothing to lose, and the
                collapsed rail must contain *only* the expand button and
                `collapsedPreview`. Same rule as `Sidebar.header`. */}
            {isOpen && header && (
              <span className="flex min-w-0 flex-1 items-center gap-stack-sm">
                {header}
              </span>
            )}
            {side === "left" && collapseToggle}
          </div>
          {children}
        </div>
      </aside>
    );
  },
);
SidePanel.displayName = "SidePanel";

export { SidePanel };
