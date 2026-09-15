import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShellLayout } from "./app-shell-layout";
import { AuthLayout } from "./auth-layout";
import { ChatLayout } from "./chat-layout";
import { DashboardLayout } from "./dashboard-layout";
import { FormLayout } from "./form-layout";
import { SectionedGridLayout, type SectionedGridSection } from "./sectioned-grid-layout";
import { TableLayout } from "./table-layout";
import { WorkspaceLayout } from "./workspace-layout";
import { PageHeader } from "../components/page-header";
import { ThemeToggle } from "../components/theme-toggle";
import { ThemeProvider } from "../theme/ThemeContext";

/**
 * „Who owns the page heading" — the rule in `docs/COMPONENT_GUIDELINES.md`,
 * asserted once for all eight templates instead of per file, because the point
 * of the rule is that it is **one** rule.
 *
 * Oracles, all of them outside the code under test:
 *
 * 1. **The accessibility tree, computed by aria-query +
 *    dom-accessibility-api** (through Testing Library's
 *    `getAllByRole("heading", { level })`). `heading` and its `level` come
 *    from the ARIA in HTML mapping of `h1`–`h6`, not from anything this
 *    library writes: no test below reads a tag name or a class name, so a
 *    template could not satisfy them by looking like a heading.
 * 2. **WCAG 1.3.1 / the HTML outline** — a page has exactly one top-level
 *    heading, and levels do not skip. That is the property the „nested in a
 *    page that already has an `<h1>`" case checks, and it is the defect this
 *    card was opened for: a consumer's admin frame renders the `<h1>`, the
 *    template rendered a second one.
 * 3. **The frozen per-template default table** on the card and in
 *    COMPONENT_GUIDELINES. Two apps ship against these defaults, so „what a
 *    consumer passing no new prop gets" is asserted explicitly for every
 *    template — including the three that must contribute **no** heading, and
 *    `AuthLayout`, whose title is deliberately *not* a heading by default.
 *
 * `matchMedia` is stubbed for `ThemeProvider` (it reads
 * `prefers-color-scheme`) and for `WorkspaceLayout` (it reads
 * `--breakpoint-lg`); jsdom implements neither.
 */
function stubMatchMedia(matches = false) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

/** Every heading in the document, as „level: accessible name" pairs. */
function outline(): string[] {
  return screen
    .getAllByRole("heading")
    .map((heading) => `${heading.getAttribute("aria-level") ?? heading.tagName[1]}: ${heading.textContent}`);
}

const SECTIONS: SectionedGridSection[] = [
  {
    id: "own",
    title: "Eigene",
    isOpen: true,
    onOpenChange: () => {},
    items: <div>Karte</div>,
  },
  {
    id: "shared",
    title: "Geteilte",
    isOpen: false,
    onOpenChange: () => {},
    emptyState: "Nichts hier",
  },
];

describe("the page-heading rule — defaults every consumer already ships against", () => {
  it("PageHeader renders the title as a level-1 heading", () => {
    render(<PageHeader title="Elemente" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Elemente");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("DashboardLayout keeps its <h1>", () => {
    render(<DashboardLayout title="Statistiken">Inhalt</DashboardLayout>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Statistiken");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("FormLayout keeps its <h1>", () => {
    render(<FormLayout title="Widget anlegen">Felder</FormLayout>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Widget anlegen");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("TableLayout keeps its <h1>", () => {
    render(<TableLayout title="Zugriffsschlüssel">Tabelle</TableLayout>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Zugriffsschlüssel");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("SectionedGridLayout keeps <h1> for the page and <h2> for every section", () => {
    render(<SectionedGridLayout label="Übersicht" title="Wissensbasen" sections={SECTIONS} />);
    expect(outline()).toEqual(["1: Wissensbasen", "2: Eigene", "2: Geteilte"]);
  });

  it("SectionedGridLayout without a title keeps its sections at level 2, because the page's <h1> is then the app's", () => {
    render(<SectionedGridLayout label="Übersicht" sections={SECTIONS} />);
    expect(outline()).toEqual(["2: Eigene", "2: Geteilte"]);
  });

  it("AuthLayout contributes NO heading by default — the title stays styled text", () => {
    render(
      <AuthLayout title="Anmelden" description="Melden Sie sich an">
        Formular
      </AuthLayout>,
    );
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
    // The text is on screen, it is simply not in the outline.
    expect(screen.getByText("Anmelden")).toBeInTheDocument();
  });

  it("AppShellLayout's pageLabel is chrome, not the page heading", () => {
    stubMatchMedia();
    render(
      <ThemeProvider>
        <AppShellLayout logo="Marke" nav="Navigation" pageLabel="Dashboard">
          Inhalt
        </AppShellLayout>
      </ThemeProvider>,
    );
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("AppShellLayout's headerActions is chrome too — filling it adds no heading", () => {
    stubMatchMedia();
    render(
      <ThemeProvider>
        <AppShellLayout
          logo="Marke"
          nav="Navigation"
          pageLabel="Dashboard"
          headerActions={<ThemeToggle />}
        >
          Inhalt
        </AppShellLayout>
      </ThemeProvider>,
    );
    // The slot added in 0.26.0 is a second chrome location in the same bar,
    // not a route around the rule: the template still contributes no heading,
    // so the content template hung in as `children` keeps the only <h1>.
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
    expect(screen.getByRole("group", { name: "Farbschema" })).toBeInTheDocument();
  });

  it("ChatLayout contributes no heading — its header is a free-form slot", () => {
    render(
      <ChatLayout header={<span>Bot</span>} composer={<span>Eingabe</span>}>
        Nachrichten
      </ChatLayout>,
    );
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
  });

  it("WorkspaceLayout contributes no heading", () => {
    stubMatchMedia(true);
    render(
      <WorkspaceLayout
        mainLabel="Arbeitsfläche"
        mobileTabs={[{ id: "main", label: "Chat", icon: null, pane: "main" }]}
        activeMobileTab="main"
        onMobileTabChange={() => {}}
        mobileTabBarLabel="Bereiche"
      >
        Inhalt
      </WorkspaceLayout>,
    );
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
  });
});

describe("the page-heading rule — headingLevel is the call site's decision", () => {
  it("moves PageHeader's title to the level it is given", () => {
    render(<PageHeader title="Elemente" headingLevel={3} />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveAccessibleName("Elemente");
    expect(screen.queryAllByRole("heading", { level: 1 })).toHaveLength(0);
  });

  it.each([
    ["DashboardLayout", (level: 2) => <DashboardLayout title="T" headingLevel={level} />],
    ["FormLayout", (level: 2) => <FormLayout title="T" headingLevel={level} />],
    ["TableLayout", (level: 2) => <TableLayout title="T" headingLevel={level} />],
  ])("%s forwards headingLevel to its PageHeader", (_name, renderTemplate) => {
    render(renderTemplate(2));
    expect(screen.getByRole("heading", { level: 2 })).toHaveAccessibleName("T");
    expect(screen.queryAllByRole("heading", { level: 1 })).toHaveLength(0);
  });

  it("moves SectionedGridLayout's page title AND its sections together", () => {
    render(
      <SectionedGridLayout
        label="Übersicht"
        title="Wissensbasen"
        headingLevel={2}
        sections={SECTIONS}
      />,
    );
    expect(outline()).toEqual(["2: Wissensbasen", "3: Eigene", "3: Geteilte"]);
  });

  it("clamps SectionedGridLayout's section headings at 6 rather than inventing an h7", () => {
    render(
      <SectionedGridLayout
        label="Übersicht"
        title="Wissensbasen"
        headingLevel={6}
        sections={SECTIONS}
      />,
    );
    expect(outline()).toEqual(["6: Wissensbasen", "6: Eigene", "6: Geteilte"]);
  });

  it("lets AuthLayout own the heading when asked, keeping the card typography", () => {
    render(
      <AuthLayout title="Anmelden" headingLevel={1}>
        Formular
      </AuthLayout>,
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveAccessibleName("Anmelden");
    // The typography still comes from CardTitle, not from a copy at the call
    // site — asserted through the class CardTitle owns, because the *point*
    // of routing through `asChild` is that the look does not move.
    expect(heading).toHaveClass("font-headline-md");
  });
});

describe("the page-heading rule — a template nested in a page that already has an <h1>", () => {
  it("gives the JustRAG situation exactly one level-1 heading", () => {
    // The reproduction of the shipped defect: an admin frame renders the
    // page's <h1>, the template is a section of that page. Before
    // `headingLevel` the template forced a second <h1> and the page had two.
    render(
      <div>
        <h1>Administration</h1>
        <DashboardLayout title="Systemzustand" headingLevel={2}>
          Inhalt
        </DashboardLayout>
      </div>,
    );
    expect(outline()).toEqual(["1: Administration", "2: Systemzustand"]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("still produces two level-1 headings when the call site does not say so — the prop is the fix, not a guess by the template", () => {
    render(
      <div>
        <h1>Administration</h1>
        <DashboardLayout title="Systemzustand">Inhalt</DashboardLayout>
      </div>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(2);
  });
});
