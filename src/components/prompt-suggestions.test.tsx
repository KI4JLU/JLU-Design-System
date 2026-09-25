import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromptSuggestions } from "./prompt-suggestions";

const shown = () => screen.getAllByRole("listitem").map((li) => li.textContent);

// Oracle: the suggestion strings handed in, and WAI-ARIA roles
// as testing-library resolves them.
describe("PromptSuggestions", () => {
  it("names the list by its headline and hands back the trimmed text", async () => {
    const onSelect = vi.fn();
    render(<PromptSuggestions title="Vorschläge" suggestions={[" Fasse zusammen ", "", "Was steht drin?"]} onSelect={onSelect} />);
    expect(screen.getByRole("heading", { name: "Vorschläge" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Vorschläge" }).querySelectorAll("button")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Fasse zusammen" }));
    expect(onSelect).toHaveBeenCalledWith("Fasse zusammen");
  });

  it("renders every suggestion and steps the row one suggestion at a time", async () => {
    // Oracle: a 500px row showing 200px, items starting at 0/150/300px — next
    // scrolls to the next item's start minus the 24px fade, previous back.
    const sw = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(500);
    const cw = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
    render(<PromptSuggestions title="Vorschläge" suggestions={["A", "B", "C"]} onSelect={() => {}} previousLabel="Zurück" nextLabel="Weiter" />);
    expect(shown()).toEqual(["A", "B", "C"]);
    const list = screen.getByRole("list", { name: "Vorschläge" });
    Array.from(list.children).forEach((li, i) => Object.defineProperty(li, "offsetLeft", { value: i * 150 }));
    const scrollTo = vi.fn();
    list.scrollTo = scrollTo as typeof list.scrollTo;
    expect(screen.getByRole("button", { name: "Zurück" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 126 }));
    list.scrollLeft = 126;
    list.dispatchEvent(new Event("scroll"));
    await userEvent.click(screen.getByRole("button", { name: "Zurück" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 0 }));
    sw.mockRestore();
    cw.mockRestore();
  });

  it("shows no stepping while everything fits, a close button only with onDismiss", async () => {
    const onDismiss = vi.fn();
    render(<PromptSuggestions suggestions={["A"]} onSelect={() => {}} onDismiss={onDismiss} dismissLabel="Schließen" />);
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
    const root = screen.getByRole("list").parentElement as HTMLElement;
    await userEvent.click(screen.getByRole("button", { name: "Schließen" }));
    expect(onDismiss).toHaveBeenCalled();
    // Oracle: closing hides by visibility (space kept), it does not unmount.
    expect(root).toBeInTheDocument();
    expect(root).toHaveClass("invisible");
  });

  it("disables every suggestion and renders nothing without suggestions", () => {
    const { container, rerender } = render(<PromptSuggestions suggestions={["A", "B"]} onSelect={() => {}} disabled />);
    for (const b of screen.getAllByRole("button")) expect(b).toBeDisabled();
    rerender(<PromptSuggestions suggestions={["  "]} onSelect={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps one row and fades the right edge while more suggestions lie beyond it", () => {
    // Oracle: a row 500px wide showing 200px must report a right fade only.
    const sw = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(500);
    const cw = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
    render(<PromptSuggestions title="Vorschläge" suggestions={["A", "B", "C"]} onSelect={() => {}} />);
    const list = screen.getByRole("list", { name: "Vorschläge" });
    expect(list.className).toContain("flex-nowrap");
    expect(list.dataset.scrollFade).toBe("right");
    sw.mockRestore();
    cw.mockRestore();
  });

  it("stays hidden until revealDelay has passed, then shows", () => {
    vi.useFakeTimers();
    const { container } = render(<PromptSuggestions suggestions={["A"]} onSelect={() => {}} revealDelay={2000} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("invisible");
    act(() => { vi.advanceTimersByTime(1999); });
    expect(root).toHaveClass("invisible");
    act(() => { vi.advanceTimersByTime(1); });
    expect(root).toHaveClass("visible");
    vi.useRealTimers();
  });
});
