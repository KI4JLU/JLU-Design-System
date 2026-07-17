import * as React from "react";
import { AppShell } from "../components/app-shell";
import { Sidebar } from "../components/sidebar";

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
  /** Pinned bottom of the sidebar (user menu, ThemeToggle). */
  sidebarFooter?: React.ReactNode;
  /** Accessible name of the navigation landmark. */
  navLabel?: string;
}

const AppShellLayout = React.forwardRef<HTMLDivElement, AppShellLayoutProps>(
  ({ logo, nav, sidebarFooter, navLabel, children, ...props }, ref) => (
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
      {children}
    </AppShell>
  ),
);
AppShellLayout.displayName = "AppShellLayout";

export { AppShellLayout };
