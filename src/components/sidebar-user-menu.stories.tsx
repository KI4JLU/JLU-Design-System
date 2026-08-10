import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExternalLink, LogOut, Settings } from "lucide-react";
import { SidebarUserMenu } from "./sidebar-user-menu";
import { DropdownMenuItem, DropdownMenuSeparator } from "./dropdown-menu";

const meta = {
  title: "Components/SidebarUserMenu",
  component: SidebarUserMenu,
  args: {
    initials: "JL",
    name: "Jamie Lee",
    role: "Admin",
  },
  // Im echten Einsatz sitzt die Zeile im 256px breiten Sidebar-Footer —
  // hier nachgestellt, damit Truncation und volle Breite sichtbar sind.
  decorators: [
    (Story) => (
      <div className="w-64 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SidebarUserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: (
      <>
        <DropdownMenuItem>
          <Settings width="1em" height="1em" aria-hidden />
          Einstellungen
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOut width="1em" height="1em" aria-hidden />
          Abmelden
        </DropdownMenuItem>
      </>
    ),
  },
};

/** Ohne `role`: nur der Name, vertikal zentriert neben dem Avatar. */
export const WithoutRole: Story = {
  args: {
    role: undefined,
    children: (
      <DropdownMenuItem variant="destructive">
        <LogOut width="1em" height="1em" aria-hidden />
        Abmelden
      </DropdownMenuItem>
    ),
  },
};

/** Lange Werte werden abgeschnitten, statt die Spalte zu verbreitern. */
export const TruncatesLongValues: Story = {
  args: {
    initials: "MB",
    name: "Maximiliane Bergstrom-Lindqvist",
    role: "Wissenschaftliche Mitarbeiterin (Institut)",
    children: (
      <DropdownMenuItem asChild>
        <a href="#profil">
          <ExternalLink width="1em" height="1em" aria-hidden />
          Profil öffnen
        </a>
      </DropdownMenuItem>
    ),
  },
};
