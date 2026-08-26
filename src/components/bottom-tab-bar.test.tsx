import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FolderOpen, History, MessageSquare } from "lucide-react";
import { BottomTabBar, type BottomTabBarItem } from "./bottom-tab-bar";

/**
 * Oracles used here are external to the component:
 *
 * 1. **ARIA in HTML** — `<nav>` maps to the `navigation` role, and `aria-label`
 *    is its accessible name. Queried by role + name, never by class.
 * 2. **WAI-ARIA `aria-current`** — „does not indicate more than one element as
 *    current at the same time"; `page` is the value for the currently displayed
 *    view. So: exactly one `[aria-current]`, on the active tab, and none when
 *    `activeId` matches nothing.
 * 3. **HTML button activation behaviour** — Enter and Space activate a
 *    `<button>`; no key handling of our own is involved, which is precisely why
 *    tabs are buttons.
 * 4. **`aria-hidden` on the icon slot** — a decorative icon must not contribute
 *    to the accessible name, so the name of each tab is exactly its `label`
 *    even when the icon node itself carries text.
 */

const ITEMS: BottomTabBarItem[] = [
  { id: "history", icon: <History />, label: "Verlauf" },
  { id: "chat", icon: <MessageSquare />, label: "Chat" },
  { id: "files", icon: <FolderOpen />, label: "Quellen" },
];

describe("BottomTabBar", () => {
  it("is a named navigation landmark holding one tab per item", () => {
    render(
      <BottomTabBar
        items={ITEMS}
        activeId="chat"
        onChange={() => {}}
        label="Bereichswechsel"
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Bereichswechsel" });
    expect(nav).toBeInTheDocument();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Verlauf",
      "Chat",
      "Quellen",
    ]);
  });

  it("lets `label` win over a stray aria-label", () => {
    // Oracle: the documented contract that `label` is the ONE way to name the
    // landmark. The cast is deliberate — the props type forbids `aria-label`,
    // and this pins that the runtime agrees, so there are never two names for
    // one landmark.
    render(
      <BottomTabBar
        items={ITEMS}
        activeId="chat"
        onChange={() => {}}
        label="Bereichswechsel"
        {...({ "aria-label": "Etwas anderes" } as unknown as Record<string, unknown>)}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Bereichswechsel" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Etwas anderes" }),
    ).not.toBeInTheDocument();
  });

  it("marks exactly one tab as the current page", () => {
    const { container } = render(
      <BottomTabBar
        items={ITEMS}
        activeId="chat"
        onChange={() => {}}
        label="Bereichswechsel"
      />,
    );
    const current = container.querySelectorAll("[aria-current]");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Chat" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks nothing as current when activeId matches no item", () => {
    const { container } = render(
      <BottomTabBar
        items={ITEMS}
        activeId="does-not-exist"
        onChange={() => {}}
        label="Bereichswechsel"
      />,
    );
    expect(container.querySelectorAll("[aria-current]")).toHaveLength(0);
  });

  it("moves the current marker when activeId changes", () => {
    const { rerender, container } = render(
      <BottomTabBar
        items={ITEMS}
        activeId="chat"
        onChange={() => {}}
        label="Bereichswechsel"
      />,
    );
    rerender(
      <BottomTabBar
        items={ITEMS}
        activeId="files"
        onChange={() => {}}
        label="Bereichswechsel"
      />,
    );
    const current = container.querySelectorAll("[aria-current]");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Quellen");
  });

  it("reports the clicked tab's id", async () => {
    const onChange = vi.fn();
    render(
      <BottomTabBar
        items={ITEMS}
        activeId="chat"
        onChange={onChange}
        label="Bereichswechsel"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Quellen" }));
    expect(onChange).toHaveBeenCalledWith("files");
  });

  it("is operable from the keyboard", async () => {
    const onChange = vi.fn();
    render(
      <BottomTabBar
        items={ITEMS}
        activeId="chat"
        onChange={onChange}
        label="Bereichswechsel"
      />,
    );
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Verlauf" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("history");

    await userEvent.tab();
    await userEvent.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith("chat");
  });

  it("keeps the icon out of the accessible name", () => {
    render(
      <BottomTabBar
        items={[{ id: "history", icon: <span>ICON-TEXT</span>, label: "Verlauf" }]}
        activeId="history"
        onChange={() => {}}
        label="Bereichswechsel"
      />,
    );
    // Would fail if the icon slot were not aria-hidden: the name would be
    // "ICON-TEXT Verlauf".
    expect(
      screen.getByRole("button", { name: "Verlauf" }),
    ).toBeInTheDocument();
  });
});
