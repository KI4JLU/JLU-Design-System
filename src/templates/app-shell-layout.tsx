import * as React from "react";
import {
  AppShell,
  type AppShellPanel,
  type AppShellProps,
} from "../components/app-shell";
import { Container } from "../components/container";
import { useIsDesktop } from "../lib/pane-layout";

/**
 * Template „App-Shell": the complete app chrome — a branded, collapsible left
 * column (logo, NavItems, pinned footer), a three-region chrome bar above the
 * page content, and an optional right column. Composes `AppShell` (which
 * composes `SidePanel` + `BottomTabBar`); consuming apps only inject content
 * into the slots and never rebuild the frame. No business logic: routing and
 * active state live in the injected NavItems.
 *
 * **The nav column is a `SidePanel` since 0.30.0, not a `Sidebar`.** That is
 * the whole of the breaking change: the column collapses to the 60px rail
 * instead of an 80px icon column, its state is `leftOpen` (open = expanded)
 * instead of `collapsed` (the inverted spelling of the same thing), and the
 * narrow-screen drawer is gone. `Sidebar` is still exported for a standalone
 * nav column; this template no longer builds one.
 *
 * **The collapse control is still forwarded, not re-slotted.** `leftOpen` /
 * `onLeftOpenChange` plus the two toggle labels reach the column's own toggle,
 * and the template mounts no control of its own — the same reasoning 0.28.0
 * recorded for `Sidebar`'s toggle applies unchanged to `SidePanel`'s: it is
 * the only control that exists while the column is collapsed, and it carries
 * an `aria-expanded` + `aria-controls` contract pointing at an id only
 * `SidePanel` knows (`useId`, per mount). A slot here could not be held to
 * that contract and could not reach that id. What the slot pattern protects is
 * still true: the labels are props, so the control is localizable.
 *
 * **The bar has three regions** (0.30.0): `pageLabel` on the left, `search`
 * clamped to the **bar's** centre, `headerActions` on the right. The two side
 * regions are equal-width flex children (`flex-1 basis-0`), which is what
 * makes the centre region centred on the row rather than in the space the
 * label leaves — the difference to 0.29.0's `mx-auto` recipe, which centred
 * the content of `headerActions` only when there was no label at all. The
 * row's height is `AppShell`'s: 64px in every state.
 */
export interface AppShellLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    // Forwarded verbatim, names included: a consumer reading `AppShell`'s
    // documentation finds the same four props here, and the descriptions in
    // the Controls table cannot drift from the component's. All four are
    // required there and stay required here — below `lg` the shell shows one
    // area at a time, and without tabs the nav column would be unreachable.
    Pick<
      AppShellProps,
      "mobileTabs" | "activeMobileTab" | "onMobileTabChange" | "mobileTabBarLabel"
    > {
  /** Brand block — shown in the left column's header row and in the narrow-screen bar. */
  logo: React.ReactNode;
  /** Navigation content, typically a list of <NavItem>s. */
  nav: React.ReactNode;
  /** Pinned bottom of the left column (user menu). */
  sidebarFooter?: React.ReactNode;
  /** Accessible name of the navigation landmark, and of the column around it. */
  navLabel?: string;
  /**
   * Current location (e.g. "Dashboard") — shown H1-sized and bold on the left
   * of the chrome bar. A `<p>`, never a heading: see the note in the render
   * body.
   *
   * **Optional since 0.29.0.** Omitted (or falsy), the bar renders **no
   * element at all** for the label — the region that holds it stays, because
   * since 0.30.0 it is that empty region which keeps `search` centred on the
   * row.
   *
   * The bar itself stays either way: `h-16` / 64px with a label, with only
   * actions, with both, and with neither. It is chrome above the page content,
   * and consumers derive overlay offsets from that height (JustRAG's
   * `Toast.css`: `top: 76px` = 64 + 12), so a bar that collapsed when empty
   * would move their toasts, not just this template's markup.
   */
  pageLabel?: React.ReactNode;
  /**
   * The bar's **centre** region (0.30.0) — a search field, clamped to
   * `max-w-md` and centred on the bar itself, with or without a `pageLabel`.
   *
   * It exists because "centred" could not be expressed from the outside: the
   * 0.29.0 recipe (`w-full max-w-md mx-auto` inside `headerActions`) centres
   * the content in *the space the label leaves*, so it only looked right when
   * there was no label. A search field that shifts sideways when the page name
   * changes is the bug that recipe could not avoid. Pass the node itself; the
   * template supplies the width cap and the centring.
   *
   * Chrome, like `pageLabel` and `headerActions`: no heading element belongs
   * here.
   */
  search?: React.ReactNode;
  /**
   * Chrome controls at the **right** end of the bar: a `ThemeToggle`, a menu,
   * several of them, or nothing. The template renders **no** control of its
   * own here — until 0.26.0 it hardcoded a `<ThemeToggle />`, which a consumer
   * could neither move, suppress, localize nor address; deciding what belongs
   * in an app's chrome bar is the app's job, not the template's.
   *
   * Below `lg` this region is rendered next to the `logo` in the narrow bar,
   * so the app's chrome controls stay reachable when the wide bar's other two
   * regions are gone. `search` is not: a `max-w-md` field centred on a 360px
   * bar has no room to be centred in, and an app that needs search on a narrow
   * screen owns that decision (a compact control in `headerActions`, or a tab
   * of its own).
   *
   * Whatever goes in is **chrome**, like `pageLabel`: no heading element
   * belongs here. The page's heading is the content template's
   * (`docs/COMPONENT_GUIDELINES.md` → „Page headings: who owns them").
   */
  headerActions?: React.ReactNode;
  /**
   * The left column is expanded (`true`) or collapsed to the rail (`false`).
   *
   * **Replaces 0.28.0's `collapsed`, and means the opposite of it** —
   * `leftOpen={true}` is `collapsed={false}`. The name follows `SidePanel`'s
   * `isOpen` and `WorkspacePane`'s, so the three frames in this library spell
   * one state one way. Required and controlled, with no `defaultOpen`: a
   * column width is exactly the kind of value an app persists per user, and a
   * default here would be a second truth next to it.
   */
  leftOpen: boolean;
  /** The toggle was pressed; carries the REQUESTED state, never the old one. */
  onLeftOpenChange: (isOpen: boolean) => void;
  /** Accessible name of the toggle while expanded. Default "Navigation einklappen". */
  collapseLabel?: string;
  /** Accessible name of the toggle while collapsed. Default "Navigation ausklappen". */
  expandLabel?: string;
  /**
   * An optional second column on the right (details, sources, help), passed
   * whole — `AppShell`'s own `AppShellPanel`, not re-spelled as six props. The
   * shell renders no right column when it is omitted: no rail, no landmark.
   */
  rightPanel?: AppShellPanel;
}

const AppShellLayout = React.forwardRef<HTMLDivElement, AppShellLayoutProps>(
  (
    {
      logo,
      nav,
      sidebarFooter,
      navLabel = "Hauptnavigation",
      pageLabel,
      search,
      headerActions,
      leftOpen,
      onLeftOpenChange,
      collapseLabel = "Navigation einklappen",
      expandLabel = "Navigation ausklappen",
      rightPanel,
      mobileTabs,
      activeMobileTab,
      onMobileTabChange,
      mobileTabBarLabel,
      children,
      ...props
    },
    ref,
  ) => {
    // The same hook, the same boundary and the same reason as `AppShell`'s own
    // branch (`lib/pane-layout.ts`): what belongs in the chrome bar is not a
    // narrower version of itself below `lg` — the wide bar's three regions are
    // a different composition, not the same one with utilities on top.
    const isDesktop = useIsDesktop();

    /* A `<p>`, deliberately, and not a heading: this bar is chrome — it names
       the current location, while the page's heading belongs to the content
       template hung in as `children` (see `docs/COMPONENT_GUIDELINES.md` →
       „Page headings: who owns them"). An `<h1>` here would collide with the
       one every content template already renders. The same is true of
       everything a consumer puts in `search` or `headerActions`: they are two
       further chrome locations in the same bar, not a route around that rule.
       `m-0` pins the `<p>`'s user-agent margin (1em, measured in Chromium)
       against a consumer's `@layer base` revert.

       Rendered only when there IS a label (0.29.0) — the test is truthiness,
       the same one the other two regions use, so `pageLabel={t('x')}` with an
       empty translation renders nothing rather than a blank slot. `truncate`
       is new in 0.30.0 and belongs to the three-region bar: the label's region
       is one of two equal halves, so a label longer than its half has to clip
       instead of pushing the centred `search` off the bar's centre. The
       accessible text is unchanged — clipping is visual. */
    const label = pageLabel ? (
      <p className="m-0 truncate font-headline-md text-headline-md-mobile font-bold text-on-surface md:text-headline-md">
        {pageLabel}
      </p>
    ) : null;

    /* The narrow bar's right-hand region — the wide bar builds its own below,
       because there the region has to exist even when empty. Rendering
       `headerActions` in BOTH bars is the point: an app's chrome controls must
       not disappear at a breakpoint. `gap-2` keeps several of them apart,
       `justify-end` pins a single one to the right edge, where the hardcoded
       toggle used to sit. Omitted, nothing is rendered at all. */
    const actions = headerActions ? (
      <div className="flex min-w-0 items-center justify-end gap-2">{headerActions}</div>
    ) : null;

    /* The wide bar: three regions.

       The two side regions are `flex-1 basis-0` and are rendered whether or
       not they have content — that is the mechanism, not an oversight. Equal
       flex on both sides gives the centre region the row's exact middle,
       independent of how wide the label or the actions are; an omitted region
       would hand its space to the other side and move the centre by half of
       it. (0.29.0 had the opposite rule for the opposite reason: with a single
       `mx-auto` region, an empty `<p>` next to it shifted the centring by half
       the row's `gap-4` — measured, 8px. Both facts are about the same bar,
       one about elements with content, this one about the regions that hold
       them; an empty region carries no text and no box of its own.)

       `max-w-md` caps the centre at 28rem, so it stays a search field rather
       than a full-width bar, and `min-w-0` lets it shrink before the row
       overflows. */
    const wideBar = (
      <Container className="flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center">{label}</div>
        {search ? <div className="w-full max-w-md min-w-0">{search}</div> : null}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {headerActions}
        </div>
      </Container>
    );

    /* Is the nav being rendered as the rail's icon strip rather than as the
       column body? `isDesktop &&`, not `!leftOpen` alone: below `lg` the shown
       column IS the screen and deliberately ignores the collapse state (there
       is no rail and no toggle there), so a stored "minimised" must not empty
       it. Without the guard a user who had minimised the column on a desktop
       got a narrow screen whose navigation tab showed nothing at all. */
    const railNav = isDesktop && !leftOpen;

    /* The narrow bar: brand, plus whatever chrome controls the app placed. No
       burger button — there is no drawer to open since 0.30.0; the areas are
       reached through the `BottomTabBar` the shell renders. */
    const narrowBar = (
      <Container className="flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center">{logo}</div>
        {actions}
      </Container>
    );

    return (
      <AppShell
        ref={ref}
        topBar={isDesktop ? wideBar : narrowBar}
        left={{
          /* THE NAV MOVES INTO THE RAIL WHEN THE COLUMN COLLAPSES; it is not
             rendered in both places, and it is not dropped.
 
             `SidePanel` hides its whole BODY in the rail — deliberately, so a
             pane's scroll position and half-typed input survive a collapse —
             and the nav is the body. Left at that, minimising the column would
             hide the navigation outright rather than shrink it to icons, which
             is what `Sidebar`'s 80px column did before 0.30.0 and what an app
             persisting "sidebar minimised" means by it.
 
             So the SAME node is handed to `content` while open and to
             `collapsedPreview` while collapsed. Two copies would have been the
             easy shape and are the wrong one: a second mount duplicates every
             `id` and every `aria-current` a consumer put in a `NavItem` — the
             exact failure the drawer's removal fixed in this release. Moving it
             costs the nav's own scroll position across a collapse, the same
             trade `footer` makes, and a nav column has far less to lose than a
             pane body.
 
             `NavItem` shrinks itself: `SidePanel` publishes the collapsed state
             on `SidebarCollapsedContext`, so the rows in the rail are the
             icon-only form with their label on `aria-label`.
 
             `nav` keeps its own `<nav aria-label>` landmark in both positions,
             exactly as it had inside `Sidebar`; the column around it is the
             `complementary` landmark `SidePanel` renders, named by the same
             string so a screen-reader user meets one name for one column. */
          content: railNav ? null : (
            <nav aria-label={navLabel} className="flex flex-col gap-2 p-4">
              {nav}
            </nav>
          ),
          collapsedPreview: !railNav ? undefined : (
            // No horizontal padding: the rail is 60px and already centres its
            // children, so the rows get the full width to sit an icon in.
            <nav aria-label={navLabel} className="flex w-full flex-col items-center gap-2">
              {nav}
            </nav>
          ),
          header: logo,
          footer: sidebarFooter ? <div className="p-4">{sidebarFooter}</div> : undefined,
          label: navLabel,
          isOpen: leftOpen,
          onOpenChange: onLeftOpenChange,
          collapseLabel,
          expandLabel,
        }}
        right={rightPanel}
        mobileTabs={mobileTabs}
        activeMobileTab={activeMobileTab}
        onMobileTabChange={onMobileTabChange}
        mobileTabBarLabel={mobileTabBarLabel}
        {...props}
      >
        {children}
      </AppShell>
    );
  },
);
AppShellLayout.displayName = "AppShellLayout";

export { AppShellLayout };
