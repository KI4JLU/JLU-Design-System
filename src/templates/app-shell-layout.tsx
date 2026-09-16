import * as React from "react";
import { AppShell, type AppShellProps } from "../components/app-shell";
import { Container } from "../components/container";
import { Sidebar, type SidebarProps } from "../components/sidebar";

/**
 * Template „App-Shell": the complete app chrome — branded sidebar (logo,
 * NavItems, pinned footer) plus responsive main area. Composes AppShell +
 * Sidebar; consuming apps only inject content into the slots and never
 * rebuild the frame. No business logic: routing/active state live in the
 * injected NavItems.
 *
 * **The collapsible column is forwarded, not re-slotted.** `collapsed` /
 * `onCollapsedChange` (plus the two toggle labels) reach the internal
 * `Sidebar` unchanged, and the template mounts no control of its own. That is
 * deliberately *not* the `headerActions` pattern: a template opens a slot when
 * it would otherwise decide which control belongs in a chrome position it
 * owns, and the sidebar's toggle is not such a decision — `Sidebar` owns it
 * (0.27.0), because it must survive collapsing and it carries
 * `aria-expanded` + `aria-controls` pointing at a `<nav>` id that only
 * `Sidebar` knows (`useId`, per mount). A slot here could not be held to that
 * contract and could not reach that id. Everything the slot pattern exists to
 * protect is still true: omitting `onCollapsedChange` renders no toggle at
 * all, and `collapseLabel` / `expandLabel` make it localizable.
 */
export interface AppShellLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<AppShellProps, "menuLabel" | "drawerLabel">,
    // Forwarded verbatim, names included, exactly as `menuLabel`/`drawerLabel`
    // are: a consumer reading `Sidebar`'s documentation finds the same four
    // props here, and the descriptions in the Controls table cannot drift from
    // the component's. All four are optional and none changes behaviour by
    // default, so every existing call site renders exactly as before.
    Pick<
      SidebarProps,
      "collapsed" | "onCollapsedChange" | "collapseLabel" | "expandLabel"
    > {
  /** Brand block — shown in the sidebar header and the mobile top bar. */
  logo: React.ReactNode;
  /** Navigation content, typically a list of <NavItem>s. */
  nav: React.ReactNode;
  /** Pinned bottom of the sidebar (user menu). */
  sidebarFooter?: React.ReactNode;
  /** Accessible name of the navigation landmark. */
  navLabel?: string;
  /**
   * Current location (e.g. "Dashboard") — shown H1-sized and bold on the left
   * of its own bar above the page content (same height as the sidebar's logo
   * header). A `<p>`, never a heading: see the note in the render body.
   *
   * **Optional since 0.29.0.** Omitted (or falsy), the bar renders **no
   * element at all** for the label — not an empty `<p>`, which would still
   * occupy a flex slot and hold `headerActions` off centre. The case it opens
   * is a consumer whose content template already renders the page title
   * (`SectionedGridLayout` → `PageHeader`), where the label was the same
   * words a second time, stacked above the real heading.
   *
   * The bar itself stays either way: `h-16` / 64px with a label, with only
   * actions, with both, and with neither. It is chrome above the page
   * content, and consumers derive overlay offsets from that height (JustRAG's
   * `Toast.css`: `top: 76px` = 64 + 12), so a bar that collapsed when empty
   * would move their toasts, not just this template's markup.
   */
  pageLabel?: React.ReactNode;
  /**
   * Chrome controls in the page-label bar, right of `pageLabel`: a
   * `ThemeToggle`, a search field, several of them, or nothing. The template
   * renders **no** control of its own here — until 0.26.0 it hardcoded a
   * `<ThemeToggle />`, which a consumer could neither move, suppress,
   * localize nor address; deciding what belongs in an app's chrome bar is the
   * app's job, not the template's.
   *
   * The slot region takes the space the label leaves and aligns its content
   * to the right, so a single control sits exactly where the old toggle did.
   * Content that should fill or centre that space says so on its own element
   * (`className="w-full max-w-md"`, `mx-auto`) — auto margins beat the
   * region's `justify-end`. With a `pageLabel`, „centred" means centred in the
   * space after the label; **without one the region is the whole bar, so the
   * same two utilities centre the content in the bar** — measured in Chromium
   * to the pixel by the `WithCenteredSearchOnly` story, which is why this
   * needs no `centered` prop of its own.
   *
   * The classes must sit on the node that IS the flex item. Measured, and the
   * one way to get this wrong: `<Input leadingIcon={…} className="w-full
   * max-w-md mx-auto" />` puts them on the inner `<input>`, which an icon
   * field wraps in a full-width `<span>` — an inline-block box, where auto
   * margins compute to `0px` (measured: the field landed 207.5px left of the
   * bar's centre). Wrap such a field in your own
   * `<div className="w-full max-w-md mx-auto">` instead.
   *
   * Whatever goes in is **chrome**, like `pageLabel`: no heading element
   * belongs here. The page's heading is the content template's
   * (`docs/COMPONENT_GUIDELINES.md` → „Page headings: who owns them").
   */
  headerActions?: React.ReactNode;
}

const AppShellLayout = React.forwardRef<HTMLDivElement, AppShellLayoutProps>(
  (
    {
      logo,
      nav,
      sidebarFooter,
      navLabel,
      pageLabel,
      headerActions,
      collapsed,
      onCollapsedChange,
      collapseLabel,
      expandLabel,
      children,
      ...props
    },
    ref,
  ) => (
    <AppShell
      ref={ref}
      topBar={logo}
      sidebar={
        <Sidebar
          header={logo}
          footer={sidebarFooter}
          label={navLabel}
          collapsed={collapsed}
          onCollapsedChange={onCollapsedChange}
          collapseLabel={collapseLabel}
          expandLabel={expandLabel}
        >
          {nav}
        </Sidebar>
      }
      {...props}
    >
      {/* `h-16` is on the bar itself and not on its contents, so the bar is
          64px tall in all four states — label only, actions only, both,
          neither. That is deliberate and load-bearing outside this repo: a
          consumer positions overlays under the bar from that number
          (JustRAG's `Toast.css`, `top: 76px` = 64 + 12), so an empty bar that
          collapsed would be a breaking geometry change for a call site that
          changed nothing. */}
      <div className="flex h-16 items-center bg-surface-container-lowest">
        <Container className="flex items-center justify-between gap-4">
          {/* A `<p>`, deliberately, and not a heading: this bar is chrome —
              it names the current location, while the page's heading belongs
              to the content template hung in as `children` (see
              `docs/COMPONENT_GUIDELINES.md` → „Page headings: who owns
              them"). An `<h1>` here would collide with the one every content
              template already renders. The same is true of everything a
              consumer puts in `headerActions`: the slot is a second chrome
              location in the same bar, not a route around that rule. `m-0`
              pins the `<p>`'s user-agent margin (1em, measured in Chromium)
              against a consumer's `@layer base` revert.

              Rendered only when there IS a label (0.29.0) — and the test is
              truthiness, the same one `headerActions` below already uses, so
              `pageLabel={t('x')}` with an empty translation collapses too
              rather than leaving a blank slot. An empty `<p>` would still be
              a flex item: it has no width of its own here, but it would keep
              the actions region from starting at the bar's left edge, and
              „centred in the bar" would come out half the row's `gap-4` off
              — 8px, measured in Chromium by rendering this element
              unconditionally and watching `WithCenteredSearchOnly` fail at
              736.5 against a bar centre of 728.5. Omitting the element is
              what makes the label-less bar centre exactly. */}
          {pageLabel ? (
            <p className="m-0 font-headline-md text-headline-md-mobile font-bold text-on-surface md:text-headline-md">
              {pageLabel}
            </p>
          ) : null}
          {/* Rendered only when filled, so an empty bar carries no stray box.
              `flex-1` hands the slot the space the label leaves (a search
              field needs it); `justify-end` keeps a single control against
              the right edge, where the hardcoded toggle used to sit.

              With no label that space is the whole bar, and `flex-1` plus an
              `mx-auto` on the consumer's own node centres the content on the
              bar's centre — no `centered` prop, and nothing to switch on
              here: the same two classes do it, because what they centre in
              grew. */}
          {headerActions ? (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              {headerActions}
            </div>
          ) : null}
        </Container>
      </div>
      {children}
    </AppShell>
  ),
);
AppShellLayout.displayName = "AppShellLayout";

export { AppShellLayout };
