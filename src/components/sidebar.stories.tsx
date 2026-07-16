import type { Meta, StoryObj } from "@storybook/react-vite";
import { Brain, ChartColumn, Waypoints } from "lucide-react";
import { Sidebar } from "./sidebar";
import { NavItem } from "./nav-item";
import { Avatar } from "./avatar";
import { ThemeToggle } from "./theme-toggle";

const meta = {
  title: "Layout/Sidebar",
  component: Sidebar,
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Die strukturelle Navigationsspalte: Header (Marke), scrollbare Navigation,
 * Footer (Nutzer + ThemeToggle). Positionierung und Drawer-Verhalten liefert
 * AppShell — dieselbe Sidebar-Instanz wird dort an beiden Stellen gerendert.
 */
export const Complete: Story = {
  render: () => (
    <div className="h-160 overflow-hidden rounded-xl border border-outline-variant">
      <Sidebar
        header={
          <>
            <Brain width="1.25em" height="1.25em" aria-hidden className="text-primary" />
            <span className="font-semibold">CampusAgents</span>
          </>
        }
        footer={
          <div className="flex items-center justify-between gap-stack-sm">
            <Avatar initials="JL" aria-label="Justus Liebig" />
            <ThemeToggle />
          </div>
        }
      >
        <NavItem active>
          <Brain width="1em" height="1em" aria-hidden />
          <span>Agenten</span>
        </NavItem>
        <NavItem>
          <Waypoints width="1em" height="1em" aria-hidden />
          <span>Konnektoren</span>
        </NavItem>
        <NavItem>
          <ChartColumn width="1em" height="1em" aria-hidden />
          <span>Statistiken</span>
        </NavItem>
      </Sidebar>
    </div>
  ),
};
