import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("announces itself as status with a default label", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveTextContent("Wird geladen …");
  });

  it("accepts a custom label", () => {
    render(<Spinner label="Antwort wird generiert …" />);
    expect(screen.getByRole("status")).toHaveTextContent("Antwort wird generiert …");
  });

  it("renders the requested size on the icon", () => {
    const { container } = render(<Spinner size="lg" />);
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("h-8", "w-8", "animate-spin");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
