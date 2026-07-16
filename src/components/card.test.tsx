import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./card";

describe("Card", () => {
  it("renders the plain surface without interactive/accent classes", () => {
    render(<Card data-testid="card">Inhalt</Card>);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("shadow-card");
    expect(card.className).not.toContain("hover:-translate-y-1");
    expect(card.className).not.toContain("border-l-4");
  });

  it("adds the hover lift when interactive", () => {
    render(<Card interactive data-testid="card" />);
    expect(screen.getByTestId("card")).toHaveClass(
      "hover:-translate-y-1",
      "hover:shadow-card-hover",
    );
  });

  it("adds the left accent border when accent", () => {
    render(<Card accent data-testid="card" />);
    expect(screen.getByTestId("card")).toHaveClass("border-l-4", "border-l-primary");
  });

  it("combines both variants", () => {
    render(<Card interactive accent data-testid="card" />);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("hover:-translate-y-1", "border-l-primary");
  });
});
