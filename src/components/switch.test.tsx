import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./switch";

describe("Switch", () => {
  it("toggles via click and reports state accessibly", async () => {
    const onChange = vi.fn();
    render(<Switch aria-label="Benachrichtigungen" onCheckedChange={onChange} />);
    const sw = screen.getByRole("switch", { name: "Benachrichtigungen" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("toggles with the keyboard", async () => {
    render(<Switch aria-label="Test" />);
    const sw = screen.getByRole("switch");
    sw.focus();
    await userEvent.keyboard(" ");
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("cannot be toggled when disabled", async () => {
    render(<Switch aria-label="Test" disabled />);
    const sw = screen.getByRole("switch");
    await userEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(sw).toBeDisabled();
  });
});
