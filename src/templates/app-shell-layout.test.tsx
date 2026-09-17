import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Home, LayoutDashboard } from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import { DropdownMenuItem } from "../components/dropdown-menu";
import { Input } from "../components/input";
import { NavItem } from "../components/nav-item";
import { SidebarUserMenu } from "../components/sidebar-user-menu";
import { ThemeToggle } from "../components/theme-toggle";
import { ThemeProvider } from "../theme/ThemeContext";
import type { MobilePaneTab } from "../lib/pane-layout";

/**
 * `AppShellLayout` after 0.30.0. The suites about the drawer and about
 * `collapsed`/`onCollapsedChange` are **rewritten**, not adjusted: the drawer
 * does not exist any more, and the state it described is now `leftOpen`, with
 * the opposite meaning, on a `SidePanel` column.
 *
 * Oracles, all outside the code under test:
 *
 * 1. **The accessibility tree**, computed by aria-query +
 *    dom-accessibility-api through Testing Library's `getByRole`. `banner`,
 *    `complementary`, `navigation`, `group`, `searchbox` and `button` with
 *    their accessible names come from the ARIA in HTML mapping, not from
 *    anything this template writes; no assertion below reads a class name.
 * 2. **`Node.compareDocumentPosition`** for the order of the bar's three
 *    regions — the DOM's own answer, and the order a keyboard user meets.
 *    *Where* the centre region sits on the screen is measured in Chromium by
 *    `app-shell-layout.stories.tsx` (`WithCenteredSearch`), because jsdom
 *    applies no stylesheet and every box is 0×0.
 * 3. **`ThemeToggle`'s own published defaults** — „Farbschema", „Helles
 *    Design", „Systemdesign", „Dunkles Design" (DESIGN_SYSTEM.md §4, asserted
 *    independently in `theme-toggle.test.tsx`). They are the contract of a
 *    *different* component, which is what makes them usable here as the
 *    fingerprint of „the template mounted a toggle".
 * 4. **`SidePanel`'s disclosure contract** (`aria-expanded` + `aria-controls`)
 *    and **React's controlled-component contract**: the column re-renders only
 *    from the `leftOpen` it is given, so the round trip below goes through
 *    consumer state.
 * 5. **The two shipped call sites** (JustRAG `AppChrome.tsx`, CampusAgents
 *    `AppLayout.tsx`, both read 2026-09-17), which is why the labelled bar and
 *    the German toggle defaults are re-asserted next to the new behaviour.
 *
 * jsdom implements neither `matchMedia` (which `useIsDesktop` and
 * `ThemeProvider` both ask) nor layout, so the viewport is stubbed per test.
 * The stub answers the library's `lg` query and nothing else, so
 * `prefers-color-scheme` still resolves to „no".
 */

function stubViewport(isDesktop: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: isDesktop && query === "(min-width: 64rem)",
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

beforeEach(() => stubViewport(true));
afterEach(() => vi.unstubAllGlobals());

const TABS: MobilePaneTab[] = [
  { id: "nav", icon: <Home />, label: "Bereiche", pane: "left" },
  { id: "page", icon: <LayoutDashboard />, label: "Seite", pane: "main" },
];

/** Every required prop of 0.30.0, so a test names only what it is about. */
function renderLayout(props: Partial<ComponentProps<typeof AppShellLayout>> = {}) {
  return render(
    <AppShellLayout
      logo="Marke"
      nav="Navigationsinhalt"
      leftOpen
      onLeftOpenChange={() => {}}
      mobileTabs={TABS}
      activeMobileTab="page"
      onMobileTabChange={() => {}}
      mobileTabBarLabel="Bereichswechsel"
      {...props}
    >
      Inhalt
    </AppShellLayout>,
  );
}

/** The chrome bar: the shell's one `banner` landmark. */
const bar = () => screen.getByRole("banner");

/** `true` when `a` precedes `b` in document order. */
function precedes(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

const GERMAN_DEFAULT_NAMES = [
  "Farbschema",
  "Helles Design",
  "Systemdesign",
  "Dunkles Design",
];

function renderWithActions(headerActions?: ReactNode) {
  return render(
    <ThemeProvider>
      <AppShellLayout
        logo="Marke"
        nav="Navigationsinhalt"
        pageLabel="Dashboard"
        headerActions={headerActions}
        leftOpen
        onLeftOpenChange={() => {}}
        mobileTabs={TABS}
        activeMobileTab="page"
        onMobileTabChange={() => {}}
        mobileTabBarLabel="Bereichswechsel"
      >
        Inhalt
      </AppShellLayout>
    </ThemeProvider>,
  );
}

describe("AppShellLayout — the chrome bar's actions region", () => {
  it("renders NO control of its own when the slot is empty (BREAKING, 0.26.0)", () => {
    renderWithActions();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    for (const name of GERMAN_DEFAULT_NAMES) {
      expect(screen.queryByRole("group", { name })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });

  it("no longer needs a ThemeProvider of its own", () => {
    // Side effect of the slot, and a documented consumer complaint (KI-778):
    // the shell used to mount a `ThemeToggle`, which calls `useTheme`, so an
    // app that had never mounted `ThemeProvider` learned about the dependency
    // from a runtime throw — "useTheme must be used within a ThemeProvider"
    // (`theme/ThemeContext.tsx`) — raised by a template whose props say
    // nothing about theming. Oracle: that error, owned by a different module;
    // the shell is rendered here with NO provider anywhere above it.
    expect(() => renderLayout({ pageLabel: "Dashboard" })).not.toThrow();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("holds a ThemeToggle the consumer passes — the migration path", () => {
    renderWithActions(<ThemeToggle />);
    expect(screen.getByRole("group", { name: "Farbschema" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dunkles Design" })).toBeInTheDocument();
  });

  it("holds several controls at once — search field and toggle", () => {
    renderWithActions(
      <>
        <Input type="search" aria-label="Suche" />
        <ThemeToggle />
      </>,
    );
    expect(screen.getByRole("searchbox", { name: "Suche" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Farbschema" })).toBeInTheDocument();
  });

  it("a toggle in the slot can be fully localized — no German label survives", () => {
    renderWithActions(
      <ThemeToggle
        id="app-theme-toggle"
        themeLabel="Colour scheme"
        lightLabel="Light"
        systemLabel="System"
        darkLabel="Dark"
      />,
    );
    expect(screen.getByRole("group", { name: "Colour scheme" })).toBeInTheDocument();
    for (const name of ["Light", "System", "Dark"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    for (const name of GERMAN_DEFAULT_NAMES) {
      expect(screen.queryByRole("group", { name })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    expect(document.getElementById("app-theme-toggle")).toBe(
      screen.getByRole("group", { name: "Colour scheme" }),
    );
  });
});

/**
 * The optional `pageLabel` (0.29.0), unchanged by this card — the *structural*
 * half. „Renders nothing" is the difference between zero paragraphs and one
 * empty one; where the bar puts what it holds is measured in Chromium by the
 * stories.
 */
describe("AppShellLayout — the optional pageLabel (0.29.0)", () => {
  it("renders NO element for the label when it is omitted — not an empty <p>", () => {
    renderLayout();
    expect(bar().querySelectorAll("p")).toHaveLength(0);
  });

  it("invents no default label — the bar carries no text, not a guess", () => {
    renderLayout();
    expect(bar().textContent).toBe("");
  });

  it("keeps the labelled bar exactly as it was — one <p>, the given words", () => {
    renderLayout({ pageLabel: "Dashboard" });
    const paragraphs = bar().querySelectorAll("p");
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toHaveTextContent("Dashboard");
  });

  it("treats an empty label as no label — the i18n case, not a blank slot", () => {
    renderLayout({ pageLabel: "" });
    expect(bar().querySelectorAll("p")).toHaveLength(0);
  });
});

/**
 * The centre region (0.30.0). What it *contains* is checkable here; that it is
 * centred **on the bar** is a layout fact and is measured in Chromium by
 * `WithCenteredSearch` / `WithCenteredSearchAndLabel`.
 */
describe("AppShellLayout — the centred search slot (0.30.0)", () => {
  it("holds the node it is given, reachable by its accessible name", () => {
    renderLayout({
      pageLabel: "Dashboard",
      search: <Input type="search" aria-label="Suche" />,
    });
    expect(screen.getByRole("searchbox", { name: "Suche" })).toBeInTheDocument();
  });

  it("orders the three regions label → search → actions", () => {
    renderLayout({
      pageLabel: "Dashboard",
      search: <Input type="search" aria-label="Suche" />,
      headerActions: <button type="button">Aktion</button>,
    });
    const label = screen.getByText("Dashboard");
    const field = screen.getByRole("searchbox", { name: "Suche" });
    const action = screen.getByRole("button", { name: "Aktion" });
    expect(precedes(label, field)).toBe(true);
    expect(precedes(field, action)).toBe(true);
    // All three are in the chrome bar, not in the page.
    for (const node of [label, field, action]) {
      expect(bar()).toContainElement(node);
    }
  });

  it("renders nothing for an omitted search — the bar keeps no empty field", () => {
    renderLayout({ pageLabel: "Dashboard" });
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(bar().textContent).toBe("Dashboard");
  });
});

/**
 * The left column (0.30.0) — `leftOpen` / `onLeftOpenChange` reach the
 * `SidePanel` the template builds, and its toggle is the column's own.
 *
 * Why these assertions exist next to `app-shell.test.tsx` and
 * `side-panel.test.tsx`: those prove the *components* keep their contract, not
 * that this template's wiring reaches them. A forwarded prop that silently
 * never arrives (dropped in the destructuring, spread onto the wrong element,
 * shadowed by a default) leaves every component test green.
 */
const COLUMN_LABELS = {
  collapse: "Navigation einklappen",
  expand: "Navigation ausklappen",
};

const collapsibleNav = (
  <>
    <NavItem label="Team">
      <svg aria-hidden />
      <span>Team</span>
    </NavItem>
    <NavItem>
      <svg aria-hidden />
      <span>Berichte</span>
    </NavItem>
  </>
);

const collapsibleFooter = (
  <SidebarUserMenu initials="JL" name="Jamie Lee" role="Admin">
    <DropdownMenuItem>Abmelden</DropdownMenuItem>
  </SidebarUserMenu>
);

/** The wiring a consuming app writes — the state lives in the app. */
function ControlledShell({ start = true }: { start?: boolean }) {
  const [leftOpen, setLeftOpen] = useState(start);
  return (
    <AppShellLayout
      logo={<span>Marke</span>}
      nav={collapsibleNav}
      sidebarFooter={collapsibleFooter}
      pageLabel="Dashboard"
      leftOpen={leftOpen}
      onLeftOpenChange={setLeftOpen}
      mobileTabs={TABS}
      activeMobileTab="page"
      onMobileTabChange={() => {}}
      mobileTabBarLabel="Bereichswechsel"
    >
      Inhalt
    </AppShellLayout>
  );
}

describe("AppShellLayout — the collapsible left column (0.30.0)", () => {
  it("names the column and its navigation landmark with navLabel", () => {
    renderLayout({ navLabel: "Main navigation", nav: collapsibleNav });
    const column = screen.getByRole("complementary", { name: "Main navigation" });
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(column).toContainElement(nav);
    expect(within(nav).getByRole("button", { name: "Team" })).toBeInTheDocument();
  });

  it("defaults the column's name to Hauptnavigation, as Sidebar did", () => {
    renderLayout({ nav: collapsibleNav });
    expect(
      screen.getByRole("complementary", { name: "Hauptnavigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Hauptnavigation" }),
    ).toBeInTheDocument();
  });

  it("puts logo and footer into the column, header row first", () => {
    renderLayout({
      logo: <span>Marke</span>,
      nav: collapsibleNav,
      sidebarFooter: collapsibleFooter,
    });
    const column = screen.getByRole("complementary", { name: "Hauptnavigation" });
    const brand = within(column).getByText("Marke");
    const nav = within(column).getByRole("navigation");
    const userMenu = within(column).getByRole("button", { name: /Jamie Lee/ });
    expect(precedes(brand, nav)).toBe(true);
    expect(precedes(nav, userMenu)).toBe(true);
  });

  it("a consumer using ONLY the template can collapse and expand", async () => {
    render(<ControlledShell />);
    const collapse = screen.getByRole("button", { name: COLUMN_LABELS.collapse });
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    // aria-controls resolves to the column body — the id is minted inside
    // SidePanel (`useId`), so nothing at template level could fake it.
    const bodyId = collapse.getAttribute("aria-controls")!;
    expect(document.getElementById(bodyId)).toContainElement(
      screen.getByRole("navigation"),
    );

    await userEvent.click(collapse);
    const expand = await screen.findByRole("button", { name: COLUMN_LABELS.expand });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    /* Collapsed IS the rail — and since 0.31.0 the nav MOVES there rather than
       going out of the accessibility tree with the body. So it is still one
       `navigation` landmark, just no longer inside the region `aria-controls`
       names; the brand is still unmounted, because `header` does not move. */
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(document.getElementById(bodyId)).not.toContainElement(
      screen.getByRole("navigation"),
    );
    expect(screen.queryByText("Marke")).not.toBeInTheDocument();

    await userEvent.click(expand);
    expect(
      await screen.findByRole("button", { name: COLUMN_LABELS.collapse }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("hands the REQUESTED state to onLeftOpenChange, never the old one", async () => {
    const onLeftOpenChange = vi.fn();
    renderLayout({ nav: collapsibleNav, leftOpen: true, onLeftOpenChange });
    await userEvent.click(screen.getByRole("button", { name: COLUMN_LABELS.collapse }));
    expect(onLeftOpenChange).toHaveBeenCalledWith(false);
    // Controlled: the parent ignored the request, so nothing moved.
    expect(
      screen.getByRole("button", { name: COLUMN_LABELS.collapse }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("renders the collapsed column from leftOpen={false} alone", () => {
    renderLayout({ nav: collapsibleNav, leftOpen: false });
    expect(
      screen.getByRole("button", { name: COLUMN_LABELS.expand }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  /*
    The nav MOVES into the rail; it is neither hidden with the body nor
    duplicated. `SidePanel` hides its body while collapsed, so leaving the nav
    there would make "minimise" mean "hide the navigation" — and rendering it in
    both places would duplicate every `id` and `aria-current` a consumer put in
    a row, the failure this release removed with the drawer.

    Oracles: the ARIA `navigation` landmark mapping and `NavItem`'s documented
    collapsed contract (it names itself with `aria-label` only while collapsed,
    because expanded the visible text is already the name). Neither is asserted
    off a class.
  */
  describe("the navigation in the collapsed rail", () => {
    it("is present, and present exactly once", () => {
      renderLayout({ nav: collapsibleNav, leftOpen: false });

      const navs = screen.getAllByRole("navigation", { name: "Hauptnavigation" });
      expect(navs).toHaveLength(1);
      expect(navs[0]).toBeVisible();
      expect(within(navs[0]).getByRole("button", { name: "Team" })).toBeVisible();
    });

    it("renders its rows in the icon-only form", () => {
      renderLayout({ nav: collapsibleNav, leftOpen: false });

      // Collapsed: the row's name comes from `aria-label`, not its visible text.
      expect(screen.getByRole("button", { name: "Team" })).toHaveAttribute(
        "aria-label",
        "Team",
      );
    });

    it("leaves the expanded column's rows in their full-width form", () => {
      renderLayout({ nav: collapsibleNav, leftOpen: true });

      expect(screen.getAllByRole("navigation", { name: "Hauptnavigation" })).toHaveLength(1);
      expect(screen.getByRole("button", { name: "Team" })).not.toHaveAttribute("aria-label");
    });
  });

  it("forwards collapseLabel/expandLabel — no German default survives", async () => {
    const { rerender } = renderLayout({
      nav: collapsibleNav,
      collapseLabel: "Collapse navigation",
      expandLabel: "Expand navigation",
    });
    expect(
      screen.getByRole("button", { name: "Collapse navigation" }),
    ).toBeInTheDocument();

    rerender(
      <AppShellLayout
        logo="Marke"
        nav={collapsibleNav}
        leftOpen={false}
        onLeftOpenChange={() => {}}
        collapseLabel="Collapse navigation"
        expandLabel="Expand navigation"
        mobileTabs={TABS}
        activeMobileTab="page"
        onMobileTabChange={() => {}}
        mobileTabBarLabel="Bereichswechsel"
      >
        Inhalt
      </AppShellLayout>,
    );
    expect(
      screen.getByRole("button", { name: "Expand navigation" }),
    ).toBeInTheDocument();
    for (const name of Object.values(COLUMN_LABELS)) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });

  it("keeps every nav row's accessible name across the collapse — the same string", async () => {
    /* 0.31.0 restores what the title always promised. Until 0.30.0 the rows left
       the accessibility tree on collapse (the nav sat in the body `SidePanel`
       hides) and this test asserted that disappearance; now the nav moves into
       the rail, so the rows survive and keep the SAME accessible name — from
       their visible text while expanded, from `aria-label` while collapsed.
       Name equality is the point: a row whose name changed with the column
       width would break a screen-reader user's mental map and any script that
       addresses it. accname computes both sides, so neither is read off a class. */
    render(<ControlledShell />);
    for (const name of ["Team", "Berichte"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole("button", { name: COLUMN_LABELS.collapse }));
    await screen.findByRole("button", { name: COLUMN_LABELS.expand });
    for (const name of ["Team", "Berichte"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    /* The one row WITHOUT a `label` is the control case: `NavItem` refuses to
       collapse a row it was never told the name of, so it keeps its visible
       text and gains no `aria-label`. */
    expect(screen.getByRole("button", { name: "Team" })).toHaveAttribute("aria-label", "Team");
    expect(screen.getByRole("button", { name: "Berichte" })).not.toHaveAttribute("aria-label");
  });
});

describe("AppShellLayout — the right column (0.30.0)", () => {
  it("renders nothing on the right when rightPanel is omitted", () => {
    renderLayout({ nav: collapsibleNav });
    expect(screen.getAllByRole("complementary")).toHaveLength(1);
  });

  it("passes rightPanel through as the second column, after the main area", () => {
    renderLayout({
      nav: collapsibleNav,
      rightPanel: {
        content: <p>Quellen-Inhalt</p>,
        header: <span>Quellen</span>,
        label: "Quellen",
        isOpen: true,
        onOpenChange: () => {},
        expandLabel: "Quellen ausklappen",
        collapseLabel: "Quellen einklappen",
      },
    });
    const right = screen.getByRole("complementary", { name: "Quellen" });
    expect(right).toContainElement(screen.getByText("Quellen-Inhalt"));
    expect(precedes(screen.getByRole("main"), right)).toBe(true);
    expect(screen.getAllByRole("complementary")).toHaveLength(2);
  });
});

describe("AppShellLayout — below lg", () => {
  it("shows the brand in the bar, a tab bar, and no dialog anywhere", () => {
    stubViewport(false);
    renderLayout({ pageLabel: "Dashboard", nav: collapsibleNav });

    expect(bar()).toHaveTextContent("Marke");
    expect(
      screen.getByRole("navigation", { name: "Bereichswechsel" }),
    ).toBeInTheDocument();
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
    // The wide bar's other two regions are not on a 360px screen…
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    // …and the nav column is reached through its tab, not through a burger.
    expect(screen.getByRole("main")).toHaveTextContent("Inhalt");
    expect(screen.queryAllByRole("complementary")).toHaveLength(0);
  });

  it("keeps headerActions reachable in the narrow bar", () => {
    stubViewport(false);
    renderLayout({
      headerActions: <Input type="search" aria-label="Suche" />,
    });
    expect(bar()).toContainElement(screen.getByRole("searchbox", { name: "Suche" }));
  });

  it("shows the nav column, without a collapse control, when its tab is active", () => {
    stubViewport(false);
    renderLayout({ nav: collapsibleNav, leftOpen: false, activeMobileTab: "nav" });

    const column = screen.getByRole("complementary", { name: "Hauptnavigation" });
    expect(within(column).getByRole("navigation")).toBeInTheDocument();
    expect(within(column).getByRole("button", { name: "Team" })).toBeInTheDocument();
    for (const name of Object.values(COLUMN_LABELS)) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });

  it("reports a tab change to the consumer", async () => {
    stubViewport(false);
    const onMobileTabChange = vi.fn();
    renderLayout({ onMobileTabChange });
    await userEvent.click(screen.getByRole("button", { name: "Bereiche" }));
    expect(onMobileTabChange).toHaveBeenCalledWith("nav");
  });
});
