import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Semantic data table — the shadcn part set, normalised onto JLU tokens.
 * Deliberately **no Radix**: Radix Primitives ships no table primitive and the
 * shadcn source imports only React + `cn` (verified against the file
 * `npx shadcn@latest add table` emitted). Native `<table>` markup already
 * carries the whole accessibility contract (HTML-AAM maps `table` → `table`,
 * `thead`/`tbody`/`tfoot` → `rowgroup`, `tr` → `row`, `th scope="col"` →
 * `columnheader`, `td` → `cell`, and `<caption>` supplies the table's
 * accessible name), so a JS layer on top could only take that away.
 *
 * `Table` brings its own horizontal scroll container, matching both the
 * shadcn shape and this repo's precedent that wide content scrolls in its own
 * container (`TableLayout`, the markdown table overrides in the consuming
 * apps). The container is a bare `<div>` with **no role and no tabindex**: an
 * element without a role is transparent to the accessibility tree, so the
 * table/rowgroup/row/columnheader/cell structure survives it intact. Giving it
 * `role="region"` would mint an extra landmark — APG warns against landmark
 * proliferation, and an unnamed region is discarded by most screen readers
 * anyway. Use `containerClassName` to reach that container (e.g. a bounded
 * height for a vertically scrolling table).
 */
export interface TableProps extends React.ComponentProps<"table"> {
  /**
   * Classes for the scroll container around the table (layout only, e.g.
   * `max-h-72` for a vertically scrolling table). The `<table>` itself is
   * styled through `className`.
   */
  containerClassName?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerClassName, ...props }, ref) => (
    <div className={cn("relative w-full overflow-x-auto", containerClassName)}>
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm text-on-surface",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<"thead">
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b [&_tr]:border-outline-variant", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<"tbody">
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<"tfoot">
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-outline-variant bg-surface-container font-medium [&>tr:last-child]:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.ComponentProps<"tr">>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-outline-variant transition-colors hover:bg-surface-container-high data-[state=selected]:bg-secondary-container",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

/**
 * Column header. `scope="col"` is the default and is what makes the cell a
 * `columnheader` rather than a bare `cell` — override it (`scope="row"`) only
 * for a row header.
 */
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<"th">
>(({ className, scope = "col", ...props }, ref) => (
  <th
    ref={ref}
    scope={scope}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium wrap-anywhere text-on-surface-variant",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<"td">
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-2 align-middle wrap-anywhere", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

/**
 * Table caption. `<caption>` must be the **first** child of `<table>` in the
 * DOM (HTML content model); `caption-bottom` on the table renders it below.
 * It supplies the table's accessible name, so a captioned table resolves via
 * `getByRole("table", { name })`.
 */
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.ComponentProps<"caption">
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-on-surface-variant", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
