import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";

const renderMenu = (onSelect = vi.fn()) => {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Optionen</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onSelect}>Umbenennen</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Löschen</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  return onSelect;
};

describe("DropdownMenu", () => {
  it("opens via keyboard and exposes menu semantics", async () => {
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Optionen" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
  });

  it("selects an item and closes the menu", async () => {
    const onSelect = renderMenu();
    const trigger = screen.getByRole("button", { name: "Optionen" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(await screen.findByRole("menuitem", { name: "Umbenennen" }));
    expect(onSelect).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Optionen" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("menu");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("styles destructive items via the MenuItem vocabulary", async () => {
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Optionen" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Löschen" })).toHaveClass(
      "text-error",
    );
  });
});
