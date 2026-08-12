import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Structural navigation column: optional header (logo/brand), a scrollable
 * <nav> for NavItems, optional footer (user menu). Purely the column itself
 * — positioning, the right-hand border, and the mobile drawer behavior
 * belong to AppShell, so the same Sidebar node can be rendered in both
 * places.
 */
export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** Brand area above the navigation (logo, product name). */
  header?: React.ReactNode;
  /** Pinned area below the navigation (user menu). */
  footer?: React.ReactNode;
  /** Accessible name of the <nav> landmark. */
  label?: string;
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, header, footer, label = "Hauptnavigation", children, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        "flex h-full w-64 shrink-0 flex-col bg-surface-container-lowest",
        className,
      )}
      {...props}
    >
      {header && (
        <div className="flex h-16 items-center gap-stack-sm px-4">
          {header}
        </div>
      )}
      <nav
        aria-label={label}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-4"
      >
        {children}
      </nav>
      {footer && <div className="p-4">{footer}</div>}
    </aside>
  ),
);
Sidebar.displayName = "Sidebar";

export { Sidebar };
