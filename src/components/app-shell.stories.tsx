import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import {
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell, type AppShellPanel } from "./app-shell";
import { Card } from "./card";
import { Container } from "./container";
import { Logo } from "./logo";
import { NavItem } from "./nav-item";
import { PageHeader } from "./page-header";
import { SIDE_PANEL_RAIL_WIDTH } from "./side-panel-variants";
import type { MobilePaneTab } from "../lib/pane-layout";

const TABS: MobilePaneTab[] = [
  { id: "nav", icon: <Home />, label: "Bereiche", pane: "left" },
  { id: "page", icon: <LayoutDashboard />, label: "Seite", pane: "main" },
  { id: "sources", icon: <FileText />, label: "Quellen", pane: "right" },
];

const meta = {
  title: "Layout/AppShell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
  // Basis-Args nur für die Props-Tabelle: jede Story rendert über `render` mit
  // eigenem Zustand, weil Einklapp-Zustand und aktiver Reiter beim Konsumenten
  // liegen und in Storybook nur als lokaler State existieren können.
  args: {
    mobileTabs: TABS,
    activeMobileTab: "page",
    onMobileTabChange: () => {},
    mobileTabBarLabel: "Bereichswechsel",
  },
  argTypes: {
    left: { control: false },
    right: { control: false },
    mobileTabs: { control: false },
    onMobileTabChange: { control: false },
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const brand = <Logo product="App" size="sm" />;

const navRows = (
  <nav aria-label="Hauptnavigation" className="flex flex-col gap-2 p-4">
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
  </nav>
);

const collapsedPreview = (
  <>
    <LayoutDashboard className="h-5 w-5 text-on-surface-variant" aria-hidden />
    <Sparkles className="h-5 w-5 text-on-surface-variant" aria-hidden />
  </>
);

/**
 * Der Zustand beider Spalten liegt — wie in einer App — außerhalb der Shell.
 * Hier ist es lokaler Story-State statt eines Contexts oder `localStorage`.
 */
function Interactive({
  leftOpenInitially = true,
  rightOpenInitially = true,
  withRight = true,
}: {
  leftOpenInitially?: boolean;
  rightOpenInitially?: boolean;
  withRight?: boolean;
}) {
  const [leftOpen, setLeftOpen] = useState(leftOpenInitially);
  const [rightOpen, setRightOpen] = useState(rightOpenInitially);
  const [activeTab, setActiveTab] = useState("page");

  const left: AppShellPanel = {
    content: navRows,
    header: brand,
    footer: (
      <div className="p-4 text-body-sm text-on-surface-variant">Jamie Lee</div>
    ),
    label: "Hauptnavigation",
    isOpen: leftOpen,
    onOpenChange: setLeftOpen,
    expandLabel: "Navigation ausklappen",
    collapseLabel: "Navigation einklappen",
    collapsedPreview,
  };

  const right: AppShellPanel = {
    content: (
      <div className="flex flex-col gap-stack-md p-gutter">
        <Card className="p-4">Quelle 1</Card>
        <Card className="p-4">Quelle 2</Card>
      </div>
    ),
    header: <span className="truncate font-title-md">Quellen</span>,
    label: "Quellen",
    isOpen: rightOpen,
    onOpenChange: setRightOpen,
    expandLabel: "Quellen ausklappen",
    collapseLabel: "Quellen einklappen",
  };

  return (
    <AppShell
      left={left}
      right={withRight ? right : undefined}
      topBar={
        <Container className="flex items-center gap-4">
          <p className="m-0 font-headline-md text-headline-md font-bold text-on-surface">
            Übersicht
          </p>
        </Container>
      }
      mobileTabs={TABS}
      activeMobileTab={activeTab}
      onMobileTabChange={setActiveTab}
      mobileTabBarLabel="Bereichswechsel"
    >
      <Container className="py-gutter md:py-margin-page">
        <PageHeader title="Übersicht" description="Hauptbereich — Inhalt kommt von der Seite." />
        <Card className="mt-gutter p-6">Seiteninhalt</Card>
      </Container>
    </AppShell>
  );
}

/**
 * Die Skizze: `SidePanel` links | Hauptspalte | `SidePanel` rechts. Beide
 * Spalten klappen unabhängig voneinander auf die 60px-Schiene ein; die
 * Kopfzeile der linken Spalte, die Chrome-Zeile der Hauptspalte und die
 * Kopfzeile der rechten Spalte sind je 64px hoch und liegen auf einer Linie.
 *
 * Unter `lg` zeigt dieselbe Shell **einen** Bereich plus die `BottomTabBar` —
 * sichtbar, indem man das Fenster schmaler als 1024px zieht (oder in der Story
 * `Mobile`).
 */
export const ThreeColumns: Story = {
  render: () => <Interactive />,
  play: async ({ canvas, canvasElement }) => {
    // Orakel: die Layout-Boxen, die Chromiums Engine liefert — keine
    // Klassennamen. Reihenfolge und Nebeneinander sind die Behauptung der
    // Skizze; in jsdom (0×0-Boxen) wäre dieselbe Prüfung wertlos.
    const left = await canvas.findByRole("complementary", { name: "Hauptnavigation" });
    const right = await canvas.findByRole("complementary", { name: "Quellen" });
    const main = canvasElement.querySelector("main")!;
    // Die Chrome-Zeile strukturell gesucht, nicht über `banner`: `PageHeader`
    // im Seiteninhalt rendert ebenfalls ein `<header>`, und aria-query (hinter
    // `getByRole`) bildet ein `<header>` **in** `<main>` noch auf `banner` ab,
    // während axe-core dafür den aktuellen Geltungsbereich `article, aside,
    // main, nav, section` verwendet und es nicht als Landmark zählt (geprüft in
    // `node_modules/axe-core`, `landmarkHasBodyContextMatches`). Das erste
    // `<header>` im Baum ist die Zeile der Shell.
    const bar = canvasElement.querySelector("header") as HTMLElement;

    const l = left.getBoundingClientRect();
    const m = main.getBoundingClientRect();
    const r = right.getBoundingClientRect();
    await expect(l.right).toBeLessThanOrEqual(m.left + 1);
    await expect(m.right).toBeLessThanOrEqual(r.left + 1);

    // Eine Chrome-Einheit: die Zeile über dem Inhalt ist 64px hoch und liegt
    // auf der Oberkante beider Spalten.
    await expect(bar.getBoundingClientRect().height).toBe(64);
    await expect(Math.round(bar.getBoundingClientRect().top)).toBe(Math.round(l.top));
    await expect(Math.round(r.top)).toBe(Math.round(l.top));
  },
};

/**
 * Beide Spalten eingeklappt: zwei 60px-Schienen (`SIDE_PANEL_RAIL_WIDTH`), die
 * linke mit `collapsedPreview`-Icons, und eine entsprechend breitere
 * Hauptspalte. **Die eingeklappte Form ist die Schiene** — es gibt keinen
 * Icon-Navigationsmodus mehr (Entscheidung des Entwicklers, 17.09.2026).
 */
export const ColumnsCollapsed: Story = {
  render: () => <Interactive leftOpenInitially={false} rightOpenInitially={false} />,
  play: async ({ canvas }) => {
    // Orakel: die exportierte Designkonstante — kein literales 60 hier.
    for (const name of ["Hauptnavigation", "Quellen"]) {
      const column = await canvas.findByRole("complementary", { name });
      await expect(column.getBoundingClientRect().width).toBe(SIDE_PANEL_RAIL_WIDTH);
    }
    // Nur der Weg zurück ist erreichbar; die Kopfzeilen sind abgeräumt.
    await expect(
      await canvas.findByRole("button", { name: "Navigation ausklappen" }),
    ).toBeVisible();
    await expect(canvas.queryByRole("navigation", { name: "Hauptnavigation" })).toBeNull();
  },
};

/**
 * Jede Spalte einzeln: `right` weggelassen heißt **keine** rechte Spalte und
 * **keine** Schiene — nicht etwa eine eingeklappte.
 */
export const WithoutRightColumn: Story = {
  render: () => <Interactive withRight={false} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("complementary", { name: "Quellen" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "Quellen ausklappen" })).toBeNull();
  },
};

/**
 * Die Anordnung unter `lg`: Top-Bar (Marke), **ein** Bereich, `BottomTabBar` —
 * kein Burger-Button, kein Drawer, kein Dialog. Welcher Bereich zu sehen ist,
 * entscheidet der aktive Reiter; die Zuordnung Reiter → Bereich ist Daten der
 * App (`mobileTabs`).
 *
 * **Ohne `play`-Assertions, mit Absicht.** Die Anordnung hängt am echten
 * Viewport (`matchMedia`), und der Storybook-Vitest-Lauf rendert Stories in
 * einem 1280px-Fenster, nicht im hier eingestellten Story-Viewport. Die
 * schmale Anordnung ist deshalb in `app-shell.test.tsx` (jsdom, gestubbter
 * Viewport) geprüft; diese Story ist die visuelle Kontrolle im Browser.
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      options: {
        phone: { name: "Phone", styles: { width: "390px", height: "844px" } },
      },
    },
  },
  globals: { viewport: { value: "phone" } },
  render: () => <Interactive />,
};
