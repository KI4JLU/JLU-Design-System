import * as React from "react";
import { AppShell, type AppShellProps } from "../components/app-shell";
import { Container } from "../components/container";
import { Sidebar } from "../components/sidebar";

/**
 * Template „App-Shell": the complete app chrome — branded sidebar (logo,
 * NavItems, pinned footer) plus responsive main area. Composes AppShell +
 * Sidebar; consuming apps only inject content into the slots and never
 * rebuild the frame. No business logic: routing/active state live in the
 * injected NavItems.
 */
export interface AppShellLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Pick<AppShellProps, "menuLabel" | "drawerLabel"> {
  /** Brand block — shown in the sidebar header and the mobile top bar. */
  logo: React.ReactNode;
  /** Navigation content, typically a list of <NavItem>s. */
  nav: React.ReactNode;
  /** Pinned bottom of the sidebar (user menu). */
  sidebarFooter?: React.ReactNode;
  /** Accessible name of the navigation landmark. */
  navLabel?: string;
  /** Current location (e.g. "Dashboard") — shown H1-sized and bold on the left of its own bar above the page content (same height as the sidebar's logo header). A `<p>`, never a heading: see the note in the render body. */
  pageLabel: React.ReactNode;
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
   * region's `justify-end`. „Centred" therefore means centred in the space
   * after the label, not in the viewport.
   *
   * Whatever goes in is **chrome**, like `pageLabel`: no heading element
   * belongs here. The page's heading is the content template's
   * (`docs/COMPONENT_GUIDELINES.md` → „Page headings: who owns them").
   */
  headerActions?: React.ReactNode;
}

const AppShellLayout = React.forwardRef<HTMLDivElement, AppShellLayoutProps>(
  (
    { logo, nav, sidebarFooter, navLabel, pageLabel, headerActions, children, ...props },
    ref,
  ) => (
    <AppShell
      ref={ref}
      topBar={logo}
      sidebar={
        <Sidebar header={logo} footer={sidebarFooter} label={navLabel}>
          {nav}
        </Sidebar>
      }
      {...props}
    >
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
              against a consumer's `@layer base` revert. */}
          <p className="m-0 font-headline-md text-headline-md-mobile font-bold text-on-surface md:text-headline-md">
            {pageLabel}
          </p>
          {/* Rendered only when filled, so an empty bar carries no stray box.
              `flex-1` hands the slot the space the label leaves (a search
              field needs it); `justify-end` keeps a single control against
              the right edge, where the hardcoded toggle used to sit. */}
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
