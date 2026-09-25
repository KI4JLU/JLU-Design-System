import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsDialog, SettingsRow } from "./settings-dialog";

const sections = [
  { value: "general", label: "Allgemein", keywords: ["Darstellung", "Sprache"], content: <SettingsRow label="Darstellung" control={<span>System</span>} /> },
  { value: "profile", label: "Profil", keywords: ["E-Mail"], content: <SettingsRow label="E-Mail" control={<span>a@b.de</span>} /> },
];

// Oracles: the section data handed in and WAI-ARIA roles as testing-library
// resolves them — nothing the component computes itself.
describe("SettingsDialog", () => {
  it("opens on the first section and switches from the nav", async () => {
    render(<SettingsDialog open onOpenChange={() => {}} sections={sections} />);
    expect(screen.getByRole("dialog", { name: "Einstellungen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Allgemein" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Profil" }));
    expect(screen.getByRole("heading", { level: 2, name: "Profil" })).toBeInTheDocument();
    expect(screen.getByText("a@b.de")).toBeInTheDocument();
  });

  it("filters sections by label and keywords, falling back to the first match", async () => {
    render(<SettingsDialog open onOpenChange={() => {}} sections={sections} />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Einstellungen suchen" }), "mail");
    expect(screen.queryByRole("button", { name: "Allgemein" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Profil" })).toBeInTheDocument();

    await userEvent.clear(screen.getByRole("searchbox"));
    await userEvent.type(screen.getByRole("searchbox"), "xyz");
    expect(screen.getByText("Keine Treffer")).toBeInTheDocument();
  });

  it("closes from its close button", async () => {
    const onOpenChange = vi.fn();
    render(<SettingsDialog open onOpenChange={onOpenChange} sections={sections} />);
    await userEvent.click(screen.getByRole("button", { name: "Schließen" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
