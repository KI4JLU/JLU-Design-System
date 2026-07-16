import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedControl } from "./segmented-control";

const OPTIONS = [
  { value: "tag", label: "Tag" },
  { value: "woche", label: "Woche" },
  { value: "monat", label: "Monat" },
];

describe("SegmentedControl", () => {
  it("renders all segments and marks the active one via aria-pressed", () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        value="woche"
        onValueChange={() => {}}
        aria-label="Zeitraum"
      />,
    );
    expect(screen.getByRole("group", { name: "Zeitraum" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Woche" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Tag" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports the clicked segment via onValueChange", async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        options={OPTIONS}
        value="woche"
        onValueChange={onValueChange}
        aria-label="Zeitraum"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Monat" }));
    expect(onValueChange).toHaveBeenCalledWith("monat");
  });

  it("is keyboard operable", async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        options={OPTIONS}
        value="tag"
        onValueChange={onValueChange}
        aria-label="Zeitraum"
      />,
    );
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Tag" })).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("woche");
  });
});
