import type { Meta, StoryObj } from "@storybook/react-vite";
import { LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Logo } from "./logo";
import { NavItem } from "./nav-item";
import { DropdownMenuItem } from "./dropdown-menu";
import { SidebarUserMenu } from "./sidebar-user-menu";

const meta = {
  title: "Layout/Sidebar",
  component: Sidebar,
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

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

/**
 * Die strukturelle Navigationsspalte: Header (Marke), scrollbare Navigation,
 * Footer (Nutzermenü: Avatar, Name/Rolle, Chevron). Positionierung und
 * Drawer-Verhalten liefert AppShell — dieselbe Sidebar-Instanz wird dort an
 * beiden Stellen gerendert. Der ThemeToggle sitzt in `AppShellLayout` rechts
 * in der Header-Leiste, nicht im Sidebar-Footer.
 */
export const Complete: Story = {
  render: () => (
    <div className="h-160 overflow-hidden rounded-xl border border-outline-variant">
      <Sidebar header={<Logo product="App" size="sm" />} footer={userMenu}>
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
      </Sidebar>
    </div>
  ),
};
