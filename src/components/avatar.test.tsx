import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "./avatar";

describe("Avatar", () => {
  it("renders the initials", () => {
    render(<Avatar initials="SK" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toHaveTextContent("SK");
  });

  it("announces online state to screen readers only when online", () => {
    const { rerender } = render(<Avatar initials="SK" data-testid="avatar" />);
    expect(screen.queryByText("online")).not.toBeInTheDocument();
    rerender(<Avatar initials="SK" online data-testid="avatar" />);
    expect(screen.getByText("online")).toHaveClass("sr-only");
  });

  it("applies the requested size", () => {
    render(<Avatar initials="SK" size="lg" data-testid="avatar" />);
    const circle = screen.getByTestId("avatar").firstElementChild;
    expect(circle).toHaveClass("h-12", "w-12");
  });

  it("passes an accessible name through", () => {
    render(<Avatar initials="SK" aria-label="Steffen Karcher" />);
    expect(screen.getByLabelText("Steffen Karcher")).toBeInTheDocument();
  });
});
