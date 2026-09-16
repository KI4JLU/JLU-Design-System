import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { AppShellLayout } from "./app-shell-layout";
import { DropdownMenuItem } from "../components/dropdown-menu";
import { Input } from "../components/input";
import { NavItem } from "../components/nav-item";
import { SidebarUserMenu } from "../components/sidebar-user-menu";
import { ThemeToggle } from "../components/theme-toggle";
import { ThemeProvider } from "../theme/ThemeContext";

/**
 * The page-label bar: what the template puts in it, and what it no longer
 * decides for the app. Until 0.26.0 the bar ended in a hardcoded
 * `<ThemeToggle />`; from 0.26.0 it ends in whatever the consumer passes as
 * `headerActions`, including nothing.
 *
 * Oracles, all outside the code under test:
 *
 * 1. **The accessibility tree**, computed by aria-query +
 *    dom-accessibility-api through Testing Library's `getByRole`. `group`,
 *    `searchbox` and `button` with their accessible names come from the ARIA
 *    in HTML mapping, not from anything this template writes — no assertion
 *    below reads a tag name, a class or a DOM path, so the template cannot
 *    satisfy one by merely looking right.
 * 2. **`ThemeToggle`'s own published defaults** — „Farbschema", „Helles
 *    Design", „Systemdesign", „Dunkles Design" (DESIGN_SYSTEM.md §4, and
 *    asserted independently in `theme-toggle.test.tsx`). Those strings are the
 *    contract of a *different* component, which is what makes them usable here
 *    as the fingerprint of „the template mounted a toggle": if the template
 *    ever mounts one again, one of them appears.
 * 3. **The card's acceptance criterion**, which enumerates the four states the
 *    bar has to reach — toggle, search field, both, neither — one test each.
 *
 * `matchMedia` is stubbed because `ThemeProvider` reads `prefers-color-scheme`
 * and jsdom 29 does not implement it.
 */
const GERMAN_DEFAULT_NAMES = [
  "Farbschema",
  "Helles Design",
  "Systemdesign",
  "Dunkles Design",
];

beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

function renderShell(headerActions?: ReactNode) {
  return render(
    <ThemeProvider>
      <AppShellLayout
        logo="Marke"
        nav="Navigation"
        pageLabel="Dashboard"
        headerActions={headerActions}
      >
        Inhalt
      </AppShellLayout>
    </ThemeProvider>,
  );
}

describe("AppShellLayout — the page-label bar", () => {
  it("renders NO control of its own when the slot is empty (BREAKING, 0.26.0)", () => {
    renderShell();
    // The label is still there — only the template's own opinion about what
    // sits next to it is gone.
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
    expect(() =>
      render(
        <AppShellLayout logo="Marke" nav="Navigation" pageLabel="Dashboard">
          Inhalt
        </AppShellLayout>,
      ),
    ).not.toThrow();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    // The dependency is not gone, it moved to where it is visible: a consumer
    // that puts a toggle in the slot still needs the provider around it.
  });

  it("holds a ThemeToggle the consumer passes — the migration path", () => {
    renderShell(<ThemeToggle />);
    expect(screen.getByRole("group", { name: "Farbschema" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dunkles Design" })).toBeInTheDocument();
  });

  it("holds a search field — the consumer use this slot was opened for", () => {
    renderShell(<Input type="search" aria-label="Suche" placeholder="Suchen…" />);
    expect(screen.getByRole("searchbox", { name: "Suche" })).toBeInTheDocument();
  });

  it("holds several controls at once — search field and toggle", () => {
    renderShell(
      <>
        <Input type="search" aria-label="Suche" />
        <ThemeToggle />
      </>,
    );
    expect(screen.getByRole("searchbox", { name: "Suche" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Farbschema" })).toBeInTheDocument();
  });

  it("a toggle in the slot can be fully localized — no German label survives", () => {
    renderShell(
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
    // The gap this closes: the template used to mount the toggle itself and
    // forwarded none of its four label props, so these four strings were
    // unreachable from a bilingual app. Nothing German is left in the tree.
    for (const name of GERMAN_DEFAULT_NAMES) {
      expect(screen.queryByRole("group", { name })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    // And the same call site can address the group it just placed.
    expect(document.getElementById("app-theme-toggle")).toBe(
      screen.getByRole("group", { name: "Colour scheme" }),
    );
  });
});

/**
 * The optional `pageLabel` (0.29.0) — the *structural* half. What the bar
 * contains is checkable in jsdom; where it puts it is not (jsdom applies no
 * stylesheet, every box is 0×0), so the centring and the 64px height are
 * measured in Chromium by `app-shell-layout.stories.tsx`
 * (`WithCenteredSearchOnly`, `WithoutPageLabelOrActions`) instead of asserted
 * from class strings here.
 *
 * Oracles, outside the code under test:
 *
 * 1. **The DOM itself**, read through the `<main>` landmark that `AppShell`
 *    renders — an element type (`p`) and a text content, not a class or a
 *    React internal. „Renders nothing" is the difference between zero
 *    paragraphs and one empty one, and that distinction is the whole point of
 *    the card: an empty `<p>` is still a flex item, and it shifts the
 *    centring of `headerActions` by half the row's `gap-4` (measured in
 *    Chromium: 8px, `WithCenteredSearchOnly` fails at 736.5 vs 728.5 when the
 *    element is rendered unconditionally).
 * 2. **The two shipped call sites**, which both pass a label
 *    (JustRAG `AppChrome.tsx`, CampusAgents `AppLayout.tsx`, both read
 *    2026-09-16): required → optional may not move them, so the labelled case
 *    is re-asserted unchanged next to the new one.
 */
describe("AppShellLayout — the optional pageLabel (0.29.0)", () => {
  /** The page-label bar: the first element inside AppShell's `<main>`. */
  const bar = (container: HTMLElement) =>
    container.querySelector("main")!.firstElementChild!;

  it("renders NO element for the label when it is omitted — not an empty <p>", () => {
    const { container } = render(
      <AppShellLayout logo="Marke" nav="Navigation">
        Inhalt
      </AppShellLayout>,
    );
    expect(bar(container).querySelectorAll("p")).toHaveLength(0);
  });

  it("invents no default label — the bar is empty, not filled with a guess", () => {
    const { container } = render(
      <AppShellLayout logo="Marke" nav="Navigation">
        Inhalt
      </AppShellLayout>,
    );
    // No string at all, so a future default could not slip in unnoticed: the
    // template puts in what it was given, and it was given nothing.
    expect(bar(container).textContent).toBe("");
  });

  it("keeps the labelled bar exactly as it was — the change is additive", () => {
    // Both consumers audited for this card pass `pageLabel`; required →
    // optional must be invisible to them.
    const { container } = render(
      <AppShellLayout logo="Marke" nav="Navigation" pageLabel="Dashboard">
        Inhalt
      </AppShellLayout>,
    );
    const paragraphs = bar(container).querySelectorAll("p");
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toHaveTextContent("Dashboard");
  });

  it("treats an empty label as no label — the i18n case, not a blank slot", () => {
    // `pageLabel={t("…")}` that resolves to "" is the realistic way a falsy
    // label arrives. The test is truthiness, the same one `headerActions`
    // uses, so the two props of this bar behave alike.
    const { container } = render(
      <AppShellLayout logo="Marke" nav="Navigation" pageLabel="">
        Inhalt
      </AppShellLayout>,
    );
    expect(bar(container).querySelectorAll("p")).toHaveLength(0);
  });

  it("hands the bar to headerActions alone — the case the card was opened for", () => {
    render(
      <AppShellLayout
        logo="Marke"
        nav="Navigation"
        headerActions={<Input type="search" aria-label="Suche" />}
      >
        Inhalt
      </AppShellLayout>,
    );
    // The control is mounted and reachable by its accessible name; nothing
    // about the label's absence costs it its slot.
    expect(screen.getByRole("searchbox", { name: "Suche" })).toBeInTheDocument();
  });
});

/**
 * The collapsible sidebar, reached **through the template** — 0.28.0 forwards
 * `collapsed` / `onCollapsedChange` / `collapseLabel` / `expandLabel` to the
 * `Sidebar` the template constructs internally.
 *
 * Why these assertions exist at all, given `sidebar.test.tsx`, `nav-item.test.tsx`
 * and `app-shell.test.tsx` already cover the same behaviours on the components:
 * those suites prove the *components* keep their contract, not that this
 * template's wiring reaches them. A forwarded prop that silently never arrives
 * (dropped in the destructuring, spread onto the wrong element, shadowed by a
 * default) leaves every component test green. So the three facts carried over
 * from KI-785 are re-derived here from the template's own public surface.
 *
 * Oracles, all outside `app-shell-layout.tsx`:
 *
 * 1. **The accessibility tree.** Accessible names and roles are computed by
 *    aria-query + dom-accessibility-api inside Testing Library's
 *    `getByRole({ name })`, which implements accname and reads none of this
 *    repo's markup, classes or props. „The row is still named Team while the
 *    column is icon-only" is therefore a checkable statement rather than a
 *    claim about the DOM.
 * 2. **The WAI-ARIA disclosure pattern.** The toggle exposes `aria-expanded`;
 *    the assertions below read that, not an internal flag, so a template that
 *    forwarded nothing could not satisfy them.
 * 3. **`Sidebar`'s published German defaults** („Navigation einklappen" /
 *    „Navigation ausklappen", DESIGN_SYSTEM.md §7 → 0.27.0, asserted
 *    independently in `sidebar.test.tsx`). They belong to a *different*
 *    component, which is what makes them usable here as the fingerprint of
 *    „the template mounted a collapsible column" — and their absence, in the
 *    localisation test, as proof that no German string survives.
 * 4. **React's controlled-component contract**: the column re-renders only
 *    from the `collapsed` it is given, so the round trip below goes through
 *    consumer state.
 */
const SIDEBAR_LABELS = {
  collapse: "Navigation einklappen",
  expand: "Navigation ausklappen",
};

/**
 * What accname computes for the user-menu trigger — name and role line
 * concatenated without a separator. Pinned as one constant so the expanded and
 * the collapsed assertion cannot drift apart; the missing space is pre-existing
 * (`sidebar.test.tsx` pins the same string) and not this card's to change.
 */
const USER_MENU_NAME = "Jamie LeeAdmin";

const collapsibleNav = (
  <>
    <NavItem label="Team">
      <svg aria-hidden />
      <span>Team</span>
    </NavItem>
    {/* Deliberately no `label`: the row that must refuse to collapse. */}
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

function renderCollapsible(
  props: Partial<React.ComponentProps<typeof AppShellLayout>> = {},
) {
  return render(
    <AppShellLayout
      logo={<span>Marke</span>}
      nav={collapsibleNav}
      sidebarFooter={collapsibleFooter}
      pageLabel="Dashboard"
      {...props}
    >
      Inhalt
    </AppShellLayout>,
  );
}

/** The wiring a consuming app writes — the state lives in the app. */
function ControlledShell({ start = false }: { start?: boolean }) {
  const [collapsed, setCollapsed] = useState(start);
  return (
    <AppShellLayout
      logo={<span>Marke</span>}
      nav={collapsibleNav}
      sidebarFooter={collapsibleFooter}
      pageLabel="Dashboard"
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    >
      Inhalt
    </AppShellLayout>
  );
}

describe("AppShellLayout — the collapsible sidebar (0.28.0)", () => {
  it("renders no toggle when the collapse props are omitted — every pre-0.28.0 call site", () => {
    renderCollapsible();
    for (const name of Object.values(SIDEBAR_LABELS)) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    // …and the rows are untouched: full text, no aria-label, no tooltip.
    expect(screen.getByRole("button", { name: "Team" })).not.toHaveAttribute("aria-label");
  });

  it("renders no toggle for `collapsed` alone — it stays presentational", () => {
    // The prop pair is not one prop: an app that drives the state from
    // elsewhere (a URL parameter, a global store) can pass the value without
    // asking for a control, exactly as on `Sidebar`.
    renderCollapsible({ collapsed: true });
    for (const name of Object.values(SIDEBAR_LABELS)) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    // But the column *is* collapsed: the row is now named by its `label`.
    expect(screen.getByRole("button", { name: "Team" })).toHaveAttribute(
      "aria-label",
      "Team",
    );
  });

  it("a consumer using ONLY the template can collapse and expand", async () => {
    render(<ControlledShell />);
    const collapse = screen.getByRole("button", { name: SIDEBAR_LABELS.collapse });
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    // aria-controls resolves to the nav landmark — the id is minted inside
    // Sidebar (`useId`), so nothing at template level could fake this.
    const navId = collapse.getAttribute("aria-controls")!;
    expect(document.getElementById(navId)).toBe(screen.getByRole("navigation"));

    await userEvent.click(collapse);
    const expand = await screen.findByRole("button", { name: SIDEBAR_LABELS.expand });
    expect(expand).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(expand);
    expect(
      await screen.findByRole("button", { name: SIDEBAR_LABELS.collapse }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("hands the REQUESTED state to onCollapsedChange, never the old one", async () => {
    const onCollapsedChange = vi.fn();
    renderCollapsible({ collapsed: false, onCollapsedChange });
    await userEvent.click(screen.getByRole("button", { name: SIDEBAR_LABELS.collapse }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    // Controlled: the parent ignored the request, so nothing moved.
    expect(
      screen.getByRole("button", { name: SIDEBAR_LABELS.collapse }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps every nav row's accessible name across the collapse — the same string", async () => {
    render(<ControlledShell />);
    const expandedNames = ["Team", "Berichte", USER_MENU_NAME];
    for (const name of expandedNames) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }

    await userEvent.click(screen.getByRole("button", { name: SIDEBAR_LABELS.collapse }));
    await screen.findByRole("button", { name: SIDEBAR_LABELS.expand });

    // Same query, same strings — that is the assertion. Where the name now
    // comes from differs per row (aria-label / visible text / sr-only text),
    // and that is exactly what must NOT be visible from out here.
    for (const name of expandedNames) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("does not collapse a NavItem that was given no label", async () => {
    render(<ControlledShell start />);
    // „Berichte" has no `label`, so it keeps its text and gains no aria-label:
    // the row refuses rather than dropping the only text it has.
    const withoutLabel = screen.getByRole("button", { name: "Berichte" });
    expect(withoutLabel).not.toHaveAttribute("aria-label");
    expect(withoutLabel).toHaveTextContent("Berichte");
    // Its labelled neighbour did collapse, in the same column.
    expect(screen.getByRole("button", { name: "Team" })).toHaveAttribute(
      "aria-label",
      "Team",
    );
  });

  it("leaves the mobile drawer expanded and toggle-less", async () => {
    const { baseElement } = render(<ControlledShell start />);
    // The desktop column is collapsed from the start.
    expect(
      screen.getByRole("button", { name: SIDEBAR_LABELS.expand }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    const drawer = await screen.findByRole("dialog");

    // No toggle in the drawer copy, the brand is back, and the labelled row
    // shows its text instead of being named by aria-label.
    for (const name of Object.values(SIDEBAR_LABELS)) {
      expect(within(drawer).queryByRole("button", { name })).not.toBeInTheDocument();
    }
    expect(within(drawer).getByText("Marke")).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "Team" })).not.toHaveAttribute(
      "aria-label",
    );

    // …while the desktop column stayed collapsed. Queried through the DOM:
    // Radix marks everything outside an open modal `aria-hidden`, so that
    // column is (correctly) absent from the accessible tree right now.
    const asides = [...baseElement.querySelectorAll("aside")];
    expect(asides).toHaveLength(2);
    const desktop = asides.find((a) => !drawer.contains(a))!;
    expect(desktop.querySelector(`[aria-label='${SIDEBAR_LABELS.expand}']`)).not.toBeNull();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("forwards collapseLabel/expandLabel — no German default survives", async () => {
    // The gap 0.26.0 closed for `ThemeToggle` by *deletion* cannot be closed
    // that way here: the template owns the `Sidebar` instance, so a bilingual
    // app has no other route to these two strings than forwarding.
    const onCollapsedChange = vi.fn();
    const { rerender } = renderCollapsible({
      collapsed: false,
      onCollapsedChange,
      collapseLabel: "Collapse navigation",
      expandLabel: "Expand navigation",
    });
    expect(
      screen.getByRole("button", { name: "Collapse navigation" }),
    ).toBeInTheDocument();

    rerender(
      <AppShellLayout
        logo={<span>Marke</span>}
        nav={collapsibleNav}
        sidebarFooter={collapsibleFooter}
        pageLabel="Dashboard"
        collapsed
        onCollapsedChange={onCollapsedChange}
        collapseLabel="Collapse navigation"
        expandLabel="Expand navigation"
      >
        Inhalt
      </AppShellLayout>,
    );
    expect(screen.getByRole("button", { name: "Expand navigation" })).toBeInTheDocument();
    for (const name of Object.values(SIDEBAR_LABELS)) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });
});
