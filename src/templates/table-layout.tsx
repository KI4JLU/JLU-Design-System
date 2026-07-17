import * as React from "react";
import { Card } from "../components/card";
import { Container } from "../components/container";
import { PageHeader } from "../components/page-header";
import { cn } from "../lib/utils";

/**
 * Template „Tabellen/Admin": PageHeader with actions, a Card holding an
 * optional toolbar (search/filter), the table itself as `children` in a
 * horizontally scrollable region (wide tables never break the page), and an
 * optional footer (pagination). Sorting/filtering/pagination logic stays
 * with the consumer — this only owns the skeleton.
 */
export interface TableLayoutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Page title. */
  title: React.ReactNode;
  /** Muted line under the title. */
  description?: React.ReactNode;
  /** Right-aligned header actions (e.g. „Neu anlegen"). */
  actions?: React.ReactNode;
  /** Filter/search row above the table, inside the card. */
  toolbar?: React.ReactNode;
  /** Row below the table (pagination, result count). */
  footer?: React.ReactNode;
}

const TableLayout = React.forwardRef<HTMLDivElement, TableLayoutProps>(
  (
    { className, title, description, actions, toolbar, footer, children, ...props },
    ref,
  ) => (
    <Container
      ref={ref}
      className={cn("flex flex-col gap-gutter py-gutter md:py-margin-page", className)}
      {...props}
    >
      <PageHeader title={title} description={description} actions={actions} />
      <Card>
        {toolbar && (
          <div className="flex flex-wrap items-center gap-stack-sm border-b border-outline-variant p-4">
            {toolbar}
          </div>
        )}
        <div className="overflow-x-auto">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-between gap-stack-sm border-t border-outline-variant p-4">
            {footer}
          </div>
        )}
      </Card>
    </Container>
  ),
);
TableLayout.displayName = "TableLayout";

export { TableLayout };
