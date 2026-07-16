import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Page title row: heading + optional description on the left, optional
 * actions (buttons, menus) on the right. Stacks vertically on mobile and
 * switches to the two-side row from md up. The heading uses the headline
 * type tokens (mobile size below md). Optional `children` render as a
 * full-width row below title/actions — meant for tabs or filter toolbars.
 */
export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Page title (rendered as <h1>). */
  title: React.ReactNode;
  /** Muted line under the title. */
  description?: React.ReactNode;
  /** Right-aligned action area (Buttons, DropdownMenus, …). */
  actions?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ className, title, description, actions, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn("flex flex-col gap-stack-md", className)}
      {...props}
    >
      <div className="flex flex-col gap-stack-sm md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-headline-md text-headline-md-mobile text-on-surface md:text-headline-md">
            {title}
          </h1>
          {description && (
            <p className="text-body-base text-on-surface-variant">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-stack-sm">{actions}</div>
        )}
      </div>
      {children}
    </header>
  ),
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
