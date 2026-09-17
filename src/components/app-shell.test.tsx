import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { FolderOpen, Home, MessageSquare } from "lucide-react";
import { AppShell, type AppShellPanel } from "./app-shell";
import { NavItem } from "./nav-item";
import { SIDE_PANEL_RAIL_WIDTH } from "./side-panel-variants";
import type { MobilePaneTab } from "../lib/pane-layout";

/**
 * `AppShell` after 0.30.0: two `SidePanel` columns around a main column, and
 * below `lg` one area at a time plus a `BottomTabBar`. This file is a
 * **rewrite** — every assertion about the Radix drawer is gone with the drawer
 * itself, not adjusted, because the arrangement it described no longer exists.
 *
 * Oracles, all of them outside the code under test:
 *
 * 1. **ARIA landmark roles as HTML-AAM defines them** — `aside` with an
 *    accessible name is `complementary`, `main` is `main`, a `header` that is
 *    not inside a sectioning element is `banner`, `nav` is `navigation`, and a
 *    document has at most one `main`. Testing Library computes those from the
 *    markup (aria-query + dom-accessibility-api) and reads none of this repo's
 *    classes, so „the right areas are on screen" is checkable without
 *    asserting the component's own output back at itself. No assertion below
 *    names a CSS class.
 * 2. **`Node.compareDocumentPosition`**, the DOM's own answer to „which of
 *    these two elements comes first". Used for the order of the three columns
 *    and for header-before-content inside a column: DOM order is what carries
 *    the visual order here (the shell renders no `order-*` utility), and it is
 *    also what the tab sequence and a screen reader follow.
 * 3. **The WAI-ARIA disclosure pattern**, which `SidePanel` implements:
 *    `aria-expanded` on the toggle plus `aria-controls` resolving to the pane
 *    body. Read as attributes, never as internal state.
 * 4. **The consumer's own data** — the widths, labels, ids and tab table this
 *    file passes in. A number asserted below is a number this file chose (311,
 *    233), never one the component computed; the single exception is the
 *    collapsed rail, which is the exported `SIDE_PANEL_RAIL_WIDTH`.
 * 5. **`BottomTabBar`'s published contract**: a `navigation` landmark with
 *    exactly one `aria-current="page"`, asserted through the attribute.
 * 6. **The card's own acceptance criteria** (KI-809), which name the states to
 *    reach: both columns collapsible independently, no dialog in the tree,
 *    exactly one pane per active tab, no node mounted twice, and an omitted
 *    column leaving neither landmark nor rail.
 *
 * jsdom implements no `matchMedia` (verified against jsdom 29), so the
 * viewport is stubbed per test — that stub *is* the test's viewport, and no
 * assertion here depends on CSS having been applied.
 */

const askedQueries: string[] = [];

function stubViewport(isDesktop: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => {
    askedQueries.push(query);
    return {
      matches: isDesktop,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  askedQueries.length = 0;
});

// Widths chosen so they can only have come from this file.
const LEFT_WIDTH = 311;
const RIGHT_WIDTH = 233;

function leftPanel(overrides: Partial<AppShellPanel> = {}): AppShellPanel {
  return {
    content: (
      <nav aria-label="Hauptnavigation">
        <NavItem asChild>
          <a href="#bereich-a" id="nav-bereich-a">
            Bereich A
          </a>
        </NavItem>
      </nav>
    ),
    header: <span>Marke</span>,
    footer: <button type="button">Abmelden</button>,
    label: "Navigationsspalte",
    isOpen: true,
    width: LEFT_WIDTH,
    onOpenChange: vi.fn(),
    expandLabel: "Navigation ausklappen",
    collapseLabel: "Navigation einklappen",
    ...overrides,
  };
}

function rightPanel(overrides: Partial<AppShellPanel> = {}): AppShellPanel {
  return {
    content: <p>Quellen-Inhalt</p>,
    header: <span>Quellen</span>,
    label: "Quellen",
    isOpen: true,
    width: RIGHT_WIDTH,
    onOpenChange: vi.fn(),
    expandLabel: "Quellen ausklappen",
    collapseLabel: "Quellen einklappen",
    ...overrides,
  };
}

const TABS: MobilePaneTab[] = [
  { id: "nav", icon: <Home />, label: "Navigation", pane: "left" },
  { id: "page", icon: <MessageSquare />, label: "Seite", pane: "main" },
  { id: "sources", icon: <FolderOpen />, label: "Quellen", pane: "right" },
];

function renderShell(props: Partial<React.ComponentProps<typeof AppShell>> = {}) {
  return render(
    <AppShell
      topBar={<span>Anwendung</span>}
      left={leftPanel()}
      right={rightPanel()}
      mobileTabs={TABS}
      activeMobileTab="page"
      onMobileTabChange={() => {}}
      mobileTabBarLabel="Bereichswechsel"
      {...props}
    >
      <p>Inhalt</p>
    </AppShell>,
  );
}

/** `true` when `a` precedes `b` in document order. */
function precedes(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("AppShell — desktop arrangement", () => {
  it("puts left column, main area and right column on screen, in that order", () => {
    stubViewport(true);
    renderShell();

    const left = screen.getByRole("complementary", { name: "Navigationsspalte" });
    const main = screen.getByRole("main");
    const right = screen.getByRole("complementary", { name: "Quellen" });

    expect(main).toHaveTextContent("Inhalt");
    // The sketch's column order, read off the DOM rather than off a class.
    expect(precedes(left, main)).toBe(true);
    expect(precedes(main, right)).toBe(true);
    // The columns are siblings of the main area, not content of it: they are
    // the screen's chrome.
    expect(main).not.toContainElement(left);
    expect(main).not.toContainElement(right);
  });

  it("renders the chrome bar as a banner above the main area", () => {
    stubViewport(true);
    renderShell();
    const bar = screen.getByRole("banner");
    expect(bar).toHaveTextContent("Anwendung");
    expect(precedes(bar, screen.getByRole("main"))).toBe(true);
    // Chrome, not page content: the bar is outside the `main` landmark, so it
    // does not scroll with the page and does not belong to it.
    expect(screen.getByRole("main")).not.toContainElement(bar);
  });

  it("puts each column's header in its own toggle row, above its content", () => {
    stubViewport(true);
    renderShell();

    const left = screen.getByRole("complementary", { name: "Navigationsspalte" });
    const brand = within(left).getByText("Marke");
    const toggle = within(left).getByRole("button", { name: "Navigation einklappen" });
    const nav = within(left).getByRole("navigation", { name: "Hauptnavigation" });
    const footer = within(left).getByRole("button", { name: "Abmelden" });

    // [header … toggle] on a left column (SidePanel's contract), then the
    // content, then the pinned footer — one column, four things, one order.
    expect(precedes(brand, toggle)).toBe(true);
    expect(precedes(toggle, nav)).toBe(true);
    expect(precedes(nav, footer)).toBe(true);

    // The right column mirrors the toggle to the content-facing edge.
    const right = screen.getByRole("complementary", { name: "Quellen" });
    expect(
      precedes(
        within(right).getByRole("button", { name: "Quellen einklappen" }),
        within(right).getByText("Quellen"),
      ),
    ).toBe(true);
  });

  it("points each toggle at the column body it controls, resolved and distinct", () => {
    stubViewport(true);
    renderShell();

    const resolved: HTMLElement[] = [];
    for (const [toggleName, contentText] of [
      ["Navigation einklappen", "Bereich A"],
      ["Quellen einklappen", "Quellen-Inhalt"],
    ] as const) {
      const toggle = screen.getByRole("button", { name: toggleName });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      const body = document.getElementById(toggle.getAttribute("aria-controls") ?? "");
      expect(body).not.toBeNull();
      expect(body).toContainElement(screen.getByText(contentText));
      resolved.push(body as HTMLElement);
    }
    // The wiring bug this pins: both toggles pointing at one column.
    expect(resolved[0]).not.toBe(resolved[1]);
  });

  it("reports a collapse to its own column only — the other one does not move", async () => {
    stubViewport(true);
    const left = leftPanel();
    const right = rightPanel();
    renderShell({ left, right });

    const rightColumn = screen.getByRole("complementary", { name: "Quellen" });
    expect(rightColumn).toHaveAttribute(
      "style",
      expect.stringContaining(`${RIGHT_WIDTH}px`),
    );

    await userEvent.click(screen.getByRole("button", { name: "Navigation einklappen" }));

    expect(left.onOpenChange).toHaveBeenCalledWith(false);
    expect(right.onOpenChange).not.toHaveBeenCalled();
    // Unmoved, measured against the width THIS FILE passed in: same element,
    // same inline width, same expanded controls.
    expect(screen.getByRole("complementary", { name: "Quellen" })).toBe(rightColumn);
    expect(rightColumn).toHaveAttribute(
      "style",
      expect.stringContaining(`${RIGHT_WIDTH}px`),
    );
    expect(screen.getByRole("button", { name: "Quellen einklappen" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Quellen-Inhalt")).toBeVisible();
  });

  /*
    The shell-level half of the same 0.30.0 regression: a collapsed nav column
    must still carry its footer, because that is typically the only route to
    sign-out. Before the fix the shell pinned `footer` inside `SidePanel`'s
    children, i.e. inside the region the collapse hides — the control was in the
    document and unreachable, so only a visibility oracle catches it.
  */
  it("keeps the collapsed column's footer reachable in the rail", () => {
    stubViewport(true);
    renderShell({ left: leftPanel({ isOpen: false }) });

    const leftColumn = screen.getByRole("complementary", { name: "Navigationsspalte" });
    expect(within(leftColumn).getByRole("button", { name: "Abmelden" })).toBeVisible();
  });

  it("collapses a column to the rail and leaves the other one expanded", async () => {
    stubViewport(true);
    const left = leftPanel({ isOpen: false });
    renderShell({ left });

    const leftColumn = screen.getByRole("complementary", { name: "Navigationsspalte" });
    // The rail: the exported design constant, not a literal 60 restated here.
    expect(leftColumn).toHaveAttribute(
      "style",
      expect.stringContaining(`${SIDE_PANEL_RAIL_WIDTH}px`),
    );
    // Only the way back out is on screen; the header is gone with the rest.
    const expand = within(leftColumn).getByRole("button", {
      name: "Navigation ausklappen",
    });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    expect(within(leftColumn).queryByText("Marke")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Hauptnavigation" }),
    ).not.toBeInTheDocument();

    // …while the right column is untouched and still full width.
    expect(screen.getByText("Quellen-Inhalt")).toBeVisible();
    expect(screen.getByRole("complementary", { name: "Quellen" })).toHaveAttribute(
      "style",
      expect.stringContaining(`${RIGHT_WIDTH}px`),
    );

    await userEvent.click(expand);
    expect(left.onOpenChange).toHaveBeenCalledWith(true);
  });

  it("falls back to the 256px default width when a column names none", () => {
    stubViewport(true);
    // Oracle: the published default — 16rem = the `--width-sidebar` token at
    // the 16px default root size, i.e. what the fixed column measured before
    // 0.30.0. The token itself is measured in Chromium by the
    // `WithCollapsibleColumns` story; jsdom loads no stylesheet.
    renderShell({ left: leftPanel({ width: undefined }) });
    expect(
      screen.getByRole("complementary", { name: "Navigationsspalte" }),
    ).toHaveAttribute("style", expect.stringContaining("256px"));
  });

  it("renders no right column and no rail when `right` is omitted", () => {
    stubViewport(true);
    renderShell({ right: undefined });

    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    for (const name of ["Quellen einklappen", "Quellen ausklappen"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });

  it("renders no left column and no rail when `left` is omitted", () => {
    stubViewport(true);
    renderShell({ left: undefined });

    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    expect(screen.getByRole("complementary")).toHaveAccessibleName("Quellen");
    for (const name of ["Navigation einklappen", "Navigation ausklappen"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });
});

/**
 * The mechanism KI-797 reported and this card removes: the drawer mounted the
 * SAME node a second time, so a consumer's `id` inside the nav column existed
 * twice while it was open. With the drawer gone there is one mount per node.
 * Oracle: the id is the consumer's own (`nav-bereich-a`, set in `leftPanel()`),
 * counted with `querySelectorAll` — a count, not a claim about markup.
 */
describe("AppShell — every node is mounted once", () => {
  it.each([
    ["desktop, expanded", true, true, "page", 1],
    ["desktop, collapsed", true, false, "page", 1],
    ["narrow, the nav tab", false, true, "nav", 1],
    ["narrow, the main tab", false, true, "page", 0],
  ] as const)(
    "%s: the consumer's id occurs %i×",
    (_name, isDesktop, isOpen, activeMobileTab, expected) => {
      stubViewport(isDesktop);
      const { container } = renderShell({
        left: leftPanel({ isOpen }),
        activeMobileTab,
      });
      expect(container.querySelectorAll("#nav-bereich-a")).toHaveLength(expected);
    },
  );

  it.each([true, false])("puts no dialog in the tree (desktop: %s)", (isDesktop) => {
    stubViewport(isDesktop);
    const { container } = renderShell();
    // Nothing modal survives: neither an open dialog nor a trigger for one.
    // Queried over the whole document, because a Radix drawer portalled itself
    // outside the container.
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[aria-modal]")).toHaveLength(0);
  });
});

describe("AppShell — narrow-screen arrangement", () => {
  it.each([
    ["nav", "Navigationsspalte"],
    ["page", null],
    ["sources", "Quellen"],
  ] as const)("shows exactly the one area tab %s declares", (activeMobileTab, paneName) => {
    stubViewport(false);
    const { container } = renderShell({ activeMobileTab });

    const complementary = screen.queryAllByRole("complementary");
    if (paneName === null) {
      expect(screen.getByRole("main")).toHaveTextContent("Inhalt");
      expect(complementary).toHaveLength(0);
    } else {
      expect(complementary).toHaveLength(1);
      expect(complementary[0]).toHaveAccessibleName(paneName);
      // No `main` at all while a side column is the area on screen — the main
      // column is not in the tree, and wrapping a `complementary` in `main`
      // would misname it. Counted as elements, so an unnamed second one would
      // fail too.
      expect(container.querySelectorAll("main")).toHaveLength(0);
    }
  });

  it("keeps the top bar, with no menu button to open anything", () => {
    stubViewport(false);
    renderShell({ activeMobileTab: "page" });
    expect(screen.getByRole("banner")).toHaveTextContent("Anwendung");
    // The three tab buttons are the only buttons of the chrome; the burger is
    // gone, so nothing here can open a navigation surface.
    const chromeButtons = within(
      screen.getByRole("navigation", { name: "Bereichswechsel" }),
    )
      .getAllByRole("button")
      .map((button) => button.textContent);
    expect(chromeButtons).toEqual(["Navigation", "Seite", "Quellen"]);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("marks exactly one tab as the current one", () => {
    stubViewport(false);
    renderShell({ activeMobileTab: "sources" });
    const current = document.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName("Quellen");
  });

  it("shows a collapsed column in full, with no collapse control", () => {
    stubViewport(false);
    const left = leftPanel({ isOpen: false });
    renderShell({ left, activeMobileTab: "nav" });

    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toBeVisible();
    for (const name of ["Navigation einklappen", "Navigation ausklappen"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    // A control that collapses the only visible area would leave an empty
    // screen and destroy the desktop preference on the way.
    expect(left.onOpenChange).not.toHaveBeenCalled();
    // The column's footer stays reachable — it is typically the only route to
    // sign-out.
    expect(screen.getByRole("button", { name: "Abmelden" })).toBeInTheDocument();
  });

  it("falls back to the main area for a tab whose column this shell lacks", () => {
    stubViewport(false);
    renderShell({ right: undefined, activeMobileTab: "sources" });
    expect(screen.getByRole("main")).toHaveTextContent("Inhalt");
    expect(screen.queryAllByRole("complementary")).toHaveLength(0);
  });

  it("reserves the tab bar's height so the area's last row is not covered", () => {
    stubViewport(false);
    renderShell({ activeMobileTab: "page" });
    // The bar is `fixed` and one chrome unit tall — the same exported constant
    // the collapsed rail uses, which is why the reservation is that constant
    // and not a second literal 60. Only the px part is asserted: jsdom's CSS
    // parser garbles the nested `env()` (see workspace-layout.test.tsx).
    expect(screen.getByRole("main").getAttribute("style")).toContain(
      `${SIDE_PANEL_RAIL_WIDTH}px`,
    );
  });

  it("reports a tab change without deciding anything about it", async () => {
    stubViewport(false);
    const onMobileTabChange = vi.fn();
    renderShell({ onMobileTabChange });
    await userEvent.click(screen.getByRole("button", { name: "Quellen" }));
    expect(onMobileTabChange).toHaveBeenCalledWith("sources");
  });
});

describe("AppShell — viewport switch", () => {
  it("asks for Tailwind's own lg boundary", () => {
    stubViewport(true);
    renderShell();
    // `--breakpoint-lg: 64rem` in Tailwind's theme — the boundary the `lg:`
    // utilities in this library use, and the one `WorkspaceLayout` asks for.
    expect(askedQueries).toContain("(min-width: 64rem)");
  });

  it("falls back to the desktop arrangement where matchMedia does not exist", () => {
    vi.stubGlobal("matchMedia", undefined);
    renderShell();
    expect(
      screen.getByRole("complementary", { name: "Navigationsspalte" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Quellen" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Inhalt");
  });

  it("renders the desktop arrangement on a server, without touching the DOM", () => {
    // The third argument of `useSyncExternalStore` is the server snapshot and
    // only runs during SSR/hydration, so a `render()` cannot reach it. Oracle:
    // React's documented SSR contract for the hook, plus the requirement that
    // a shared library not crash while rendered on a server.
    const html = renderToString(
      <AppShell
        topBar={<span>Anwendung</span>}
        left={leftPanel()}
        right={rightPanel()}
        mobileTabs={TABS}
        activeMobileTab="page"
        onMobileTabChange={() => {}}
        mobileTabBarLabel="Bereichswechsel"
      >
        <p>Inhalt</p>
      </AppShell>,
    );
    expect(html).toContain('aria-label="Navigationsspalte"');
    expect(html).toContain('aria-label="Quellen"');
    expect(html).toContain("<main");
    // …and not the narrow-screen arrangement, whose bar is the tell.
    expect(html).not.toContain('aria-label="Bereichswechsel"');
  });
});
