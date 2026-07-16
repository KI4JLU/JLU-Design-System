import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";

const renderPopover = () =>
  render(
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Filter</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Filter-Einstellungen">
        <p>Panel-Inhalt</p>
      </PopoverContent>
    </Popover>,
  );

describe("Popover", () => {
  it("opens on click and renders the panel", async () => {
    renderPopover();
    await userEvent.click(screen.getByRole("button", { name: "Filter" }));
    expect(await screen.findByText("Panel-Inhalt")).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderPopover();
    const trigger = screen.getByRole("button", { name: "Filter" });
    await userEvent.click(trigger);
    await screen.findByText("Panel-Inhalt");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Panel-Inhalt")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("marks the trigger with aria-expanded and data-state", async () => {
    renderPopover();
    const trigger = screen.getByRole("button", { name: "Filter" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("data-state", "open");
  });
});
