import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavItem } from "./nav-item";

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
});
