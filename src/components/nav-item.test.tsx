import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavItem } from "./nav-item";
import { Sidebar } from "./sidebar";

/** A row inside a `Sidebar` in the given collapsed state — the only way to
 *  reach the collapsed form, since it is not a consumer prop. */
const inSidebar = (collapsed: boolean, row: React.ReactNode) =>
  render(
    <Sidebar collapsed={collapsed} onCollapsedChange={() => {}}>
      {row}
    </Sidebar>,
  );

describe("NavItem", () => {
  it("marks the active item as the current page", () => {
    render(<NavItem active>Agenten</NavItem>);
    const item = screen.getByRole("button", { name: "Agenten" });
    expect(item).toHaveAttribute("aria-current", "page");
    expect(item).toHaveClass("bg-primary");
  });

  it("renders inactive items without aria-current", () => {
    render(<NavItem>Agenten</NavItem>);
    const item = screen.getByRole("button", { name: "Agenten" });
    expect(item).not.toHaveAttribute("aria-current");
    expect(item).toHaveClass("text-on-surface-variant");
  });

  it("renders the child element when asChild is set", () => {
    render(
      <NavItem asChild active>
        <a href="/statistiken">Statistiken</a>
      </NavItem>,
    );
    const link = screen.getByRole("link", { name: "Statistiken" });
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toHaveClass("bg-primary");
  });

  it("uses the nested sizing for level=sub", () => {
    render(<NavItem level="sub">Unterpunkt</NavItem>);
    expect(screen.getByRole("button")).toHaveClass("px-3", "py-2");
  });

  /**
   * Oracles here: the accname spec as implemented by `getByRole({ name })`
   * (an `aria-label` overrides the contents), and the card's rule that a row
   * only collapses when it was told its own name. Whether the hide utility
   * actually resolves to `display: none` is asserted in `sidebar.stories.tsx`,
   * where Tailwind is compiled — jsdom loads no CSS.
   */
  describe("inside a collapsed Sidebar", () => {
    it("labels the row from `label` and hides its non-svg children", () => {
      inSidebar(
        true,
        <NavItem label="Team">
          <svg aria-hidden />
          <span>Team</span>
        </NavItem>,
      );
      const item = screen.getByRole("button", { name: "Team" });
      expect(item).toHaveAttribute("aria-label", "Team");
      expect(item).toHaveClass("justify-center", "[&>*:not(svg)]:hidden");
    });

    it("leaves a row without `label` exactly as it was", () => {
      inSidebar(
        true,
        <NavItem>
          <svg aria-hidden />
          <span>Ohne Label</span>
        </NavItem>,
      );
      const item = screen.getByRole("button", { name: "Ohne Label" });
      expect(item).not.toHaveAttribute("aria-label");
      expect(item).not.toHaveClass("justify-center");
      // …and no tooltip was wrapped around it.
      expect(item).not.toHaveAttribute("aria-describedby");
      expect(item).not.toHaveAttribute("data-state");
    });

    it("collapses an asChild row too — the class and the name land on the <a>", () => {
      inSidebar(
        true,
        <NavItem asChild label="Statistiken" active>
          <a href="/statistiken">
            <svg aria-hidden />
            <span>Statistiken</span>
          </a>
        </NavItem>,
      );
      const link = screen.getByRole("link", { name: "Statistiken" });
      expect(link).toHaveAttribute("aria-label", "Statistiken");
      expect(link).toHaveAttribute("aria-current", "page");
      expect(link).toHaveClass("[&>*:not(svg)]:hidden");
    });
  });

  it("ignores `label` outside a Sidebar and in an expanded one", () => {
    render(<NavItem label="Team">Team</NavItem>);
    expect(screen.getByRole("button", { name: "Team" })).not.toHaveAttribute("aria-label");

    inSidebar(false, <NavItem label="Andere">Andere</NavItem>);
    const expanded = screen.getByRole("button", { name: "Andere" });
    expect(expanded).not.toHaveAttribute("aria-label");
    expect(expanded).not.toHaveClass("justify-center");
  });
});
