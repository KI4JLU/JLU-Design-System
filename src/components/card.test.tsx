import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./card";

describe("Card", () => {
  it("renders the plain surface without interactive/accent classes", () => {
    render(<Card data-testid="card">Inhalt</Card>);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("shadow-card");
    expect(card.className).not.toContain("hover:border-primary");
    expect(card.className).not.toContain("border-l-4");
  });

  it("adds the hover border highlight when interactive, without moving the card", () => {
    render(<Card interactive data-testid="card" />);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("hover:border-primary");
    expect(card.className).not.toContain("translate");
  });

  it("adds the left accent border when accent", () => {
    render(<Card accent data-testid="card" />);
    expect(screen.getByTestId("card")).toHaveClass("border-l-4", "border-l-primary");
  });

  it("combines both variants", () => {
    render(<Card interactive accent data-testid="card" />);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("hover:border-primary", "border-l-primary");
  });
});
