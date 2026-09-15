import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { LayoutDashboard, LogOut, Search, Settings, Users } from "lucide-react";
import { AppShellLayout, type AppShellLayoutProps } from "./app-shell-layout";
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

/**
 * Dieselben Zeilen, aber mit `label` — das ist die Bedingung dafür, dass eine
 * Zeile überhaupt einklappt: der String ist ihr zugänglicher Name und ihr
 * Tooltip, und eine Zeile ohne `label` bleibt in voller Breite stehen, statt
 * ihren einzigen Text zu verlieren.
 */
const collapsibleNav = (
  <>
    <NavItem label="Übersicht" active>
      <LayoutDashboard width="1em" height="1em" aria-hidden />
      <span>Übersicht</span>
    </NavItem>
    <NavItem label="Team">
      <Users width="1em" height="1em" aria-hidden />
      <span>Team</span>
    </NavItem>
    <NavItem label="Einstellungen">
      <Settings width="1em" height="1em" aria-hidden />
      <span>Einstellungen</span>
    </NavItem>
  </>
);

function CollapsibleShell(
  props: Omit<AppShellLayoutProps, "collapsed" | "onCollapsedChange">,
) {
  // Der Zustand gehört der App — genau so sieht die vorgesehene Verdrahtung
  // aus. Das Template reicht ihn nur an seine Sidebar weiter und merkt sich
  // nichts; `localStorage`/URL/Context statt `useState` ändern daran nichts.
  const [collapsed, setCollapsed] = useState(false);
  return (
    <AppShellLayout {...props} collapsed={collapsed} onCollapsedChange={setCollapsed}>
      <DashboardPage />
    </AppShellLayout>
  );
}

/**
 * **Seit 0.28.0**: die einklappbare Spalte ist aus dem Template erreichbar.
 * `collapsed` + `onCollapsedChange` gehen unverändert an die interne
 * `Sidebar`; den Schalter rendert die Spalte selbst (rechts in der
 * Header-Zeile, neben der Marke) — das Template bringt hier **kein** eigenes
 * Bedienelement mit und braucht dafür auch keinen Slot.
 *
 * Beide Zustände in einer Story, weil der Schalter der einzige Weg zurück ist:
 * klicken zeigt die 80px-Spalte mit Icon-Zeilen, erneut klicken die volle.
 * Ohne `onCollapsedChange` (alle Stories oben) gibt es weiterhin keinen
 * Schalter — die Ergänzung ist rein additiv.
 */
export const WithCollapsibleSidebar: Story = {
  args: {
    logo: <Logo product="App" size="sm" />,
    pageLabel: "Dashboard",
    nav: collapsibleNav,
    sidebarFooter: userMenu,
    headerActions: <ThemeToggle />,
  },
  render: (args) => <CollapsibleShell {...args} />,
  play: async ({ canvasElement, userEvent }) => {
    // Oracle für die Breiten: der in `src/tokens.css` deklarierte Token, aus
    // dem CSSOM zurückgelesen — kein literales "256px", das auch dann grün
    // wäre, wenn das Utility zu nichts kompilierte. Diese Story prüft, dass
    // die Zustände im Browser wirklich unterschiedlich *aussehen*; dass die
    // zugänglichen Namen beide Zustände überleben, ist in
    // `app-shell-layout.test.tsx` gegen accname geprüft — hier wird nur die
    // Quelle des Namens abgetastet (`aria-label` vorhanden/nicht).
    const tokenWidth = (name: string) => {
      const root = getComputedStyle(document.documentElement);
      const raw = root.getPropertyValue(name).trim();
      const match = /^([\d.]+)rem$/.exec(raw);
      if (!match) throw new Error(`Token ${name} fehlt oder ist kein rem-Maß: "${raw}"`);
      return `${parseFloat(match[1]) * parseFloat(root.fontSize)}px`;
    };
    const desktopColumn = () => canvasElement.querySelector("aside") as HTMLElement;
    const byLabel = (label: string) =>
      canvasElement.querySelector(`[aria-label='${label}']`) as HTMLElement;

    await expect(getComputedStyle(desktopColumn()).width).toBe(
      tokenWidth("--width-sidebar"),
    );
    // Die Zeile trägt ihren Namen hier aus ihrem sichtbaren Text.
    await expect(byLabel("Team")).toBeNull();

    await userEvent.click(byLabel("Navigation einklappen"));
    await expect(getComputedStyle(desktopColumn()).width).toBe(
      tokenWidth("--width-sidebar-collapsed"),
    );
    // …und eingeklappt aus `label` — derselbe String, andere Quelle.
    await expect(byLabel("Team")).not.toBeNull();

    await userEvent.click(byLabel("Navigation ausklappen"));
    await expect(getComputedStyle(desktopColumn()).width).toBe(
      tokenWidth("--width-sidebar"),
    );
  },
};
