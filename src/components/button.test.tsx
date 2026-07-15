import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("renders and handles clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Speichern</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Speichern" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies variant classes via cva", () => {
    render(<Button variant="destructive">Löschen</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-error");
  });

  it("renders the child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/w/1">Öffnen</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Öffnen" });
    expect(link).toHaveAttribute("href", "/w/1");
  });

  it("is not clickable when disabled", () => {
    render(<Button disabled>Aus</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
