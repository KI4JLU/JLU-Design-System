import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CodeBlock } from "./code-block";

/** jsdom has no navigator.clipboard — install a stub we can assert on. */
function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

describe("CodeBlock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the code and copies it to the clipboard", async () => {
    const writeText = stubClipboard();
    render(<CodeBlock code={'<script src="widget.js"></script>'} />);
    expect(
      screen.getByText('<script src="widget.js"></script>'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Code kopieren" }));
    expect(writeText).toHaveBeenCalledWith('<script src="widget.js"></script>');
    // Confirmation: label swaps once the clipboard promise resolves.
    expect(
      await screen.findByRole("button", { name: "Kopiert" }),
    ).toBeInTheDocument();
  });

  it("reverts the label after ~2s", async () => {
    stubClipboard();
    vi.useFakeTimers();
    render(<CodeBlock code="npm install" />);

    fireEvent.click(screen.getByRole("button", { name: "Code kopieren" }));
    // Flush the clipboard promise so the copied state is committed.
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Kopiert" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      screen.getByRole("button", { name: "Code kopieren" }),
    ).toBeInTheDocument();
  });

  it("supports custom labels", async () => {
    stubClipboard();
    render(<CodeBlock code="ls" copyLabel="Copy" copiedLabel="Copied" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(
      await screen.findByRole("button", { name: "Copied" }),
    ).toBeInTheDocument();
  });
});
