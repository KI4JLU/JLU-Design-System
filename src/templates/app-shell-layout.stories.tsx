import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import { DropdownMenuItem } from "../components/dropdown-menu";
import { Logo } from "../components/logo";
import { NavItem } from "../components/nav-item";
import { SidebarUserMenu } from "../components/sidebar-user-menu";
import * as dashboardStories from "./dashboard-layout.stories";

// Portable Stories: die Dashboard-Template-Story ist der Seiteninhalt —
// Templates komponieren ineinander, nichts wird neu gemockt.
const { Standard: DashboardPage } = composeStories(dashboardStories, {});

const userMenu = (
  <SidebarUserMenu initials="JL" name="Jamie Lee" role="Admin">
    <DropdownMenuItem>
      <Settings width="1em" height="1em" aria-hidden />
      Einstellungen
    </DropdownMenuItem>
    <DropdownMenuItem variant="destructive">
      <LogOut width="1em" height="1em" aria-hidden />
      Abmelden
    </DropdownMenuItem>
  </SidebarUserMenu>
);

const meta = {
  title: "Templates/AppShellLayout",
  component: AppShellLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppShellLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDashboard: Story = {
  args: {
    logo: <Logo product="App" size="sm" />,
    pageLabel: "Dashboard",
    nav: (
      <>
        <NavItem active>
          <LayoutDashboard width="1em" height="1em" aria-hidden />
          <span>Übersicht</span>
        </NavItem>
        <NavItem>
          <Users width="1em" height="1em" aria-hidden />
          <span>Team</span>
        </NavItem>
        <NavItem>
          <Settings width="1em" height="1em" aria-hidden />
          <span>Einstellungen</span>
        </NavItem>
      </>
    ),
    sidebarFooter: userMenu,
  },
  render: (args) => (
    <AppShellLayout {...args}>
      <DashboardPage />
    </AppShellLayout>
  ),
};
