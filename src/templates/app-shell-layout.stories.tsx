import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { Brain, ChartColumn, Waypoints } from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import { NavItem } from "../components/nav-item";
import { Avatar } from "../components/avatar";
import { ThemeToggle } from "../components/theme-toggle";
import { templateChromaticModes } from "./chromatic-modes";
import * as dashboardStories from "./dashboard-layout.stories";

// Portable Stories: die Dashboard-Template-Story ist der Seiteninhalt —
// Templates komponieren ineinander, nichts wird neu gemockt.
const { Standard: DashboardPage } = composeStories(dashboardStories, {});

const meta = {
  title: "Templates/AppShellLayout",
  component: AppShellLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen", chromatic: { modes: templateChromaticModes } },
} satisfies Meta<typeof AppShellLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const brand = (
  <>
    <Brain width="1.25em" height="1.25em" aria-hidden className="text-primary" />
    <span className="font-semibold">CampusAgents</span>
  </>
);

export const WithDashboard: Story = {
  args: {
    logo: brand,
    nav: (
      <>
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
      </>
    ),
    sidebarFooter: (
      <div className="flex items-center justify-between gap-stack-sm">
        <Avatar initials="JL" aria-label="Justus Liebig" />
        <ThemeToggle />
      </div>
    ),
  },
  render: (args) => (
    <AppShellLayout {...args}>
      <DashboardPage />
    </AppShellLayout>
  ),
};
