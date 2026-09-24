import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarCard, SidebarSelectionBar } from "./sidebar-card";
import { SidebarRailItem } from "./sidebar-rail";
import { UiShapeProvider } from "./ui-shape-provider";
import { UiShapeToggle } from "./ui-shape-toggle";

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.uiShape;
});

const card = (props: Partial<React.ComponentProps<typeof SidebarCard>> = {}) => (
  <ul>
    <SidebarCard title="Budget" onOpen={props.onOpen ?? (() => {})} {...props} />
  </ul>
);

// Oracles: WAI-ARIA roles as testing-library resolves them, and the props
// handed in — nothing computed by the component itself.
describe("SidebarCard", () => {
  it("opens on a click anywhere on the card, but not on its own controls", async () => {
    const onOpen = vi.fn();
    const onSelect = vi.fn();
    const onSelectedChange = vi.fn();
    render(card({
      onOpen,
      selectable: true,
      selectLabel: "Auswählen",
      onSelectedChange,
      actionsLabel: "Aktionen für",
      actions: [{ label: "Umbenennen", onSelect }],
    }));

    await userEvent.click(screen.getByRole("listitem"));
    expect(onOpen).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("checkbox", { name: "Auswählen Budget" }));
    await userEvent.click(screen.getByRole("button", { name: "Aktionen für Budget" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Umbenennen" }));
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("in selection mode toggles instead of opening and hides the menu", async () => {
    const onOpen = vi.fn();
    const onSelectedChange = vi.fn();
    render(card({
      onOpen, selectable: true, selectionMode: true, selected: false, onSelectedChange,
      actions: [{ label: "Umbenennen", onSelect: () => {} }],
    }));
    expect(screen.queryByRole("button", { name: /Budget$/ , hidden: false })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Budget" }));
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("takes its shape from the app-wide Style unless told otherwise", () => {
    window.localStorage.setItem("ui-shape", "pill");
    render(
      <UiShapeProvider>
        {card()}
        <ul><SidebarCard title="Fix" shape="rounded" onOpen={() => {}} /></ul>
      </UiShapeProvider>,
    );
    const [fromContext, fixed] = screen.getAllByRole("listitem");
    expect(fromContext).toHaveAttribute("data-shape", "pill");
    expect(fixed).toHaveAttribute("data-shape", "rounded");
  });
});

describe("UiShapeProvider + UiShapeToggle", () => {
  it("defaults to rounded, mirrors to <html>, and remembers the switch", async () => {
    const { unmount } = render(<UiShapeProvider><UiShapeToggle /></UiShapeProvider>);
    expect(document.documentElement.dataset.uiShape).toBe("rounded");
    expect(screen.getByRole("button", { name: "Abgerundet eckig" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: "Pille" }));
    expect(document.documentElement.dataset.uiShape).toBe("pill");
    expect(window.localStorage.getItem("ui-shape")).toBe("pill");
    unmount();

    render(<UiShapeProvider><UiShapeToggle /></UiShapeProvider>);
    expect(screen.getByRole("button", { name: "Pille" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("SidebarRailItem / SidebarSelectionBar", () => {
  it("marks the open entry and shows a type label when given", () => {
    render(<><SidebarRailItem aria-label="a.pdf" iconText="PDF" active /><SidebarRailItem aria-label="b" /></>);
    expect(screen.getByRole("button", { name: "a.pdf" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "a.pdf" })).toHaveTextContent("PDF");
    expect(screen.getByRole("button", { name: "b" })).not.toHaveAttribute("aria-current");
  });

  it("names its count and cancels", async () => {
    const onCancel = vi.fn();
    render(<SidebarSelectionBar aria-label="Auswahl" countLabel="2 ausgewählt" onCancel={onCancel} />);
    expect(screen.getByRole("toolbar", { name: "Auswahl" })).toHaveTextContent("2 ausgewählt");
    await userEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
