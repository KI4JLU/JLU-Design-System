import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

describe("Checkbox", () => {
  it("toggles via click and reports state accessibly", async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Regel aktiv" onCheckedChange={onChange} />);
    const box = screen.getByRole("checkbox", { name: "Regel aktiv" });
    expect(box).toHaveAttribute("aria-checked", "false");
    await userEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(box).toHaveAttribute("aria-checked", "true");
  });

  it("toggles with the keyboard", async () => {
    render(<Checkbox aria-label="Test" />);
    const box = screen.getByRole("checkbox");
    box.focus();
    await userEvent.keyboard(" ");
    expect(box).toHaveAttribute("aria-checked", "true");
  });

  it("cannot be toggled when disabled", async () => {
    render(<Checkbox aria-label="Test" disabled />);
    const box = screen.getByRole("checkbox");
    await userEvent.click(box);
    expect(box).toHaveAttribute("aria-checked", "false");
    expect(box).toBeDisabled();
  });

  it("supports the indeterminate state", () => {
    render(<Checkbox aria-label="Alle" checked="indeterminate" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "mixed");
  });

  it("gets its accessible name from a Label htmlFor", async () => {
    render(
      <div>
        <Checkbox id="newsletter" />
        <Label htmlFor="newsletter">Newsletter</Label>
      </div>,
    );
    const box = screen.getByRole("checkbox", { name: "Newsletter" });
    await userEvent.click(screen.getByText("Newsletter"));
    expect(box).toHaveAttribute("aria-checked", "true");
  });
});
