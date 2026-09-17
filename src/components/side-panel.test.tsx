import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidePanel } from "./side-panel";
import { SIDE_PANEL_RAIL_WIDTH } from "./side-panel-variants";
import { useSidebarCollapsed } from "./sidebar-context";

/**
 * Oracles used here are external to the component:
 *
 * 1. **ARIA in HTML / WAI-ARIA disclosure pattern** — the toggle exposes
 *    `aria-expanded` and identifies the region it controls with
 *    `aria-controls`; a subtree carrying the `hidden` attribute is removed from
 *    the accessibility tree, so „only the expand control exists while
 *    collapsed" is checkable as „the accessible tree contains that one button
 *    and not the panel content". Testing Library's `getByRole` implements that
 *    exclusion, and jest-dom's `toBeVisible` implements the `hidden`
 *    semantics — neither reads our class names.
 * 2. **The card's / consumer's stated frame contract** — collapsed rail 60px,
 *    expanded width = the `width` prop, `collapsedPreview` only while
 *    collapsed, children mounted across a collapse.
 * 3. **lucide's own icon-class naming** (`lucide-<kebab-icon-name>`, added by
 *    the library, not by us) — pins that `side` selects PanelLeftClose vs
 *    PanelRightClose.
 * 5. **The package's own published hook contract** (`useSidebarCollapsed`,
 *    exported from the barrel and documented as "whether the surrounding nav
 *    column is rendering its collapsed form") — read through a probe component
 *    that is not part of the component under test. This is the contract
 *    `NavItem` and `SidebarUserMenu` consume, so it is what actually decides
 *    whether they shrink; asserting it directly is narrower and less brittle
 *    than driving a tooltip or reading `sr-only` off a class.
 * 4. **DOM's `Node.compareDocumentPosition`** (WHATWG DOM §4.4) — a browser
 *    API, not ours, and the same order a screen reader and the tab sequence
 *    follow. It is what makes „the toggle is on the content-facing edge"
 *    checkable without reading a class name or a computed style (jsdom has no
 *    layout, so a geometric oracle is not available at all here).
 */

const LABELS = {
  expandLabel: "Verlauf ausklappen",
  collapseLabel: "Verlauf einklappen",
};

describe("SidePanel", () => {
  describe("expanded", () => {
    it("shows the content and only the collapse control", () => {
      render(
        <SidePanel side="left" isOpen width={320} onExpand={() => {}} onCollapse={() => {}} {...LABELS}>
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      expect(screen.getByText("Panel-Inhalt")).toBeVisible();
      const collapse = screen.getByRole("button", { name: LABELS.collapseLabel });
      expect(collapse).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.queryByRole("button", { name: LABELS.expandLabel }),
      ).not.toBeInTheDocument();
    });

    it("uses the width prop", () => {
      render(
        <SidePanel side="left" isOpen width={320} onExpand={() => {}} onCollapse={() => {}} aria-label="Verlauf" {...LABELS}>
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      expect(screen.getByRole("complementary", { name: "Verlauf" })).toHaveStyle({
        width: "320px",
      });
    });

    it("reports the collapse click", async () => {
      const onCollapse = vi.fn();
      render(
        <SidePanel side="left" isOpen width={320} onExpand={() => {}} onCollapse={onCollapse} {...LABELS}>
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      await userEvent.click(
        screen.getByRole("button", { name: LABELS.collapseLabel }),
      );
      expect(onCollapse).toHaveBeenCalledTimes(1);
    });
  });

  describe("collapsed", () => {
    it("leaves the expand control as the only control, with the content mounted but not perceivable", () => {
      render(
        <SidePanel
          side="left"
          isOpen={false}
          width={320}
          onExpand={() => {}}
          onCollapse={() => {}}
          collapsedPreview={<span>3 Einträge</span>}
          {...LABELS}
        >
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      const expand = screen.getByRole("button", { name: LABELS.expandLabel });
      expect(expand).toHaveAttribute("aria-expanded", "false");
      expect(screen.getAllByRole("button")).toEqual([expand]);
      expect(screen.getByText("3 Einträge")).toBeVisible();

      // Mounted (scroll position / half-typed input survive) but hidden.
      expect(screen.getByText("Panel-Inhalt")).toBeInTheDocument();
      expect(screen.getByText("Panel-Inhalt")).not.toBeVisible();
    });

    it("shrinks to the 60px rail", () => {
      render(
        <SidePanel side="left" isOpen={false} width={320} onExpand={() => {}} onCollapse={() => {}} aria-label="Verlauf" {...LABELS}>
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      // 60px is the constant from the source material, asserted literally so the
      // exported number cannot drift silently.
      expect(screen.getByRole("complementary", { name: "Verlauf" })).toHaveStyle({
        width: "60px",
      });
      expect(SIDE_PANEL_RAIL_WIDTH).toBe(60);
    });

    it("renders no collapsedPreview when none is given", () => {
      render(
        <SidePanel side="left" isOpen={false} width={320} onExpand={() => {}} onCollapse={() => {}} {...LABELS}>
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      expect(screen.getAllByRole("button")).toHaveLength(1);
    });

    it("reports the expand click", async () => {
      const onExpand = vi.fn();
      render(
        <SidePanel side="left" isOpen={false} width={320} onExpand={onExpand} onCollapse={() => {}} {...LABELS}>
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      await userEvent.click(
        screen.getByRole("button", { name: LABELS.expandLabel }),
      );
      expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it("hides the preview again once expanded", () => {
      render(
        <SidePanel
          side="left"
          isOpen
          width={320}
          onExpand={() => {}}
          onCollapse={() => {}}
          collapsedPreview={<span>3 Einträge</span>}
          {...LABELS}
        >
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      expect(screen.queryByText("3 Einträge")).not.toBeInTheDocument();
    });
  });

  /**
   * `header` — Oracle 1 (the accessibility tree: the collapsed body carries
   * the `hidden` attribute, so „only the expand control exists while
   * collapsed" is a tree question) plus Oracle 4 for the order. Every query is
   * by role or by the consumer's own text; no class name and no style is read,
   * so the assertions survive any restyling of the row.
   */
  describe("header slot", () => {
    it("renders the header inline with the collapse toggle while expanded", () => {
      render(
        <SidePanel
          side="left"
          isOpen
          width={320}
          onExpand={() => {}}
          onCollapse={() => {}}
          header={<h2>Verlauf</h2>}
          {...LABELS}
        >
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      const title = screen.getByRole("heading", { name: "Verlauf" });
      expect(title).toBeVisible();
      // Inline WITH the toggle, not stacked above it: both are children of the
      // same row element. Asserted through the DOM's own parent relation.
      const collapse = screen.getByRole("button", { name: LABELS.collapseLabel });
      expect(title.parentElement?.parentElement).toBe(collapse.parentElement);
    });

    it("drops the header entirely while collapsed", () => {
      render(
        <SidePanel
          side="left"
          isOpen={false}
          width={320}
          onExpand={() => {}}
          onCollapse={() => {}}
          header={<h2>Verlauf</h2>}
          collapsedPreview={<span>3 Einträge</span>}
          {...LABELS}
        >
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      // Not merely invisible: absent. The rail holds the expand button and
      // `collapsedPreview` and nothing else — the same contract
      // `collapsedPreview` is held to in the opposite direction above.
      expect(screen.queryByRole("heading", { name: "Verlauf" })).not.toBeInTheDocument();
      expect(screen.queryByText("Verlauf")).not.toBeInTheDocument();
      expect(screen.getByText("3 Einträge")).toBeVisible();
      expect(screen.getAllByRole("button")).toEqual([
        screen.getByRole("button", { name: LABELS.expandLabel }),
      ]);
    });

    it("renders no header wrapper when none is given", () => {
      render(
        <SidePanel side="left" isOpen width={320} onExpand={() => {}} onCollapse={() => {}} {...LABELS}>
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      // The row still exists and still holds exactly one control — the slot is
      // additive, an omitted `header` changes nothing.
      const collapse = screen.getByRole("button", { name: LABELS.collapseLabel });
      expect(collapse.parentElement?.childElementCount).toBe(1);
    });
  });

  /**
   * Oracle 4. The toggle is the control that faces the main content, so on a
   * LEFT pane it must come after the header (trailing edge) and on a RIGHT
   * pane before it (leading edge). `compareDocumentPosition` returns
   * `DOCUMENT_POSITION_FOLLOWING` (4) when the argument follows the node it is
   * called on — a DOM-spec constant, not a number of ours.
   */
  it.each([
    { side: "left", order: "toggle follows the header" },
    { side: "right", order: "toggle precedes the header" },
  ] as const)(
    "puts the $side pane's toggle on the content-facing edge ($order)",
    ({ side }) => {
      render(
        <SidePanel
          side={side}
          isOpen
          width={320}
          onExpand={() => {}}
          onCollapse={() => {}}
          header={<h2>Verlauf</h2>}
          {...LABELS}
        >
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      const title = screen.getByRole("heading", { name: "Verlauf" });
      const collapse = screen.getByRole("button", { name: LABELS.collapseLabel });
      const toggleFollowsHeader = Boolean(
        title.compareDocumentPosition(collapse) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(toggleFollowsHeader).toBe(side === "left");

      // And the mirror image, so a change that made BOTH true (or both false)
      // cannot pass: exactly one of the two relations holds.
      const headerFollowsToggle = Boolean(
        collapse.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(headerFollowsToggle).toBe(side === "right");
    },
  );

  /*
    REGRESSION (0.30.0). `AppShell`'s nav column moved from `Sidebar` to this
    frame, but only `Sidebar` provided `SidebarCollapsedContext` — so inside a
    60px rail `NavItem` and `SidebarUserMenu` read the context DEFAULT, false,
    and rendered their full-width form. The whole suite stayed green through
    that, which is why these two tests exist: nothing here had ever asserted
    what the frame publishes to its own subtree.
  */
  describe("publishes its collapsed state to the subtree", () => {
    function Probe() {
      return <span data-testid="probe">{String(useSidebarCollapsed())}</span>;
    }

    it.each([
      ["collapsed", false, "true"],
      ["expanded", true, "false"],
    ])("a %s pane", (_name, isOpen, expected) => {
      render(
        <SidePanel
          side="left"
          isOpen={isOpen}
          width={320}
          onExpand={() => {}}
          onCollapse={() => {}}
          {...LABELS}
          footer={<Probe />}
        >
          <p>Inhalt</p>
        </SidePanel>,
      );

      expect(screen.getByTestId("probe")).toHaveTextContent(expected);
    });
  });

  describe("footer", () => {
    function renderWithFooter(isOpen: boolean) {
      return render(
        <SidePanel
          side="left"
          isOpen={isOpen}
          width={320}
          onExpand={() => {}}
          onCollapse={() => {}}
          {...LABELS}
          footer={<button type="button">Abmelden</button>}
        >
          <p>Inhalt</p>
        </SidePanel>,
      );
    }

    /*
      The point of the slot: `header` is dropped from the rail, `footer` is not.
      `toBeVisible` is the `hidden`-attribute oracle (oracle 1) — a footer left
      inside the collapsed body would still be IN the document, so
      `getByRole` alone would pass while the control was unreachable.
    */
    it.each([
      ["expanded", true],
      ["collapsed", false],
    ])("stays reachable while %s", (_name, isOpen) => {
      renderWithFooter(isOpen);
      expect(screen.getByRole("button", { name: "Abmelden" })).toBeVisible();
    });

    it("is outside the region the toggle collapses", () => {
      renderWithFooter(false);
      const body = document.getElementById(
        screen.getByRole("button", { name: LABELS.expandLabel }).getAttribute("aria-controls")!,
      );
      const footer = screen.getByRole("button", { name: "Abmelden" });
      expect(body).not.toBeNull();
      expect(body!.contains(footer)).toBe(false);
    });
  });

  it("points aria-controls at the region that holds the children", () => {
    render(
      <SidePanel side="left" isOpen width={320} onExpand={() => {}} onCollapse={() => {}} {...LABELS}>
        <p>Panel-Inhalt</p>
      </SidePanel>,
    );
    const controls = screen
      .getByRole("button", { name: LABELS.collapseLabel })
      .getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    const region = document.getElementById(controls as string);
    expect(region).not.toBeNull();
    expect(region).toContainElement(screen.getByText("Panel-Inhalt"));
  });

  /**
   * Oracle 3 (lucide's icon-class naming) plus the direction read off lucide's
   * own path data, which is what makes „outward" checkable rather than a matter
   * of taste:
   *
   *   panel-left-close  chevron „m16 15-3-3 3-3" -> apex x=13, arms x=16 -> LEFT
   *   panel-left-open   chevron „m14 9 3 3-3 3"  -> apex x=17, arms x=14 -> RIGHT
   *   panel-right-close chevron „m8 9 3 3-3 3"   -> apex x=11, arms x=8   -> RIGHT
   *   panel-right-open  chevron „m10 15-3-3 3-3" -> apex x=7,  arms x=10  -> LEFT
   *
   * A control's affordance must point the way it moves the pane: collapsing a
   * left pane pushes it left, expanding it pulls it right — so the two buttons
   * need DIFFERENT icons, and each state has to be asserted in its own render.
   * The icon is queried inside the button, not anywhere in the tree, so the
   * assertion is about that control.
   */
  it.each([
    ["left", "lucide-panel-left-close"],
    ["right", "lucide-panel-right-close"],
  ] as const)(
    "points the COLLAPSE chevron away from the content on a %s panel",
    (side, iconClass) => {
      render(
        <SidePanel side={side} isOpen width={320} onExpand={() => {}} onCollapse={() => {}} {...LABELS}>
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      const collapse = screen.getByRole("button", { name: LABELS.collapseLabel });
      expect(collapse.querySelector(`.${iconClass}`)).not.toBeNull();
    },
  );

  it.each([
    ["left", "lucide-panel-left-open"],
    ["right", "lucide-panel-right-open"],
  ] as const)(
    "points the EXPAND chevron toward the content on a %s panel",
    (side, iconClass) => {
      // The collapsed rail's expand button is the only control that exists in
      // that state; pointing its chevron at the collapse direction would make
      // the one visible affordance contradict its action.
      render(
        <SidePanel side={side} isOpen={false} width={320} onExpand={() => {}} onCollapse={() => {}} {...LABELS}>
          <p>Panel-Inhalt</p>
        </SidePanel>,
      );
      const expand = screen.getByRole("button", { name: LABELS.expandLabel });
      expect(expand.querySelector(`.${iconClass}`)).not.toBeNull();
    },
  );
});
