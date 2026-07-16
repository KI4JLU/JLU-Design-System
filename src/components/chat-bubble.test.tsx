import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatBubble } from "./chat-bubble";

describe("ChatBubble", () => {
  it("aligns user messages right in primary with the asymmetric corner", () => {
    render(<ChatBubble from="user">Hallo!</ChatBubble>);
    const bubble = screen.getByText("Hallo!");
    expect(bubble).toHaveClass("ml-auto", "bg-primary", "rounded-tr-sm");
  });

  it("renders assistant messages on a container surface, corner left", () => {
    render(<ChatBubble from="assistant">Wie kann ich helfen?</ChatBubble>);
    const bubble = screen.getByText("Wie kann ich helfen?");
    expect(bubble).toHaveClass("bg-surface-container-high", "rounded-tl-sm");
    expect(bubble.className).not.toContain("ml-auto");
  });

  it("defaults to assistant", () => {
    render(<ChatBubble>Antwort</ChatBubble>);
    expect(screen.getByText("Antwort")).toHaveClass("rounded-tl-sm");
  });
});
