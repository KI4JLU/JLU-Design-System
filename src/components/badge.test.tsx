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

  it("renders a decorative status dot when dot is set", () => {
    render(
      <Badge dot tone="success">
        Online
      </Badge>,
    );
    const dot = screen.getByText("Online").querySelector("[aria-hidden='true']");
    expect(dot).toHaveClass("bg-current", "rounded-full");
  });

  it("renders no dot by default", () => {
    render(<Badge>Entwurf</Badge>);
    expect(screen.getByText("Entwurf").querySelector("[aria-hidden='true']")).toBeNull();
  });
});
