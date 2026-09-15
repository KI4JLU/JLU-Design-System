import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./app-shell";
import { Sidebar } from "./sidebar";
import { NavItem } from "./nav-item";

const shell = (
  <AppShell
    topBar={<span>Anwendung</span>}
    sidebar={
      <Sidebar>
        <NavItem asChild>
          <a href="#bereich-a">Bereich A</a>
        </NavItem>
        <NavItem>Bereich B</NavItem>
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
    await userEvent.click(within(drawer).getByRole("link", { name: "Bereich A" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the drawer open when a non-link item is clicked", async () => {
    render(shell);
    await userEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    const drawer = await screen.findByRole("dialog");
    await userEvent.click(within(drawer).getByRole("button", { name: "Bereich B" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the main content in a main landmark", () => {
    render(shell);
    expect(screen.getByRole("main")).toHaveTextContent("Inhalt");
  });

  /**
   * Oracle: the card's decision that a "minimise the column" control is
   * meaningless inside a modal drawer, plus the structural fact that AppShell
   * mounts the *same* node twice. Asserted through the accessible tree
   * (`within(drawer)`), not through class names.
   */
  describe("a collapsed Sidebar in the mobile drawer", () => {
    const collapsibleShell = (
      <AppShell
        sidebar={
          <Sidebar collapsed onCollapsedChange={() => {}} header={<span>Marke</span>}>
            <NavItem label="Bereich A">
              <svg aria-hidden />
              <span>Bereich A</span>
            </NavItem>
          </Sidebar>
        }
      >
        <p>Inhalt</p>
      </AppShell>
    );

    it("renders the drawer copy expanded and without the toggle", async () => {
      render(collapsibleShell);
      // The desktop column is mounted from the start and is collapsed.
      expect(
        screen.getByRole("button", { name: "Navigation ausklappen" }),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
      const drawer = await screen.findByRole("dialog");
      const drawerAside = drawer.querySelector("aside")!;
      expect(drawerAside).toHaveClass("w-(--width-sidebar)");
      expect(drawerAside).not.toHaveClass("w-(--width-sidebar-collapsed)");
      // The brand is back, the toggle is not there, and the row shows its text.
      expect(within(drawer).getByText("Marke")).toBeInTheDocument();
      expect(
        within(drawer).queryByRole("button", { name: "Navigation ausklappen" }),
      ).not.toBeInTheDocument();
      expect(
        within(drawer).getByRole("button", { name: "Bereich A" }),
      ).not.toHaveAttribute("aria-label");
    });

    it("leaves the desktop column collapsed while the drawer is open", async () => {
      const { baseElement } = render(collapsibleShell);
      await userEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
      const drawer = await screen.findByRole("dialog");
      // Queried through the DOM, not through roles: Radix marks everything
      // outside an open modal `aria-hidden`, so the desktop column is
      // (correctly) absent from the accessible tree at this moment.
      const asides = [...baseElement.querySelectorAll("aside")];
      expect(asides).toHaveLength(2);
      const desktop = asides.find((a) => !drawer.contains(a))!;
      expect(desktop).toHaveClass("w-(--width-sidebar-collapsed)");
      expect(desktop.querySelector("[aria-label='Navigation ausklappen']")).not.toBeNull();
    });
  });

  it("menuLabel and drawerLabel override the German defaults", async () => {
    render(
      <AppShell
        sidebar={<Sidebar>x</Sidebar>}
        menuLabel="Open navigation"
        drawerLabel="Main navigation"
      >
        <p>Inhalt</p>
      </AppShell>,
    );
    expect(
      screen.queryByRole("button", { name: "Navigation öffnen" }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(
      await screen.findByRole("dialog", { name: "Main navigation" }),
    ).toBeInTheDocument();
  });
});
