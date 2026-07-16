import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders a filled pill with the tone's container colors", () => {
    render(<Badge tone="success">+14 %</Badge>);
    const badge = screen.getByText("+14 %");
    expect(badge).toHaveClass("bg-success-container", "rounded-full");
  });

  it("renders the text appearance without a background", () => {
    render(
      <Badge appearance="text" tone="warning">
        KB nicht gefunden
      </Badge>,
    );
    const badge = screen.getByText("KB nicht gefunden");
    expect(badge).toHaveClass("text-warning");
    expect(badge.className).not.toMatch(/bg-/);
  });

  it("defaults to the neutral filled variant", () => {
    render(<Badge>Entwurf</Badge>);
    expect(screen.getByText("Entwurf")).toHaveClass("bg-surface-container-high");
  });
});
