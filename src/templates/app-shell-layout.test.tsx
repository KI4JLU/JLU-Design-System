import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { AppShellLayout } from "./app-shell-layout";
import { Input } from "../components/input";
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
