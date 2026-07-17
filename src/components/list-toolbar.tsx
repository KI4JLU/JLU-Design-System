import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Responsive row above a list/card grid: a primary control (typically a
 * search `Input`) that grows to fill the width, and filter/sort controls
 * (typically one or more `FilterMenu`s) that wrap to their own row on
 * mobile. Pass as `DashboardLayout`'s `toolbar` prop, or use standalone.
 */
export interface ListToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary control — grows to fill available width, sits left on desktop. */
  search?: React.ReactNode;
  /** Filter/sort controls — right-aligned row on desktop, stacked full-width on mobile. */
  filters?: React.ReactNode;
}

const ListToolbar = React.forwardRef<HTMLDivElement, ListToolbarProps>(
  ({ className, search, filters, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col items-center justify-between gap-stack-sm lg:flex-row", className)}
      {...props}
    >
      {search && <div className="w-full lg:max-w-sm">{search}</div>}
      {filters && <div className="flex w-full gap-stack-sm lg:w-auto">{filters}</div>}
    </div>
  ),
);
ListToolbar.displayName = "ListToolbar";

export { ListToolbar };
