import * as React from "react";
import { Container } from "../components/container";
import { Grid } from "../components/grid";
import { PageHeader } from "../components/page-header";
import { cn } from "../lib/utils";
import { type HeadingLevel } from "../lib/heading-level";

/**
 * Template „Dashboard": an optional `toolbar` row (search/filter, e.g.
 * `ListToolbar`) first, then PageHeader (title/description/actions), an
 * optional `stats` row laid out in a responsive 4→2→1 grid, and free-form
 * content below. Rendered inside a Container with token page margins; meant
 * to sit inside AppShellLayout. Data fetching/aggregation stays with the
 * consumer — this only owns the skeleton.
 */
export interface DashboardLayoutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Page title. Rendered as a real heading by `PageHeader`. */
  title: React.ReactNode;
  /**
   * Level of `title` in the document outline, `1`–`6`. Defaults to
   * `PageHeader`'s `1`, i.e. an `<h1>` — unchanged for every existing call
   * site. Pass `2` when this page is nested in a frame that already owns the
   * `<h1>` (an admin shell, a CMS page); see
   * `docs/COMPONENT_GUIDELINES.md` → „Page headings: who owns them".
   */
  headingLevel?: HeadingLevel;
  /** Muted line under the title. */
  description?: React.ReactNode;
  /** Right-aligned header actions (e.g. time-range SegmentedControl). */
  actions?: React.ReactNode;
  /** Search/filter row above the title (e.g. a `ListToolbar`). */
  toolbar?: React.ReactNode;
  /** KPI tiles — laid out in a responsive grid (4 columns on desktop). */
  stats?: React.ReactNode;
}

const DashboardLayout = React.forwardRef<HTMLDivElement, DashboardLayoutProps>(
  (
    {
      className,
      title,
      headingLevel,
      description,
      actions,
      toolbar,
      stats,
      children,
      ...props
    },
    ref,
  ) => (
    <Container
      ref={ref}
      className={cn("flex flex-col gap-stack-lg py-gutter md:py-margin-page", className)}
      {...props}
    >
      {toolbar}
      {/* `headingLevel` is forwarded, not defaulted here: `PageHeader` owns
          the default (1) so there is one place to read it off. */}
      <PageHeader
        title={title}
        headingLevel={headingLevel}
        description={description}
        actions={actions}
      />
      {stats && <Grid cols={4}>{stats}</Grid>}
      {children}
    </Container>
  ),
);
DashboardLayout.displayName = "DashboardLayout";

export { DashboardLayout };
