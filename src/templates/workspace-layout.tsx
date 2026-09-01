import * as React from "react";
import { BottomTabBar, type BottomTabBarItem } from "../components/bottom-tab-bar";
import { ResizeHandle } from "../components/resize-handle";
import { SidePanel } from "../components/side-panel";
import { SIDE_PANEL_RAIL_WIDTH } from "../components/side-panel-variants";
import { cn } from "../lib/utils";

/**
 * Tailwind's `lg` breakpoint, as a media query: `--breakpoint-lg: 64rem` in
 * `node_modules/tailwindcss/theme.css` (this repo adds no `--breakpoint-*`
 * override). One breakpoint for the whole workspace, and the same value the
 * `lg:` utilities elsewhere in this library use, so no template invents a
 * second boundary. It is also the boundary the source implementation uses
 * (JustRAG's `useIsMobile`: `max-width: 1023px` = 1024px = 64rem at the 16px
 * default root size).
 */
const DESKTOP_QUERY = "(min-width: 64rem)";

function subscribeToViewport(onStoreChange: () => void): () => void {
  // `matchMedia` is missing in jsdom (verified: jsdom 29 does not implement
  // it), so a consumer's unit test would otherwise crash on rendering this
  // template. Degrading to the desktop arrangement keeps the pane content in
  // the tree, which is the more useful default for a test or a non-browser
  // renderer.
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function readViewport(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function assumeDesktop(): boolean {
  return true;
}

/**
 * `true` from `lg` up. `useSyncExternalStore` rather than an effect + state:
 * the first render already reads the real viewport, so the layout does not
 * flash the wrong arrangement.
 */
function useIsDesktop(): boolean {
  return React.useSyncExternalStore(subscribeToViewport, readViewport, assumeDesktop);
}

/** Which of the three areas a mobile tab shows. */
export type WorkspacePaneId = "left" | "main" | "right";

/**
 * One side pane: its content plus the controlled state it shares with the
 * consumer. Grouped into an object because both panes have the identical
 * shape — as one flat prop list this template would carry ~25 props and the
 * left/right pairs would be impossible to read.
 *
 * Everything here is **consumer state**: the app owns `isOpen` and `width`
 * (typically in a context, persisted), the template only arranges them. There
 * are no default bounds — `minWidth`/`maxWidth` are the app's decision (the
 * source implementation uses 150–600 for its left and 150–800 for its right
 * pane), so no app's numbers get baked in here.
 */
export interface WorkspacePane {
  /** Pane content. */
  content: React.ReactNode;
  /**
   * Accessible name of the pane's `complementary` landmark. Required: a
   * workspace has two of them on screen, and unnamed landmarks cannot be told
   * apart.
   */
  label: string;
  /** Expanded (`true`) or collapsed to the rail (`false`). */
  isOpen: boolean;
  /** Expanded width in px. */
  width: number;
  /** Smallest width the resize handle allows, in px. */
  minWidth: number;
  /** Largest width the resize handle allows, in px. */
  maxWidth: number;
  /** Collapse/expand was requested. One callback instead of `SidePanel`'s pair. */
  onOpenChange: (isOpen: boolean) => void;
  /** A new, already clamped width from the resize handle. */
  onWidthChange: (width: number) => void;
  /** Accessible name of the expand button (collapsed state). */
  expandLabel: string;
  /** Accessible name of the collapse button (expanded state). */
  collapseLabel: string;
  /** Accessible name of the resize handle. */
  resizeLabel: string;
  /** Optional icon strip in the collapsed rail. */
  collapsedPreview?: React.ReactNode;
}

/**
 * A tab of the narrow-screen bar plus the pane it shows. The mapping is
 * **declared by the consumer**, not derived here: an app may well have two
 * tabs that show the same pane (JustRAG's „Chat" and „Workspace" both render
 * the main area and are told apart by its own view state).
 */
export interface WorkspaceMobileTab extends BottomTabBarItem {
  /** Which area this tab shows below `lg`. */
  pane: WorkspacePaneId;
}

export interface WorkspaceLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Left pane. Omit it entirely for a workspace without one. */
  left?: WorkspacePane;
  /** Right pane. Omit it entirely for a workspace without one. */
  right?: WorkspacePane;
  /**
   * Keeps the right pane out of the **desktop** arrangement without touching
   * its collapse state (default `true`). See „Hidden is not collapsed" in the
   * component doc.
   */
  showRight?: boolean;
  /** Main area — the middle column on desktop, one of the panes below `lg`. */
  children: React.ReactNode;
  /**
   * Accessible name of the main area's `main` landmark. The template renders
   * the page's `<main>` itself, because it is the page (see „Standalone" in
   * the component doc) — nothing above it contributes one.
   */
  mainLabel: string;
  /** Tabs of the narrow-screen bar, each declaring which pane it shows. */
  mobileTabs: WorkspaceMobileTab[];
  /**
   * Id of the current tab — the **single** input that decides which pane is on
   * screen below `lg`. Any derivation the app needs (two tabs on one pane, a
   * tab implied by another piece of view state) stays in the app.
   */
  activeMobileTab: string;
  /** A tab was tapped. */
  onMobileTabChange: (id: string) => void;
  /** Accessible name of the tab bar's `navigation` landmark. */
  mobileTabBarLabel: string;
}

/** Fills its column and scrolls on its own — one per area, all three alike. */
const PANE_FILL = "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto";

/**
 * `BottomTabBar` is `fixed`, so the pane below `lg` has to reserve its height
 * or the last row of content sits behind it. The bar is one „chrome unit"
 * tall — the same number as the collapsed rail, which is why
 * `SIDE_PANEL_RAIL_WIDTH` is reused here instead of a second literal 60 (see
 * the notes in `side-panel-variants.ts` and `bottom-tab-bar-variants.ts`) —
 * plus the iOS safe area the bar itself pads with.
 */
const MOBILE_PANE_STYLE: React.CSSProperties = {
  paddingBottom: `calc(${SIDE_PANEL_RAIL_WIDTH}px + env(safe-area-inset-bottom, 0px))`,
};

/**
 * Template „Workspace": the three-column workspace — `left` pane, main area,
 * `right` pane, each side pane collapsible to a rail and drag-resizable;
 * below `lg` exactly one area at a time plus a `BottomTabBar`. Composes
 * `SidePanel` + `ResizeHandle` + `BottomTabBar`; the app injects content and
 * the controlled pane state and never rebuilds the frame.
 *
 * **Standalone — never inside `AppShellLayout`.** This template *is* the
 * chrome of its screen: its panes are the app's vertical chrome columns (the
 * source implementation frames both of them with its own `SidebarShell`, which
 * `SidePanel` replaces here), and it fills the whole viewport. Hung into
 * `AppShellLayout` as `children` it therefore puts a second sidebar next to
 * the shell's nav column — two vertical chrome columns on one screen, which is
 * what the `InAppShell` story showed before it was removed. That is also why
 * the main area is a `<main>` and not a `<section>`: no shell above it
 * contributes the page's `main` landmark, so this template has to. Contrast
 * `SectionedGridLayout`, which is page *content* and genuinely is an
 * `AppShellLayout` child — it stays a `<section aria-label>` inside the
 * shell's `<main>`. Two templates in this library, opposite answers; the
 * dividing question is „does this template own the viewport or fill a slot".
 *
 * **Composition only.** No data fetching, no derivation, no state of its own
 * beyond „is this a desktop viewport". Pane open/width state and the current
 * mobile tab live in the app (typically one context, persisted), because a
 * pane, its resize handle and this template all have to read the same number.
 *
 * **The responsive split, and why it is where it is.** Inside a branch,
 * everything is CSS: pane widths are the panes' own inline width, the
 * collapsed rail is `SidePanel`, the main area flexes, a handle is only
 * rendered next to an expanded pane. What is *not* CSS is the choice of
 * branch. „One area at a time" cannot be a media query here, because below
 * `lg` a pane is not a narrower version of itself: it fills the screen, it
 * ignores the collapse state, and its collapse control must be gone (a
 * control that collapses the only visible area would leave an empty screen,
 * and it would destroy the desktop collapse preference on the way). None of
 * those three is expressible as a class on the same markup, so the template
 * asks `matchMedia` once (`useIsDesktop`) and renders the arrangement that
 * applies — the same breakpoint, and the same reason, as the source
 * implementation. The consumer still writes no breakpoint ladder: which pane
 * a tab shows is data (`mobileTabs`), and which tab is current is one
 * controlled prop.
 *
 * **Hidden is not collapsed.** `showRight={false}` removes the right pane
 * from the desktop arrangement *without* touching `isOpen`, so the user's
 * collapse preference survives an app state that needs the width (the source
 * implementation had exactly this bug: it hid the pane by collapsing it, and
 * nobody expanded it again afterwards). Below `lg` the flag is deliberately
 * **not** consulted: hiding a pane buys horizontal space, panes do not
 * compete for space when only one is on screen, and a tab whose pane refuses
 * to appear would be a dead control. Omitting the `right` prop is the other
 * thing — then the pane does not exist at all, in either arrangement.
 *
 * Swipe gestures are not implemented here: `onTouchStart`/`onTouchEnd` (and
 * any other root attribute) pass through to the root element, so the app's
 * own gesture handling stays in the app, where its state already lives.
 *
 * TODO: two API points are reasoned above but **not yet confirmed** with the
 * design-system owner — (a) that `showRight` is deliberately ignored below
 * `lg` (a consumer reading only the prop name could expect otherwise), and
 * (b) that there is no symmetric `showLeft`, because no source material hides
 * a left pane; adding one is a one-line change if a consumer needs it.
 */
const WorkspaceLayout = React.forwardRef<HTMLDivElement, WorkspaceLayoutProps>(
  (
    {
      left,
      right,
      showRight = true,
      children,
      mainLabel,
      mobileTabs,
      activeMobileTab,
      onMobileTabChange,
      mobileTabBarLabel,
      className,
      ...props
    },
    ref,
  ) => {
    const isDesktop = useIsDesktop();
    // Ids for the panes, so each handle's `aria-controls` can reference the
    // pane it resizes (APG splitter). Minted HERE, not exposed by `SidePanel`:
    // this template is the one place that composes pane and handle, so it is
    // the one place that has to know both ends of the reference. The id goes
    // on the pane ROOT (`SidePanel`'s `<aside>`, via the pass-through `id`) —
    // the element whose width the handle actually changes and whose size
    // `aria-valuenow` reports — not on the inner body region the collapse
    // toggle points at (that reference is about visibility, this one is about
    // size; see resize-handle.tsx).
    const leftPaneId = React.useId();
    const rightPaneId = React.useId();

    if (!isDesktop) {
      // One lookup in the consumer's own table — not a derivation: the app
      // decides which tab is active, the table says which pane that tab
      // shows. A tab pointing at a pane this workspace does not have (and an
      // id that is in no tab at all) falls back to the main area rather than
      // to a blank screen.
      const activePane = mobileTabs.find((tab) => tab.id === activeMobileTab)?.pane;
      const pane = activePane === "left" ? left : activePane === "right" ? right : undefined;

      return (
        <div
          ref={ref}
          className={cn(
            "flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden",
            className,
          )}
          {...props}
        >
          {pane ? (
            <aside
              aria-label={pane.label}
              className={cn(PANE_FILL, "bg-surface-container-lowest")}
              style={MOBILE_PANE_STYLE}
            >
              {pane.content}
            </aside>
          ) : (
            // The same `<main>` as the desktop branch — one per arrangement,
            // never two. When a *side* pane is the shown area there is no
            // `<main>` on screen at all: the main area is not in the tree, and
            // wrapping a `complementary` in `main` would be a worse lie than
            // its absence. The source implementation swaps the whole screen
            // the same way.
            // TODO: that a narrow screen showing a side pane has no `main`
            // landmark is a consequence, not a confirmed decision with the
            // design-system owner.
            <main aria-label={mainLabel} className={PANE_FILL} style={MOBILE_PANE_STYLE}>
              {children}
            </main>
          )}
          <BottomTabBar
            items={mobileTabs}
            activeId={activeMobileTab}
            onChange={onMobileTabChange}
            label={mobileTabBarLabel}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("flex h-full min-h-0 w-full flex-1 overflow-hidden", className)}
        {...props}
      >
        {left && (
          <>
            <SidePanel
              id={leftPaneId}
              side="left"
              isOpen={left.isOpen}
              width={left.width}
              onExpand={() => left.onOpenChange(true)}
              onCollapse={() => left.onOpenChange(false)}
              expandLabel={left.expandLabel}
              collapseLabel={left.collapseLabel}
              collapsedPreview={left.collapsedPreview}
              aria-label={left.label}
            >
              {left.content}
            </SidePanel>
            {/* No handle next to a collapsed pane: the rail is a fixed width,
                so a separator there would report a value with no visible
                effect. */}
            {left.isOpen && (
              <ResizeHandle
                side="left"
                value={left.width}
                min={left.minWidth}
                max={left.maxWidth}
                label={left.resizeLabel}
                controls={leftPaneId}
                onValueChange={left.onWidthChange}
              />
            )}
          </>
        )}

        {/* The page's one `main` landmark. This template is standalone (see
            the component doc), so nothing above it provides one. */}
        <main aria-label={mainLabel} className={PANE_FILL}>
          {children}
        </main>

        {right && showRight && (
          <>
            {right.isOpen && (
              <ResizeHandle
                side="right"
                value={right.width}
                min={right.minWidth}
                max={right.maxWidth}
                label={right.resizeLabel}
                controls={rightPaneId}
                onValueChange={right.onWidthChange}
              />
            )}
            <SidePanel
              id={rightPaneId}
              side="right"
              isOpen={right.isOpen}
              width={right.width}
              onExpand={() => right.onOpenChange(true)}
              onCollapse={() => right.onOpenChange(false)}
              expandLabel={right.expandLabel}
              collapseLabel={right.collapseLabel}
              collapsedPreview={right.collapsedPreview}
              aria-label={right.label}
            >
              {right.content}
            </SidePanel>
          </>
        )}
      </div>
    );
  },
);
WorkspaceLayout.displayName = "WorkspaceLayout";

export { WorkspaceLayout };
