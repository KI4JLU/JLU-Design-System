import * as React from "react";
import { AppShell } from "../components/app-shell";
import { Container } from "../components/container";
import { Sidebar } from "../components/sidebar";
import { ThemeToggle } from "../components/theme-toggle";

/**
 * Template „App-Shell": the complete app chrome — branded sidebar (logo,
 * NavItems, pinned footer) plus responsive main area. Composes AppShell +
 * Sidebar; consuming apps only inject content into the slots and never
 * rebuild the frame. No business logic: routing/active state live in the
 * injected NavItems.
 */
export interface AppShellLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Brand block — shown in the sidebar header and the mobile top bar. */
  logo: React.ReactNode;
  /** Navigation content, typically a list of <NavItem>s. */
  nav: React.ReactNode;
  /** Pinned bottom of the sidebar (user menu). */
  sidebarFooter?: React.ReactNode;
  /** Accessible name of the navigation landmark. */
  navLabel?: string;
  /** Current location (e.g. "Dashboard") — shown H1-sized and bold on the left of its own bar above the page content (same height as the sidebar's logo header); a `ThemeToggle` sits on the right of that same bar. */
  pageLabel: React.ReactNode;
}

const AppShellLayout = React.forwardRef<HTMLDivElement, AppShellLayoutProps>(
  ({ logo, nav, sidebarFooter, navLabel, pageLabel, children, ...props }, ref) => (
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
        <Container className="flex items-center justify-between">
          <p className="font-headline-md text-headline-md-mobile font-bold text-on-surface md:text-headline-md">
            {pageLabel}
          </p>
          <ThemeToggle />
        </Container>
      </div>
      {children}
    </AppShell>
  ),
);
AppShellLayout.displayName = "AppShellLayout";

export { AppShellLayout };
