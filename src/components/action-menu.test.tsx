import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionMenu } from "./action-menu";

describe("ActionMenu", () => {
  it("renders nothing without actions", () => {
    const { container } = render(<ActionMenu actions={[]} label="Aktionen" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens the menu and runs the chosen action", async () => {
    const onRename = vi.fn();
    render(
      <ActionMenu
        label="Aktionen"
        actions={[
          { label: "Umbenennen", onSelect: onRename },
          { label: "Löschen", onSelect: vi.fn(), destructive: true, separatorBefore: true },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Aktionen" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Umbenennen" }));
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it("does not run a disabled action", async () => {
    const onDelete = vi.fn();
    render(<ActionMenu label="Aktionen" actions={[{ label: "Löschen", onSelect: onDelete, disabled: true }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Aktionen" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Löschen" }));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
