import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { FolderOpen, History, MessageSquare, Sparkles } from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import {
  WorkspaceLayout,
  type WorkspaceMobileTab,
  type WorkspacePane,
} from "./workspace-layout";
import { NavItem } from "../components/nav-item";
import { bottomTabBarVariants } from "../components/bottom-tab-bar-variants";
import { SIDE_PANEL_RAIL_WIDTH } from "../components/side-panel-variants";
import { ThemeProvider } from "../theme/ThemeContext";

/**
 * Oracles used here — all of them outside this template:
 *
 * 1. **ARIA landmark roles as HTML-AAM defines them** — `aside` with an
 *    accessible name is `complementary`, `section` with one is `region`,
 *    `nav` is `navigation`, and a document has at most **one** `main`.
 *    Testing Library computes those roles from the markup (aria-query +
 *    dom-accessibility-api); it never reads our class names, so „the right
 *    areas are on screen" is checkable without asserting our own output.
 * 2. **The WAI-ARIA APG „Window Splitter" contract**, which `ResizeHandle`
 *    implements as a focusable `separator`: `aria-valuemin`/`-valuemax`/
 *    `-valuenow` and a keyboard step. The handles are therefore queried by
 *    `role="separator"`, which Testing Library resolves from the markup — this
 *    file never reads `ResizeHandle`'s classes or props back out. The bounds
 *    asserted below are deliberately **not** the source implementation's
 *    150–600 / 150–800 — if this template hardcoded any bounds instead of
 *    passing the props through, these tests fail.
 * 3. **`aria-current="page"`** — exactly one item of a set is the current
 *    one; that is `BottomTabBar`'s documented contract, asserted here through
 *    the attribute rather than through the bar's classes.
 * 4. **The source implementation** `KbWorkspaceLayout.tsx` / `SidebarShell.tsx`
 *    in JustRAG, which this template generalizes: below its 1024px breakpoint
 *    it renders one area at a time, forces that area open
 *    (`open = isMobile ? true : isOpen`), renders no collapse control, and
 *    does **not** consult its „hide the sources pane" flag. Those are external
 *    behaviours this template is required to reproduce, not choices made by
 *    the code under test.
 * 5. **Tailwind's own theme** — `--breakpoint-lg: 64rem`
 *    (`node_modules/tailwindcss/theme.css`), which is the boundary the `lg:`
 *    utilities in `AppShell` use, and the same 1024px as oracle 4.
 *
 * jsdom does not implement `window.matchMedia` (verified against jsdom 29), so
 * the viewport is stubbed per test — that stub *is* the test's viewport, and
 * nothing in the assertions depends on CSS having been applied.
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

// Bounds chosen to differ from every number in the source implementation.
const LEFT_MIN = 210;
const LEFT_MAX = 480;
const RIGHT_MIN = 190;
const RIGHT_MAX = 530;

function leftPane(overrides: Partial<WorkspacePane> = {}): WorkspacePane {
  return {
    content: <p>Verlaufs-Inhalt</p>,
    label: "Verlauf",
    isOpen: true,
    width: 320,
    minWidth: LEFT_MIN,
    maxWidth: LEFT_MAX,
    onOpenChange: vi.fn(),
    onWidthChange: vi.fn(),
    expandLabel: "Verlauf ausklappen",
    collapseLabel: "Verlauf einklappen",
    resizeLabel: "Breite des Verlaufs ändern",
    ...overrides,
  };
}

function rightPane(overrides: Partial<WorkspacePane> = {}): WorkspacePane {
  return {
    content: <p>Quellen-Inhalt</p>,
    label: "Quellen",
    isOpen: true,
    width: 280,
    minWidth: RIGHT_MIN,
    maxWidth: RIGHT_MAX,
    onOpenChange: vi.fn(),
    onWidthChange: vi.fn(),
    expandLabel: "Quellen ausklappen",
    collapseLabel: "Quellen einklappen",
    resizeLabel: "Breite der Quellen ändern",
    ...overrides,
  };
}

// Four tabs on three panes — the shape the source implementation has, and the
// reason the tab→pane mapping is consumer data instead of a derivation here.
const TABS: WorkspaceMobileTab[] = [
  { id: "history", icon: <History />, label: "Verlauf", pane: "left" },
  { id: "chat", icon: <MessageSquare />, label: "Chat", pane: "main" },
  { id: "workspace", icon: <Sparkles />, label: "Workspace", pane: "main" },
  { id: "files", icon: <FolderOpen />, label: "Quellen", pane: "right" },
];

function renderWorkspace(
  props: Partial<React.ComponentProps<typeof WorkspaceLayout>> = {},
) {
  return render(
    <WorkspaceLayout
      left={leftPane()}
      right={rightPane()}
      mainLabel="Arbeitsbereich"
      mobileTabs={TABS}
      activeMobileTab="chat"
      onMobileTabChange={() => {}}
      mobileTabBarLabel="Bereichswechsel"
      {...props}
    >
      <p>Haupt-Inhalt</p>
    </WorkspaceLayout>,
  );
}

describe("WorkspaceLayout — desktop arrangement", () => {
  it("puts the three areas on screen as separately named landmarks", () => {
    stubViewport(true);
    renderWorkspace();

    expect(screen.getByRole("complementary", { name: "Verlauf" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Arbeitsbereich" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Quellen" })).toBeInTheDocument();
    // The tab bar is the only `navigation` landmark this template renders, and
    // it belongs to the narrow-screen arrangement only.
    expect(screen.queryAllByRole("navigation")).toHaveLength(0);
  });

  it("keeps the main area out of a second <main> element", () => {
    stubViewport(true);
    const { container } = renderWorkspace();
    // A nested <main> is invalid HTML (and a second `main` landmark), which is
    // what this template would produce if it claimed the element for itself —
    // it is documented to nest inside AppShellLayout, whose children already
    // sit in one.
    expect(container.querySelectorAll("main")).toHaveLength(0);
  });

  it("hands each pane's own bounds and width to its resize handle", () => {
    stubViewport(true);
    renderWorkspace();

    const leftHandle = screen.getByRole("separator", { name: "Breite des Verlaufs ändern" });
    expect(leftHandle).toHaveAttribute("aria-valuemin", String(LEFT_MIN));
    expect(leftHandle).toHaveAttribute("aria-valuemax", String(LEFT_MAX));
    expect(leftHandle).toHaveAttribute("aria-valuenow", "320");

    const rightHandle = screen.getByRole("separator", { name: "Breite der Quellen ändern" });
    expect(rightHandle).toHaveAttribute("aria-valuemin", String(RIGHT_MIN));
    expect(rightHandle).toHaveAttribute("aria-valuemax", String(RIGHT_MAX));
    expect(rightHandle).toHaveAttribute("aria-valuenow", "280");
  });

  it("renders no resize handle next to a collapsed pane", () => {
    stubViewport(true);
    renderWorkspace({ left: leftPane({ isOpen: false }) });

    expect(
      screen.queryByRole("separator", { name: "Breite des Verlaufs ändern" }),
    ).not.toBeInTheDocument();
    // The other pane is untouched — the gate is per pane, not global.
    expect(
      screen.getByRole("separator", { name: "Breite der Quellen ändern" }),
    ).toBeInTheDocument();
  });

  it("reports a collapse and an expand to the pane's own handler", async () => {
    stubViewport(true);
    const open = leftPane();
    renderWorkspace({ left: open });
    await userEvent.click(screen.getByRole("button", { name: "Verlauf einklappen" }));
    expect(open.onOpenChange).toHaveBeenCalledWith(false);

    const collapsed = leftPane({ isOpen: false });
    renderWorkspace({ left: collapsed });
    await userEvent.click(screen.getByRole("button", { name: "Verlauf ausklappen" }));
    expect(collapsed.onOpenChange).toHaveBeenCalledWith(true);
  });

  it("reports a keyboard resize to the pane's own handler", async () => {
    stubViewport(true);
    const pane = leftPane();
    renderWorkspace({ left: pane });

    const handle = screen.getByRole("separator", { name: "Breite des Verlaufs ändern" });
    handle.focus();
    // ResizeHandle's documented keyboard contract: a left pane grows on
    // ArrowRight, by its default step of 10.
    await userEvent.keyboard("{ArrowRight}");
    expect(pane.onWidthChange).toHaveBeenCalledWith(330);
  });
});

describe("WorkspaceLayout — hidden is not collapsed", () => {
  it("takes a hidden right pane out of the desktop arrangement without collapsing it", () => {
    stubViewport(true);
    const pane = rightPane();
    const { rerender } = render(
      <WorkspaceLayout
        left={leftPane()}
        right={pane}
        showRight={false}
        mainLabel="Arbeitsbereich"
        mobileTabs={TABS}
        activeMobileTab="chat"
        onMobileTabChange={() => {}}
        mobileTabBarLabel="Bereichswechsel"
      >
        <p>Haupt-Inhalt</p>
      </WorkspaceLayout>,
    );

    expect(screen.queryByRole("complementary", { name: "Quellen" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("separator", { name: "Breite der Quellen ändern" }),
    ).not.toBeInTheDocument();
    // The whole point: hiding must not travel through the consumer's collapse
    // state (the source implementation's bug was hiding *by* collapsing, which
    // left the pane collapsed once the app state passed).
    expect(pane.onOpenChange).not.toHaveBeenCalled();

    rerender(
      <WorkspaceLayout
        left={leftPane()}
        right={pane}
        mainLabel="Arbeitsbereich"
        mobileTabs={TABS}
        activeMobileTab="chat"
        onMobileTabChange={() => {}}
        mobileTabBarLabel="Bereichswechsel"
      >
        <p>Haupt-Inhalt</p>
      </WorkspaceLayout>,
    );

    expect(screen.getByRole("complementary", { name: "Quellen" })).toBeInTheDocument();
    // Expanded again, because `isOpen` was never touched.
    expect(screen.getByText("Quellen-Inhalt")).toBeVisible();
  });

  it("leaves no pane and no handle when the right slot is omitted", () => {
    stubViewport(true);
    renderWorkspace({ right: undefined });

    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    expect(screen.getAllByRole("separator")).toHaveLength(1);
  });
});

describe("WorkspaceLayout — narrow-screen arrangement", () => {
  it.each([
    ["history", "Verlauf"],
    ["chat", null],
    ["workspace", null],
    ["files", "Quellen"],
  ] as const)(
    "shows exactly the one area tab %s declares",
    (activeMobileTab, paneName) => {
      stubViewport(false);
      renderWorkspace({ activeMobileTab });

      const complementary = screen.queryAllByRole("complementary");
      if (paneName === null) {
        expect(screen.getByRole("region", { name: "Arbeitsbereich" })).toBeInTheDocument();
        expect(complementary).toHaveLength(0);
      } else {
        expect(complementary).toHaveLength(1);
        expect(complementary[0]).toHaveAccessibleName(paneName);
        expect(screen.queryByRole("region", { name: "Arbeitsbereich" })).not.toBeInTheDocument();
      }
    },
  );

  it("marks exactly one tab as the current one", () => {
    stubViewport(false);
    renderWorkspace({ activeMobileTab: "workspace" });

    const current = document.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName("Workspace");
    expect(screen.getByRole("navigation", { name: "Bereichswechsel" })).toBeInTheDocument();
  });

  it("still reaches a pane that is hidden on desktop", () => {
    stubViewport(false);
    renderWorkspace({ activeMobileTab: "files", showRight: false });
    // Oracle 4: the source implementation's mobile branch renders the sources
    // panel without consulting its hide flag — hiding buys horizontal space,
    // and one area on screen has none to win.
    expect(screen.getByRole("complementary", { name: "Quellen" })).toBeInTheDocument();
  });

  it("opens the shown pane whatever its collapse state, with no collapse control", () => {
    stubViewport(false);
    const pane = leftPane({ isOpen: false });
    renderWorkspace({ left: pane, activeMobileTab: "history" });

    expect(screen.getByText("Verlaufs-Inhalt")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Verlauf ausklappen" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Verlauf einklappen" })).not.toBeInTheDocument();
    // A collapse control here would destroy the desktop preference on a
    // viewport where it has no effect.
    expect(pane.onOpenChange).not.toHaveBeenCalled();
  });

  it("falls back to the main area for a tab that maps to a pane this workspace lacks", () => {
    stubViewport(false);
    renderWorkspace({ right: undefined, activeMobileTab: "files" });

    expect(screen.getByRole("region", { name: "Arbeitsbereich" })).toBeInTheDocument();
    expect(screen.queryAllByRole("complementary")).toHaveLength(0);
  });

  it("reports a tab change without deciding anything about it", async () => {
    stubViewport(false);
    const onMobileTabChange = vi.fn();
    renderWorkspace({ onMobileTabChange });

    await userEvent.click(screen.getByRole("button", { name: "Quellen" }));
    expect(onMobileTabChange).toHaveBeenCalledWith("files");
  });

  it("reserves the tab bar's height so its content is not covered", () => {
    stubViewport(false);
    renderWorkspace();

    // The bar is `fixed`, `h-15` = 15 × 0.25rem = 3.75rem = 60px at the
    // default root size — the same „chrome unit" as the collapsed rail, which
    // is why the reserved space is that exported constant and not a second
    // literal. Only the 60px is asserted, not the whole declaration: jsdom's
    // CSS parser garbles the nested `env()` (measured: it stores
    // „calc(60px + env(0px * , * safe-area-inset-bottom))"), so the safe-area
    // half of this padding is only verifiable in a real browser.
    expect(bottomTabBarVariants()).toContain("h-15");
    expect(SIDE_PANEL_RAIL_WIDTH).toBe(60);
    expect(
      screen.getByRole("region", { name: "Arbeitsbereich" }).getAttribute("style"),
    ).toContain(`${SIDE_PANEL_RAIL_WIDTH}px`);
  });

  it("passes root attributes through, so swipe handling stays in the app", () => {
    stubViewport(false);
    const onTouchStart = vi.fn();
    const onTouchEnd = vi.fn();
    renderWorkspace({ onTouchStart, onTouchEnd, "data-testid": "workspace" } as Partial<
      React.ComponentProps<typeof WorkspaceLayout>
    >);

    const root = screen.getByTestId("workspace");
    fireEvent.touchStart(root);
    fireEvent.touchEnd(root);
    expect(onTouchStart).toHaveBeenCalledTimes(1);
    expect(onTouchEnd).toHaveBeenCalledTimes(1);
  });
});

describe("WorkspaceLayout — viewport switch", () => {
  it("asks for Tailwind's own lg boundary", () => {
    stubViewport(true);
    renderWorkspace();
    // Oracle 5: `--breakpoint-lg: 64rem` in Tailwind's theme, i.e. the exact
    // boundary of the `lg:` utilities AppShell switches its drawer at.
    expect(askedQueries).toContain("(min-width: 64rem)");
  });

  it("renders the desktop arrangement on a server, without touching the DOM", () => {
    // The third argument of `useSyncExternalStore` is the server snapshot and
    // only ever runs during SSR/hydration, so it is unreachable from a
    // `render()` — this is the one path that exercises it. Oracle: React's
    // documented SSR contract for the hook (a missing server snapshot throws),
    // plus the requirement that a shared library not crash while rendered on
    // a server. `renderToString` runs without `window` at all.
    const html = renderToString(
      <WorkspaceLayout
        left={leftPane()}
        right={rightPane()}
        mainLabel="Arbeitsbereich"
        mobileTabs={TABS}
        activeMobileTab="chat"
        onMobileTabChange={() => {}}
        mobileTabBarLabel="Bereichswechsel"
      >
        <p>Haupt-Inhalt</p>
      </WorkspaceLayout>,
    );
    expect(html).toContain('aria-label="Verlauf"');
    expect(html).toContain('aria-label="Quellen"');
    expect(html).toContain('aria-label="Arbeitsbereich"');
    // …and not the narrow-screen arrangement, whose bar is the tell.
    expect(html).not.toContain('aria-label="Bereichswechsel"');
  });

  it("falls back to the desktop arrangement where matchMedia does not exist", () => {
    vi.stubGlobal("matchMedia", undefined);
    renderWorkspace();
    // A consumer's jsdom test renders this template without a matchMedia
    // polyfill; keeping every area in the tree is the useful degradation.
    expect(screen.getByRole("complementary", { name: "Verlauf" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Quellen" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Arbeitsbereich" })).toBeInTheDocument();
  });
});

describe("WorkspaceLayout — nested in AppShellLayout", () => {
  it("is the page content of the app shell, inside its single <main>", () => {
    stubViewport(true);
    render(
      <ThemeProvider>
        <AppShellLayout
          logo={<span>Marke</span>}
          pageLabel="Wissensbasis"
          navLabel="Hauptnavigation"
          nav={<NavItem active>Übersicht</NavItem>}
        >
          <WorkspaceLayout
            left={leftPane()}
            right={rightPane()}
            mainLabel="Arbeitsbereich"
            mobileTabs={TABS}
            activeMobileTab="chat"
            onMobileTabChange={() => {}}
            mobileTabBarLabel="Bereichswechsel"
          >
            <p>Haupt-Inhalt</p>
          </WorkspaceLayout>
        </AppShellLayout>
      </ThemeProvider>,
    );

    // Oracle 1: one `main` per document. Nesting must not add a second one,
    // and the workspace's own landmarks have to survive the nesting.
    const mains = screen.getAllByRole("main");
    expect(mains).toHaveLength(1);
    expect(mains[0]).toContainElement(screen.getByRole("region", { name: "Arbeitsbereich" }));
    expect(mains[0]).toContainElement(
      screen.getByRole("complementary", { name: "Verlauf" }),
    );
    expect(mains[0]).toContainElement(
      screen.getByRole("complementary", { name: "Quellen" }),
    );
    // The shell's own navigation is still the only one on a desktop viewport.
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(screen.getByText("Haupt-Inhalt")).toBeVisible();
  });
});
