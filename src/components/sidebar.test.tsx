import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./sidebar";
import { NavItem } from "./nav-item";
import { SidebarUserMenu } from "./sidebar-user-menu";
import { DropdownMenuItem } from "./dropdown-menu";

/**
 * Oracles, all external to `sidebar.tsx`:
 *
 * 1. **The WAI-ARIA disclosure pattern / ARIA in HTML.** The toggle exposes
 *    `aria-expanded` and names the region it controls with `aria-controls`;
 *    the accessible name of every control is computed by
 *    dom-accessibility-api inside Testing Library's `getByRole({ name })`,
 *    which implements the accname spec and reads none of our class names.
 *    This is what makes "every nav row keeps an accessible name while
 *    collapsed" a checkable statement rather than a claim about markup.
 * 2. **React's controlled-component contract.** A controlled component
 *    re-renders only from the props it is given. Pressing the toggle while the
 *    parent ignores `onCollapsedChange` must therefore change *nothing* — that
 *    is the whole difference between this and a component with a
 *    `defaultCollapsed`, and it cannot be faked by a component that keeps
 *    internal state.
 * 3. **`src/tokens.css` as the width source.** Here only the *reference* is
 *    asserted (the utility names the token, so no magic number reaches the
 *    markup). That the token also resolves to a real width is asserted where
 *    CSS actually runs — `sidebar.stories.tsx`, in Chromium, against the value
 *    declared in `tokens.css`. jsdom compiles no Tailwind and could not tell a
 *    working utility from a typo.
 */

const LABELS = {
  collapseLabel: "Navigation einklappen",
  expandLabel: "Navigation ausklappen",
};

const rows = (
  <>
    <NavItem label="Übersicht" active>
      <svg aria-hidden />
      <span>Übersicht</span>
    </NavItem>
    <NavItem label="Team">
      <svg aria-hidden />
      <span>Team</span>
    </NavItem>
  </>
);

const userMenu = (
  <SidebarUserMenu initials="JL" name="Jamie Lee" role="Admin">
    <DropdownMenuItem>Abmelden</DropdownMenuItem>
  </SidebarUserMenu>
);

/**
 * What the accname algorithm computes for the user-menu trigger — the name and
 * the role line concatenated with no separator, because both sit in inline-ish
 * boxes. Pinned as one constant so the expanded and the collapsed assertion
 * cannot drift apart; the missing space is **pre-existing** (v0.25.0 renders
 * the same two spans) and not changed here.
 * TODO: the separator is arguably a defect in `SidebarUserMenu`'s markup, but
 * fixing it changes a published accessible name — not this card's call.
 */
const USER_MENU_NAME = "Jamie LeeAdmin";

describe("Sidebar", () => {
  describe("without onCollapsedChange", () => {
    it("renders no toggle", () => {
      render(<Sidebar header={<span>Marke</span>}>{rows}</Sidebar>);
      expect(
        screen.queryByRole("button", { name: LABELS.collapseLabel }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: LABELS.expandLabel }),
      ).not.toBeInTheDocument();
    });

    it("keeps the expanded width token", () => {
      const { container } = render(<Sidebar>{rows}</Sidebar>);
      expect(container.querySelector("aside")).toHaveClass("w-(--width-sidebar)");
    });
  });

  describe("expanded, with a handler", () => {
    it("shows the collapse control, wired to the nav landmark", () => {
      render(
        <Sidebar header={<span>Marke</span>} onCollapsedChange={() => {}} {...LABELS}>
          {rows}
        </Sidebar>,
      );
      const toggle = screen.getByRole("button", { name: LABELS.collapseLabel });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      // aria-controls must resolve to the navigation landmark itself.
      const controlled = document.getElementById(toggle.getAttribute("aria-controls")!);
      expect(controlled).toBe(screen.getByRole("navigation", { name: "Hauptnavigation" }));
    });

    it("renders the toggle after the brand node in the header row", () => {
      render(
        <Sidebar header={<span>Marke</span>} onCollapsedChange={() => {}} {...LABELS}>
          {rows}
        </Sidebar>,
      );
      const toggle = screen.getByRole("button", { name: LABELS.collapseLabel });
      const brand = screen.getByText("Marke");
      const row = toggle.parentElement!;
      // Same row, and the toggle comes last — DOM order is what "right-aligned
      // inline with the brand" means for a reading order and for a keyboard
      // user; the `ml-auto` that turns it into right alignment is asserted in
      // the browser story, where CSS runs.
      expect(row).toContainElement(brand);
      expect(
        brand.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(toggle).toHaveClass("ml-auto");
    });

    it("requests the collapsed state on click", async () => {
      const onCollapsedChange = vi.fn();
      render(
        <Sidebar onCollapsedChange={onCollapsedChange} {...LABELS}>
          {rows}
        </Sidebar>,
      );
      await userEvent.click(screen.getByRole("button", { name: LABELS.collapseLabel }));
      expect(onCollapsedChange).toHaveBeenCalledTimes(1);
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
    });
  });

  describe("controlled, with no state of its own", () => {
    it("does not collapse itself when the parent ignores the change", async () => {
      const onCollapsedChange = vi.fn();
      const { container } = render(
        <Sidebar collapsed={false} onCollapsedChange={onCollapsedChange} {...LABELS}>
          {rows}
        </Sidebar>,
      );
      await userEvent.click(screen.getByRole("button", { name: LABELS.collapseLabel }));
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
      // Nothing moved: still expanded, still the same control, same width.
      expect(container.querySelector("aside")).toHaveClass("w-(--width-sidebar)");
      expect(
        screen.getByRole("button", { name: LABELS.collapseLabel }),
      ).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.queryByRole("button", { name: LABELS.expandLabel }),
      ).not.toBeInTheDocument();
    });

    it("follows the prop when the parent does update it", () => {
      const { container, rerender } = render(
        <Sidebar collapsed={false} onCollapsedChange={() => {}} {...LABELS}>
          {rows}
        </Sidebar>,
      );
      rerender(
        <Sidebar collapsed onCollapsedChange={() => {}} {...LABELS}>
          {rows}
        </Sidebar>,
      );
      expect(container.querySelector("aside")).toHaveClass(
        "w-(--width-sidebar-collapsed)",
      );
    });
  });

  describe("collapsed", () => {
    const renderCollapsed = () =>
      render(
        <Sidebar
          collapsed
          onCollapsedChange={() => {}}
          header={<span>Marke</span>}
          footer={userMenu}
          {...LABELS}
        >
          {rows}
        </Sidebar>,
      );

    it("uses the collapsed width token, not a hardcoded width", () => {
      const { container } = renderCollapsed();
      const aside = container.querySelector("aside")!;
      expect(aside).toHaveClass("w-(--width-sidebar-collapsed)");
      expect(aside).not.toHaveClass("w-(--width-sidebar)");
      // No px/rem literal anywhere on the column or in an inline style.
      expect(aside.getAttribute("style")).toBeNull();
      expect(aside.className).not.toMatch(/w-\[/);
    });

    it("turns the control into the expand control, which requests false", async () => {
      const onCollapsedChange = vi.fn();
      render(
        <Sidebar collapsed onCollapsedChange={onCollapsedChange} {...LABELS}>
          {rows}
        </Sidebar>,
      );
      const toggle = screen.getByRole("button", { name: LABELS.expandLabel });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(toggle);
      expect(onCollapsedChange).toHaveBeenCalledWith(false);
    });

    it("drops the brand node but keeps the toggle", () => {
      renderCollapsed();
      expect(screen.queryByText("Marke")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: LABELS.expandLabel })).toBeInTheDocument();
    });

    it("keeps an accessible name on every navigation row", () => {
      renderCollapsed();
      const nav = screen.getByRole("navigation", { name: "Hauptnavigation" });
      const items = within(nav).getAllByRole("button");
      expect(items).toHaveLength(2);
      // The names come from the accname computation, not from our markup.
      expect(items.map((i) => i.getAttribute("aria-label"))).toEqual(["Übersicht", "Team"]);
      expect(within(nav).getByRole("button", { name: "Übersicht" })).toBe(items[0]);
      expect(within(nav).getByRole("button", { name: "Team" })).toBe(items[1]);
      // …and the active row is still marked as such.
      expect(items[0]).toHaveAttribute("aria-current", "page");
    });

    it("gives every row a tooltip carrying the same text", async () => {
      renderCollapsed();
      const item = screen.getByRole("button", { name: "Team" });
      await userEvent.hover(item);
      await waitFor(() => expect(item).toHaveAttribute("aria-describedby"));
      const tip = document.getElementById(item.getAttribute("aria-describedby")!);
      expect(tip).toHaveAttribute("role", "tooltip");
      expect(tip).toHaveTextContent("Team");
      // The tooltip describes; it does not become the name.
      expect(screen.getByRole("button", { name: "Team" })).toBe(item);
    });

    it("keeps the user menu reachable, with an unchanged accessible name", async () => {
      renderCollapsed();
      const trigger = screen.getByRole("button", { name: USER_MENU_NAME });
      await userEvent.click(trigger);
      expect(await screen.findByRole("menuitem", { name: "Abmelden" })).toBeInTheDocument();
    });
  });

  it("gives the user menu the same accessible name expanded and collapsed", () => {
    const { unmount } = render(<Sidebar footer={userMenu}>{rows}</Sidebar>);
    expect(screen.getByRole("button", { name: /Jamie Lee/ })).toHaveAccessibleName(
      USER_MENU_NAME,
    );
    unmount();
    render(
      <Sidebar collapsed onCollapsedChange={() => {}} footer={userMenu} {...LABELS}>
        {rows}
      </Sidebar>,
    );
    expect(screen.getByRole("button", { name: /Jamie Lee/ })).toHaveAccessibleName(
      USER_MENU_NAME,
    );
  });
});
