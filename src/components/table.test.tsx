import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

/**
 * ORACLE — W3C HTML-AAM, "HTML Element Role Mappings", plus the ARIA accname
 * computation. Independent of this component: the mappings below are asserted
 * through Testing Library's `getByRole`, which resolves roles via aria-query /
 * dom-accessibility-api — a third-party implementation of those same specs.
 * Nothing in `table.tsx` ever names a role, so a passing `getByRole("row")`
 * can only come from the native element the component chose to render.
 *
 *   <table>            → role "table"
 *   <thead>/<tbody>/<tfoot> → role "rowgroup"
 *   <tr>               → role "row"
 *   <th scope="col">   → role "columnheader"
 *   <th scope="row">   → role "rowheader"
 *   <td>               → role "cell"
 *   <caption>          → accessible NAME of the table (name from content)
 *
 * The wrapper oracle is APG's landmark guidance + HTML-AAM's "no role" rule
 * for a generic <div>: an element without a role contributes nothing to the
 * accessibility tree, so wrapping the table must leave the tree identical and
 * must not mint a landmark.
 */

const COLUMNS = ["Name", "Schlüssel", "Erstellt", "Zuletzt genutzt"];
const ROWS = [
  ["Ingest-Pipeline", "jlu_a1b2", "01.02.2026", "gestern"],
  ["Eval-Runner", "jlu_c3d4", "14.03.2026", "vor 3 Tagen"],
];

const renderTable = (opts: { caption?: string; footer?: boolean } = {}) =>
  render(
    <Table>
      {opts.caption ? <TableCaption>{opts.caption}</TableCaption> : null}
      <TableHeader>
        <TableRow>
          {COLUMNS.map((c) => (
            <TableHead key={c}>{c}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row[0]}>
            {row.map((cell) => (
              <TableCell key={cell}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      {opts.footer ? (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={COLUMNS.length}>2 Schlüssel</TableCell>
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>,
  );

describe("Table — native semantics (HTML-AAM role mappings)", () => {
  it("exposes table / rowgroup / row / columnheader / cell", () => {
    renderTable();
    const table = screen.getByRole("table");
    // thead + tbody are two rowgroups; header row + 2 data rows = 3 rows.
    expect(within(table).getAllByRole("rowgroup")).toHaveLength(2);
    expect(within(table).getAllByRole("row")).toHaveLength(1 + ROWS.length);
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((el) => el.textContent),
    ).toEqual(COLUMNS);
    expect(within(table).getAllByRole("cell")).toHaveLength(
      ROWS.length * COLUMNS.length,
    );
  });

  it("counts <tfoot> as a third rowgroup and its colSpan cell as one cell", () => {
    renderTable({ footer: true });
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("rowgroup")).toHaveLength(3);
    // The footer adds one row and exactly one cell, spanning all columns.
    expect(within(table).getAllByRole("row")).toHaveLength(2 + ROWS.length);
    expect(within(table).getAllByRole("cell")).toHaveLength(
      ROWS.length * COLUMNS.length + 1,
    );
    expect(screen.getByRole("cell", { name: "2 Schlüssel" })).toHaveAttribute(
      "colspan",
      String(COLUMNS.length),
    );
  });

  it("makes TableHead a columnheader through scope=col, and scope=row a rowheader", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHead scope="row">Ingest-Pipeline</TableHead>
            <TableCell>aktiv</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    // Overriding scope flips the role — proof the role comes from the native
    // scope attribute, not from anything the component hardcodes.
    expect(screen.getByRole("rowheader", { name: "Ingest-Pipeline" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader")).toBeNull();
  });

  it("defaults scope to col so a header cell is announced as a column header", () => {
    renderTable();
    for (const el of screen.getAllByRole("columnheader")) {
      expect(el.tagName).toBe("TH");
      expect(el).toHaveAttribute("scope", "col");
    }
  });
});

describe("Table — accessible name from <caption>", () => {
  it("resolves the table by its caption text", () => {
    renderTable({ caption: "Zugriffsschlüssel" });
    expect(screen.getByRole("table", { name: "Zugriffsschlüssel" })).toBeInTheDocument();
  });

  it("has no accessible name when no caption is given", () => {
    renderTable();
    expect(screen.getByRole("table")).toHaveAccessibleName("");
  });

  it("renders the caption as a <caption> element inside the table", () => {
    renderTable({ caption: "Zugriffsschlüssel" });
    // HTML content model: <caption> is a child of <table>, not a sibling —
    // an accname sourced from a <div> outside the table would not be a caption.
    const caption = screen.getByRole("table", { name: "Zugriffsschlüssel" })
      .firstElementChild;
    expect(caption?.tagName).toBe("CAPTION");
  });
});

describe("Table — scroll container", () => {
  it("wraps the table in its own container without disturbing the a11y tree", () => {
    const { container } = renderTable({ caption: "Zugriffsschlüssel" });
    const table = screen.getByRole("table", { name: "Zugriffsschlüssel" });
    const wrapper = table.parentElement as HTMLElement;
    // A container exists between the table and the render root …
    expect(wrapper).not.toBe(container);
    expect(container).toContainElement(wrapper);
    // … and it is role-less and untabbable, so the accessibility tree is the
    // bare table structure (HTML-AAM: a generic <div> maps to no role).
    expect(wrapper).not.toHaveAttribute("role");
    expect(wrapper).not.toHaveAttribute("tabindex");
    // No landmark is minted (APG: avoid landmark proliferation).
    expect(within(container).queryAllByRole("region")).toHaveLength(0);
  });

  it("puts containerClassName on the container, never on the table", () => {
    render(
      <Table containerClassName="max-h-72" className="table-fixed">
        <TableBody>
          <TableRow>
            <TableCell>Zelle</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = screen.getByRole("table");
    // The bounded height belongs to the scroll port, otherwise a vertically
    // scrolling table (JustRAG's dashboard) is impossible to build.
    expect(table.parentElement).toHaveClass("max-h-72");
    expect(table).not.toHaveClass("max-h-72");
    expect(table).toHaveClass("table-fixed");
  });
});

describe("Table — arbitrary cell content (markdown tables)", () => {
  it("keeps interactive content inside a cell reachable by its own role", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>
              <a href="https://example.org">Quelle</a>
            </TableCell>
            <TableCell>
              <button type="button">Export</button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cells = screen.getAllByRole("cell");
    expect(cells).toHaveLength(2);
    expect(within(cells[0]).getByRole("link", { name: "Quelle" })).toBeInTheDocument();
    expect(within(cells[1]).getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("accepts raw <tr>/<td> children, as react-markdown emits them", () => {
    // A markdown renderer maps only some tags; the parts must not require
    // their own children types to keep the structure valid.
    render(
      <Table>
        <TableHeader>
          <tr>
            <th scope="col">Spalte</th>
          </tr>
        </TableHeader>
        <TableBody>
          <tr>
            <td>Wert</td>
          </tr>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("columnheader", { name: "Spalte" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Wert" })).toBeInTheDocument();
    expect(screen.getAllByRole("rowgroup")).toHaveLength(2);
  });
});
