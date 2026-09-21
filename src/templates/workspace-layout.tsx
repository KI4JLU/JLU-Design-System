import * as React from "react";
import { AppShell, type AppShellPanel } from "../components/app-shell";
import { type MobilePaneTab, type PaneId } from "../lib/pane-layout";
import { cn } from "../lib/utils";

/**
 * Which of the three areas a mobile tab shows. An alias of the shared
 * `PaneId` (`lib/pane-layout.ts`), which `AppShell` uses for the
 * same arrangement — the name stays for the call sites that import it.
 */
export type WorkspacePaneId = PaneId;

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
 * A tab of the narrow-screen bar plus the pane it shows — an alias of the
 * shared `MobilePaneTab` (`lib/pane-layout.ts`), where the reasoning lives.
 * The mapping is **declared by the consumer**, not derived here.
 */
export type WorkspaceMobileTab = MobilePaneTab;

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

/**
 * Template „Workspace": the three-column workspace — `left` pane, main area,
 * `right` pane, each side pane collapsible to a rail and drag-resizable;
 * below `lg` exactly one area at a time plus a `BottomTabBar`. Since 0.37.0 it
 * renders `AppShell` (see below), which owns that composition; the app injects
 * content and the controlled pane state and never rebuilds the frame.
 *
 * **It IS an `AppShell` — without a bar** (0.37.0). Until 0.36.0 this
 * template composed `SidePanel` + `ResizeHandle` + `BottomTabBar` itself,
 * which was the same composition `AppShell` grew in 0.36.0 when it gained
 * `AppShellPanel.resize`; at that point the last real difference between the
 * two frames was gone and the duplication was the only thing left. So the
 * body below is a **mapping**, not a frame: `WorkspacePane` →
 * `AppShellPanel`, `minWidth`/`maxWidth`/`onWidthChange`/`resizeLabel` →
 * `resize`, no `topBar`. One mechanism, one set of arrangement rules, one
 * place where an accessibility fix lands.
 *
 * The export and `WorkspacePane` stay: they name the *case* („a workspace
 * screen: two panes, both resizable, no chrome bar"), which is worth a name
 * even when it is one call to the frame underneath.
 *
 * **Standalone — never inside `AppShellLayout`.** This template *is* the
 * chrome of its screen: its panes are the app's vertical chrome columns (the
 * source implementation frames both of them with its own `SidebarShell`, which
 * `SidePanel` replaces here), and it fills its parent, which an app gives the
 * viewport. Hung into `AppShellLayout` as `children` it therefore puts a
 * second sidebar next to the shell's nav column — two vertical chrome columns
 * on one screen, which is what the `InAppShell` story showed before it was
 * removed. The warning did not weaken when the frames became one: nesting is
 * now literally two `AppShell`s, i.e. two chrome column sets and two `<main>`
 * candidates. That is also why the main area is a `<main>` and not a
 * `<section>`: no shell above it contributes the page's `main` landmark, so
 * this template has to — it passes `mainLabel` down, and `AppShell` names its
 * `<main>` with it. Contrast `SectionedGridLayout`, which is page *content*
 * and genuinely is an `AppShellLayout` child — it stays a
 * `<section aria-label>` inside the shell's `<main>`. Two templates in this
 * library, opposite answers; the dividing question is „does this template own
 * the viewport or fill a slot".
 *
 * **Composition only.** No data fetching, no derivation, and since 0.37.0 no
 * state at all — not even „is this a desktop viewport", which `AppShell` now
 * asks. Pane open/width state and the current mobile tab live in the app
 * (typically one context, persisted), because a pane, its resize handle and
 * this template all have to read the same number.
 *
 * **The responsive split** — one area at a time plus a `BottomTabBar` below
 * `lg` — is `AppShell`'s, where the reasoning now lives: below `lg` a pane is
 * not a narrower version of itself (it fills the screen, ignores the collapse
 * state, and loses its collapse control), so the choice of arrangement cannot
 * be a media query and is taken once in JS. The consumer still writes no
 * breakpoint ladder: which pane a tab shows is data (`mobileTabs`), and which
 * tab is current is one controlled prop.
 *
 * **Hidden is not collapsed.** `showRight={false}` removes the right pane
 * from the desktop arrangement *without* touching `isOpen`, so the user's
 * collapse preference survives an app state that needs the width (the source
 * implementation had exactly this bug: it hid the pane by collapsing it, and
 * nobody expanded it again afterwards). Below `lg` the flag is deliberately
 * **not** consulted: hiding a pane buys horizontal space, panes do not
 * compete for space when only one is on screen, and a tab whose pane refuses
 * to appear would be a dead control. Omitting the `right` prop is the other
 * thing — then the pane does not exist at all, in either arrangement. The
 * rule is unchanged; since 0.37.0 it is implemented once, by `AppShell`'s own
 * `showRight`, on the frame that owns the arrangement.
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
    /*
      `WorkspacePane` → `AppShellPanel`, the whole of this template's body.

      Eight values are carried over verbatim; the four resize values become
      the one `resize` object, which is `AppShellPanel`'s all-or-nothing
      contract (a handle without bounds is not an APG splitter). A
      `WorkspacePane` always has all four — `minWidth`, `maxWidth`,
      `onWidthChange` and `resizeLabel` are required there — so the object is
      always built and every workspace pane stays drag-resizable, exactly as
      it was before 0.37.0.

      `header` and `footer` are not mapped: `WorkspacePane` has neither, and
      inventing them here would widen this template's API by the back door.
      A workspace that wants a pane title passes it inside `content`, as it
      always has; a screen that wants the shell's slots uses `AppShell`.
    */
    const toPanel = (pane: WorkspacePane): AppShellPanel => ({
      content: pane.content,
      label: pane.label,
      isOpen: pane.isOpen,
      onOpenChange: pane.onOpenChange,
      width: pane.width,
      expandLabel: pane.expandLabel,
      collapseLabel: pane.collapseLabel,
      collapsedPreview: pane.collapsedPreview,
      resize: {
        minWidth: pane.minWidth,
        maxWidth: pane.maxWidth,
        onWidthChange: pane.onWidthChange,
        label: pane.resizeLabel,
      },
    });

    return (
      <AppShell
        ref={ref}
        /* No `topBar`: a workspace screen has no chrome bar, and `AppShell`
           renders neither the row nor a `banner` landmark when it is
           omitted. That is the only structural difference between the two
           templates. */
        left={left && toPanel(left)}
        right={right && toPanel(right)}
        showRight={showRight}
        mainLabel={mainLabel}
        mobileTabs={mobileTabs}
        activeMobileTab={activeMobileTab}
        onMobileTabChange={onMobileTabChange}
        mobileTabBarLabel={mobileTabBarLabel}
        /* This template fills its PARENT (`h-full … flex-1`), while `AppShell`
           takes the viewport (`h-dvh`) — the one sizing difference between
           them, and the contract this template's stories and docs have had
           since 0.23.1 („the app gives it the viewport"). `cn` resolves the
           height utilities, so the consumer's own `className` still wins over
           both. */
        className={cn("h-full min-h-0 w-full flex-1", className)}
        {...props}
      >
        {children}
      </AppShell>
    );
  },
);
WorkspaceLayout.displayName = "WorkspaceLayout";

export { WorkspaceLayout };
