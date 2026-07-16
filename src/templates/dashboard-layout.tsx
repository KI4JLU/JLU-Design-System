import * as React from "react";
import { Container } from "../components/container";
import { Grid } from "../components/grid";
import { PageHeader } from "../components/page-header";
import { cn } from "../lib/utils";

/**
 * Template „Dashboard": PageHeader (title/description/actions), an optional
 * `stats` row laid out in a responsive 4→2→1 grid, and free-form content
 * below. Rendered inside a Container with token page margins; meant to sit
 * inside AppShellLayout. Data fetching/aggregation stays with the consumer —
 * this only owns the skeleton.
 */
export interface DashboardLayoutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Page title. */
  title: React.ReactNode;
  /** Muted line under the title. */
  description?: React.ReactNode;
  /** Right-aligned header actions (e.g. time-range SegmentedControl). */
  actions?: React.ReactNode;
  /** KPI tiles — laid out in a responsive grid (4 columns on desktop). */
  stats?: React.ReactNode;
}

const DashboardLayout = React.forwardRef<HTMLDivElement, DashboardLayoutProps>(
  ({ className, title, description, actions, stats, children, ...props }, ref) => (
    <Container
      ref={ref}
      className={cn("flex flex-col gap-stack-lg py-gutter md:py-margin-page", className)}
      {...props}
    >
      <PageHeader title={title} description={description} actions={actions} />
      {stats && <Grid cols={4}>{stats}</Grid>}
      {children}
    </Container>
  ),
);
DashboardLayout.displayName = "DashboardLayout";

export { DashboardLayout };
