import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./app-shell";
import { Sidebar } from "./sidebar";
import { NavItem } from "./nav-item";

const shell = (
  <AppShell
    topBar={<span>CampusAgents</span>}
    sidebar={
      <Sidebar>
        <NavItem asChild>
          <a href="#agenten">Agenten</a>
        </NavItem>
        <NavItem>Konnektoren</NavItem>
      </Sidebar>
    }
  >
    <p>Inhalt</p>
  </AppShell>
);

describe("AppShell", () => {
  it("opens the mobile drawer from the menu button", async () => {
    render(shell);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    const drawer = await screen.findByRole("dialog", { name: "Navigation" });
    expect(drawer).toBeInTheDocument();
  });

  it("closes the drawer with Escape", async () => {
    render(shell);
    await userEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes the drawer when a navigation link is clicked", async () => {
    render(shell);
    await userEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    const drawer = await screen.findByRole("dialog");
    await userEvent.click(within(drawer).getByRole("link", { name: "Agenten" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the drawer open when a non-link item is clicked", async () => {
    render(shell);
    await userEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    const drawer = await screen.findByRole("dialog");
    await userEvent.click(within(drawer).getByRole("button", { name: "Konnektoren" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the main content in a main landmark", () => {
    render(shell);
    expect(screen.getByRole("main")).toHaveTextContent("Inhalt");
  });
});
