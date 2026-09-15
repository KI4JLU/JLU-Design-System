import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./theme-toggle";
import { ThemeProvider } from "../theme/ThemeContext";

beforeEach(() => {
  window.localStorage.clear();
  // jsdom has no matchMedia; the toggle itself never queries it, but the
  // provider resolves "system" through it.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

describe("ThemeToggle", () => {
  it("carries the German default labels for the group and all options", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    const group = screen.getByRole("group", { name: "Farbschema" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Helles Design" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Systemdesign" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dunkles Design" })).toBeInTheDocument();
  });

  it("themeLabel and the option labels are overridable", () => {
    render(
      <ThemeProvider>
        <ThemeToggle
          themeLabel="Color scheme"
          lightLabel="Light"
          systemLabel="System"
          darkLabel="Dark"
        />
      </ThemeProvider>,
    );
    expect(screen.getByRole("group", { name: "Color scheme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Farbschema" })).not.toBeInTheDocument();
  });

  /**
   * Oracle: two *independent* lookups have to land on the same node — the DOM
   * id index (`document.getElementById`, the browser's own resolution of the
   * `id` attribute, which is what `aria-controls`, `<label for>`, a skip link
   * and `location.hash` all use) and the accessibility tree (Testing
   * Library's `getByRole("group", …)`, computed by aria-query +
   * dom-accessibility-api). Neither reads this component's markup, so an id
   * parked on a wrapper or on one of the buttons fails the test: only the
   * element that *is* the group can satisfy both.
   */
  it("puts `id` on the role=group element, where a consumer can reach it", () => {
    render(
      <ThemeProvider>
        <ThemeToggle id="app-theme-toggle" />
      </ThemeProvider>,
    );
    const group = screen.getByRole("group", { name: "Farbschema" });
    expect(document.getElementById("app-theme-toggle")).toBe(group);
  });

  it("carries no id of its own when none is passed", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    // A generated fallback id would be worse than none: it changes between
    // renders, so a consumer's `aria-controls` could never point at it.
    expect(screen.getByRole("group", { name: "Farbschema" })).not.toHaveAttribute("id");
  });

  it("marks the active option via aria-pressed", () => {
    render(
      <ThemeProvider theme="dark">
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(screen.getByRole("button", { name: "Dunkles Design" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Helles Design" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports a click through onThemeChange when the provider is controlled", async () => {
    const onThemeChange = vi.fn();
    render(
      <ThemeProvider theme="light" onThemeChange={onThemeChange}>
        <ThemeToggle />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Dunkles Design" }));
    expect(onThemeChange).toHaveBeenCalledExactlyOnceWith("dark");
    // Controlled: the provider did not flip on its own, and nothing was stored.
    expect(
      screen.getByRole("button", { name: "Helles Design" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem("theme")).toBeNull();
  });
});
