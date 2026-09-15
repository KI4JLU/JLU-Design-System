import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { LayoutDashboard, LogOut, Search, Settings, Users } from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import { DropdownMenuItem } from "../components/dropdown-menu";
import { Input } from "../components/input";
import { Logo } from "../components/logo";
import { NavItem } from "../components/nav-item";
import { SidebarUserMenu } from "../components/sidebar-user-menu";
import { ThemeToggle } from "../components/theme-toggle";
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

const nav = (
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
);

/**
 * Der Standardfall — und seit 0.26.0 **die Migration**: den `ThemeToggle`
 * rendert nicht mehr das Template, sondern die App, über `headerActions`.
 * Genau diese eine Zeile hält das bisherige Verhalten.
 */
export const WithDashboard: Story = {
  args: {
    logo: <Logo product="App" size="sm" />,
    pageLabel: "Dashboard",
    nav,
    sidebarFooter: userMenu,
    headerActions: <ThemeToggle />,
  },
  render: (args) => (
    <AppShellLayout {...args}>
      <DashboardPage />
    </AppShellLayout>
  ),
};

/**
 * Der Anlass für den Slot: eine **Suche** in der Label-Zeile, daneben ein
 * vollständig englischer `ThemeToggle` mit eigener `id`. Der Slot nimmt den
 * Platz rechts vom Label; `max-w-md mx-auto` auf dem Eingabefeld zentriert es
 * darin (Auto-Margins schlagen `justify-end`) — zentriert also *in der Fläche
 * nach dem Label*, nicht im Viewport. Beides sind Chrome-Elemente: keine
 * Überschrift gehört hier hinein.
 */
export const WithSearchAndEnglishToggle: Story = {
  args: {
    logo: <Logo product="App" size="sm" />,
    pageLabel: "Dashboard",
    nav,
    sidebarFooter: userMenu,
    headerActions: (
      <>
        <Input
          type="search"
          aria-label="Search"
          placeholder="Search…"
          leadingIcon={<Search />}
          className="w-full max-w-md mx-auto"
        />
        <ThemeToggle
          id="app-theme-toggle"
          themeLabel="Colour scheme"
          lightLabel="Light"
          systemLabel="System"
          darkLabel="Dark"
        />
      </>
    ),
  },
  render: (args) => (
    <AppShellLayout {...args}>
      <DashboardPage />
    </AppShellLayout>
  ),
};

/**
 * Ohne `headerActions` bleibt die Zeile leer bis auf das Label — das ist der
 * Fall für Apps, die ihren Theme-Umschalter woanders führen (z. B. im
 * Nutzermenü der Sidebar). Bis 0.25.0 war er nicht erreichbar: das Template
 * rendert den Umschalter jetzt nicht mehr von sich aus.
 */
export const WithoutHeaderActions: Story = {
  args: {
    logo: <Logo product="App" size="sm" />,
    pageLabel: "Dashboard",
    nav,
    sidebarFooter: userMenu,
  },
  render: (args) => (
    <AppShellLayout {...args}>
      <DashboardPage />
    </AppShellLayout>
  ),
};
