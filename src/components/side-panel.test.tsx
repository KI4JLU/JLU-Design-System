import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidePanel } from "./side-panel";
import { SIDE_PANEL_RAIL_WIDTH } from "./side-panel-variants";

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
