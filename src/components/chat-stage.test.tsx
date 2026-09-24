import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatStage } from "./chat-stage";

// Oracle: the order of the three regions and the `empty` flag handed in —
// centring itself is layout jsdom cannot measure, so the test pins the
// structure it rests on (content before composer before footer, auto margins
// only while empty).
describe("ChatStage", () => {
  it("orders content, composer and footer, and gives the footer its id", () => {
    render(
      <ChatStage empty composer={<textarea aria-label="Nachricht" />} footer="KI kann Fehler machen." footerId="chat-disclaimer">
        <h1>Willkommen</h1>
      </ChatStage>,
    );
    const stage = screen.getByRole("heading").closest("[data-slot=chat-stage]") as HTMLElement;
    expect(Array.from(stage.children, (c) => (c as HTMLElement).dataset.slot)).toEqual([
      "chat-stage-content",
      "chat-stage-composer",
      "chat-stage-footer",
    ]);
    expect(stage.dataset.empty).toBe("true");
    expect(screen.getByText("KI kann Fehler machen.")).toHaveAttribute("id", "chat-disclaimer");
  });

  it("centres only while empty", () => {
    const { container, rerender } = render(<ChatStage empty composer="c">x</ChatStage>);
    const composer = () => container.querySelector("[data-slot=chat-stage-composer]") as HTMLElement;
    expect(composer()).toHaveClass("mb-auto");
    rerender(<ChatStage composer="c">x</ChatStage>);
    expect(composer()).not.toHaveClass("mb-auto");
    expect(container.querySelector("[data-slot=chat-stage]")).not.toHaveAttribute("data-empty");
  });
});
