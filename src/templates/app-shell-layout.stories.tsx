import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { expect } from "storybook/test";
import {
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { AppShellLayout, type AppShellLayoutProps } from "./app-shell-layout";
import { Card } from "../components/card";
import { DropdownMenuItem } from "../components/dropdown-menu";
import { Input } from "../components/input";
import { Logo } from "../components/logo";
import { NavItem } from "../components/nav-item";
import { SidebarUserMenu } from "../components/sidebar-user-menu";
import { SIDE_PANEL_RAIL_WIDTH } from "../components/side-panel-variants";
import { ThemeToggle } from "../components/theme-toggle";
import type { MobilePaneTab } from "../lib/pane-layout";
import * as dashboardStories from "./dashboard-layout.stories";
import * as sectionedGridStories from "./sectioned-grid-layout.stories";

// Portable Stories: die Dashboard-Template-Story ist der Seiteninhalt —
// Templates komponieren ineinander, nichts wird neu gemockt.
const { Standard: DashboardPage } = composeStories(dashboardStories, {});
// Dasselbe für die Seite, die ihren Titel **selbst** rendert (`PageHeader`,
// `<h1>Sammlungen</h1>`). Sie ist der Grund, aus dem `pageLabel` optional
// wurde: mit Label stünde „Sammlungen" zweimal untereinander.
const { Standard: SectionedGridPage } = composeStories(sectionedGridStories, {});

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

const nav = (
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

/**
 * Die Reiter der schmalen Anordnung. Welcher Reiter welchen Bereich zeigt, ist
 * **Daten der App** — das Template leitet daraus nichts ab.
 */
const TABS: MobilePaneTab[] = [
  { id: "nav", icon: <Home />, label: "Bereiche", pane: "left" },
  { id: "page", icon: <LayoutDashboard />, label: "Seite", pane: "main" },
  { id: "sources", icon: <FileText />, label: "Quellen", pane: "right" },
];

const meta = {
  title: "Templates/AppShellLayout",
  component: AppShellLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  // Basis-Args nur für die Props-Tabelle: jede Story rendert über `render` mit
  // eigenem Zustand, weil der Einklapp-Zustand und der aktive Reiter beim
  // Konsumenten liegen und in Storybook nur als lokaler State existieren.
  args: {
    logo: <Logo product="App" size="sm" />,
    nav,
    sidebarFooter: userMenu,
    leftOpen: true,
    onLeftOpenChange: () => {},
    mobileTabs: TABS,
    activeMobileTab: "page",
    onMobileTabChange: () => {},
    mobileTabBarLabel: "Bereichswechsel",
  },
  argTypes: {
    rightPanel: { control: false },
    mobileTabs: { control: false },
    onMobileTabChange: { control: false },
    onLeftOpenChange: { control: false },
  },
} satisfies Meta<typeof AppShellLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Der Einklapp-Zustand gehört der App — genau so sieht die vorgesehene
 * Verdrahtung aus (`localStorage`/URL/Context statt `useState` ändert daran
 * nichts). Das Template merkt sich nichts.
 */
function Shell(props: Omit<AppShellLayoutProps, "leftOpen" | "onLeftOpenChange">) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("page");
  return (
    <AppShellLayout
      {...props}
      leftOpen={leftOpen}
      onLeftOpenChange={setLeftOpen}
      activeMobileTab={activeTab}
      onMobileTabChange={setActiveTab}
    />
  );
}

/**
 * Die Chrome-Zeile selbst: das `banner`-Landmark der Shell. Über die Rolle
 * gesucht und nicht über eine Klasse — `h-16` ist genau die Behauptung, die
 * hier geprüft wird, und ein Selektor `.h-16` wäre auch dann grün, wenn das
 * Utility zu nichts kompilierte.
 */
const bar = (canvasElement: HTMLElement) =>
  canvasElement.querySelector("header") as HTMLElement;

/**
 * **64px, in jeder Kombination** (nur Label / nur Suche / nur Aktionen /
 * alles / nichts). Die Zahl ist kein aus diesem Code abgelesenes Maß, sondern
 * der veröffentlichte Geometrie-Vertrag dieser Zeile: JustRAG positioniert
 * seine Toasts mit `top: 76px` = 64 + 12 darunter und misst dieselbe 64 in
 * einem eigenen Chromium-Test (`AppShellGeometry` in HomeView.stories.tsx).
 */
async function expectBarHeight(canvasElement: HTMLElement) {
  await expect(getComputedStyle(bar(canvasElement)).height).toBe("64px");
}

/**
 * Der Standardfall der Skizze: linke `SidePanel`-Spalte (Marke + Schalter in
 * der Kopfzeile, Navigation, gepinntes Nutzermenü), Hauptspalte mit der
 * dreiteiligen Chrome-Zeile, darunter der Seiteninhalt.
 */
export const WithDashboard: Story = {
  args: { pageLabel: "Dashboard", headerActions: <ThemeToggle /> },
  render: (args) => (
    <Shell {...args}>
      <DashboardPage />
    </Shell>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);
    // Die Spalte steht links neben dem Hauptbereich — aus den Layout-Boxen,
    // nicht aus Klassennamen.
    const column = await canvas.findByRole("complementary", { name: "Hauptnavigation" });
    const main = canvasElement.querySelector("main")!;
    await expect(column.getBoundingClientRect().right).toBeLessThanOrEqual(
      main.getBoundingClientRect().left + 1,
    );
  },
};

/**
 * **Seit 0.30.0: `search` ist die Mitte der Zeile** — und zwar die Mitte der
 * *Zeile*, nicht die Mitte der Fläche, die das Label übrig lässt. Genau das
 * war mit dem `mx-auto`-Rezept von 0.29.0 nicht erreichbar: dort sprang das
 * Feld seitwärts, sobald ein Label da war (oder sich seine Länge änderte).
 *
 * Die `play`-Funktion misst es in Chromium: Feldmitte = Zeilenmitte, obwohl
 * links ein Label und rechts ein Umschalter unterschiedlich breit sind.
 * Gemessen (Chromium, 1280px-Fenster): Zeile 256–1200 → Mitte **728**, Feld
 * 504–952 → Mitte **728** (448px breit, das ist `max-w-md`), Label 296–421,4
 * (125,4px breit), Umschalter 1058–1160 (102px breit). Die beiden Ränder sind
 * also um 23px verschieden breit, die Mitte stimmt trotzdem auf den Pixel —
 * mit dem `mx-auto`-Rezept von 0.29.0 stünde das Feld hier ~11,7px daneben.
 */
export const WithCenteredSearch: Story = {
  args: {
    pageLabel: "Dashboard",
    search: (
      <Input type="search" aria-label="Search" placeholder="Search…" leadingIcon={<Search />} />
    ),
    headerActions: (
      <ThemeToggle
        id="app-theme-toggle"
        themeLabel="Colour scheme"
        lightLabel="Light"
        systemLabel="System"
        darkLabel="Dark"
      />
    ),
  },
  render: (args) => (
    <Shell {...args}>
      <DashboardPage />
    </Shell>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);

    // Orakel: die Symmetrie der Zeile, gerechnet aus den Boxen der
    // Layout-Engine. In jsdom wäre dieselbe Prüfung wertlos (kein Stylesheet,
    // alle Boxen 0×0), deshalb steht sie hier.
    const row = bar(canvasElement).getBoundingClientRect();
    const label = (await canvas.findByText("Dashboard")).getBoundingClientRect();
    const toggle = (
      await canvas.findByRole("group", { name: "Colour scheme" })
    ).getBoundingClientRect();
    const field = (
      await canvas.findByRole("searchbox", { name: "Search" })
    ).getBoundingClientRect();

    await expect((field.left + field.right) / 2).toBeCloseTo((row.left + row.right) / 2, 0);
    // …und das ist nicht trivial: links und rechts vom Feld steht
    // unterschiedlich viel. Ohne die beiden gleich breiten Randregionen wäre
    // die Mitte um die halbe Differenz verschoben.
    await expect(Math.abs(label.width - toggle.width)).toBeGreaterThan(1);
    // Das Feld füllt die Zeile nicht aus (dann wäre die Mitte trivial gleich):
    // `max-w-md` deckelt es, links und rechts bleibt Luft.
    await expect(field.left).toBeGreaterThan(label.right);
    await expect(field.right).toBeLessThan(toggle.left);
  },
};

/**
 * Dieselbe Mitte **ohne** Label — der Fall, für den `pageLabel` 0.29.0
 * optional wurde (die Seite bringt ihren Titel selbst mit). Das Feld steht an
 * genau derselben Stelle wie oben: die Zentrierung hängt nicht mehr davon ab,
 * ob links etwas steht. Gemessen (Chromium, 1280px-Fenster): Zeile 256–1200 →
 * Mitte **728**, Feld 504–952 → Mitte **728** — dieselben Zahlen wie mit
 * Label.
 */
export const WithCenteredSearchOnly: Story = {
  args: {
    search: (
      <Input type="search" aria-label="Search" placeholder="Search…" leadingIcon={<Search />} />
    ),
  },
  render: (args) => (
    <Shell {...args}>
      <SectionedGridPage />
    </Shell>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);
    const row = bar(canvasElement).getBoundingClientRect();
    const field = (
      await canvas.findByRole("searchbox", { name: "Search" })
    ).getBoundingClientRect();
    await expect((field.left + field.right) / 2).toBeCloseTo((row.left + row.right) / 2, 0);
    await expect(field.left).toBeGreaterThan(row.left);
    await expect(field.right).toBeLessThan(row.right);
    // Kein Label-Element, nicht nur kein Text: die Zeile enthält keinen Absatz.
    await expect(bar(canvasElement).querySelector("p")).toBeNull();
  },
};

/**
 * Weder Label noch Suche noch Aktionen — die leere Zeile. Sie bleibt trotzdem
 * **64px hoch**: Consumer legen Overlays unter dieser Kante ab (JustRAGs
 * `Toast.css`: `top: 76px` = 64 + 12), und eine Zeile, die beim Weglassen der
 * letzten Prop zusammenfiele, wäre für eine unveränderte Aufrufstelle eine
 * brechende Geometrie-Änderung.
 */
export const WithoutPageLabelOrActions: Story = {
  render: (args) => (
    <Shell {...args}>
      <SectionedGridPage />
    </Shell>
  ),
  play: async ({ canvasElement }) => {
    await expectBarHeight(canvasElement);
    // Leer heißt leer: die Zeile trägt keinen Text und keinen Absatz.
    await expect(bar(canvasElement).textContent).toBe("");
    await expect(bar(canvasElement).querySelector("p")).toBeNull();
  },
};

/**
 * **Seit 0.30.0: eine zweite Spalte rechts.** `rightPanel` ist genau das
 * `AppShellPanel`, das `AppShell` selbst nimmt — dieselben acht Werte, kein
 * zweites Vokabular. Weggelassen gibt es weder Landmark noch Schiene.
 */
export const WithRightPanel: Story = {
  args: {
    pageLabel: "Dashboard",
    headerActions: <ThemeToggle />,
    rightPanel: {
      content: (
        <div className="flex flex-col gap-stack-md p-gutter">
          <Card className="p-4">Quelle 1</Card>
          <Card className="p-4">Quelle 2</Card>
        </div>
      ),
      header: <span className="truncate font-title-md">Quellen</span>,
      label: "Quellen",
      isOpen: true,
      onOpenChange: () => {},
      expandLabel: "Quellen ausklappen",
      collapseLabel: "Quellen einklappen",
    },
  },
  render: (args) => (
    <Shell {...args}>
      <DashboardPage />
    </Shell>
  ),
  play: async ({ canvas, canvasElement }) => {
    const main = canvasElement.querySelector("main")!;
    const right = await canvas.findByRole("complementary", { name: "Quellen" });
    await expect(main.getBoundingClientRect().right).toBeLessThanOrEqual(
      right.getBoundingClientRect().left + 1,
    );
  },
};

/**
 * Beide Zustände der linken Spalte in einer Story, weil der Schalter der
 * einzige Weg zurück ist: klicken zeigt die 60px-**Schiene** (nicht mehr eine
 * 80px-Icon-Spalte — das ist die sichtbarste Änderung von 0.30.0), erneut
 * klicken die volle Spalte.
 */
export const WithCollapsibleColumns: Story = {
  args: { pageLabel: "Dashboard", headerActions: <ThemeToggle /> },
  render: (args) => (
    <Shell {...args}>
      <DashboardPage />
    </Shell>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    // Orakel für die ausgeklappte Breite: der in `src/tokens.css` deklarierte
    // Token, aus dem CSSOM zurückgelesen — kein literales „256px", das auch
    // dann grün wäre, wenn das Utility zu nichts kompilierte. Für die Schiene:
    // die exportierte Designkonstante.
    const tokenWidth = (name: string) => {
      const root = getComputedStyle(document.documentElement);
      const raw = root.getPropertyValue(name).trim();
      const match = /^([\d.]+)rem$/.exec(raw);
      if (!match) throw new Error(`Token ${name} fehlt oder ist kein rem-Maß: "${raw}"`);
      return parseFloat(match[1]) * parseFloat(root.fontSize);
    };
    const column = () =>
      canvasElement.querySelector("aside") as HTMLElement;

    await expect(column().getBoundingClientRect().width).toBe(
      tokenWidth("--width-sidebar"),
    );

    await userEvent.click(await canvas.findByRole("button", { name: "Navigation einklappen" }));
    await expect(column().getBoundingClientRect().width).toBe(SIDE_PANEL_RAIL_WIDTH);
    /* Eingeklappt ist die Schiene — und seit 0.31.0 WANDERT die Navigation
       dorthin, statt mit dem Body zu verschwinden: „minimieren" heißt Icons,
       nicht „keine Navigation". Die Marke bleibt abgeräumt, `header` wandert
       nicht mit.

       Genau EIN Landmark, nicht zwei: der Knoten wird verschoben, nicht
       zusätzlich gerendert — zwei Kopien würden jede `id` und jedes
       `aria-current` in einer `NavItem` verdoppeln. */
    await expect(canvas.getAllByRole("navigation", { name: "Hauptnavigation" })).toHaveLength(1);
    await expect(canvas.queryByText("Marke")).toBeNull();

    /* Und die Zeilen passen wirklich in 60px — das ist die Messung, die nur der
       Browser-Runner machen kann (jsdom hat kein Layout). Orakel: die
       exportierte Designkonstante, nicht eine literale 60. */
    const row = await canvas.findByRole("button", { name: "Team" });
    await expect(row.getBoundingClientRect().width).toBeLessThanOrEqual(
      SIDE_PANEL_RAIL_WIDTH,
    );

    await userEvent.click(await canvas.findByRole("button", { name: "Navigation ausklappen" }));
    await expect(column().getBoundingClientRect().width).toBe(
      tokenWidth("--width-sidebar"),
    );
  },
};

/**
 * Die Anordnung unter `lg`: Top-Bar mit der Marke (und den `headerActions`,
 * damit die App ihre Chrome-Bedienelemente nicht verliert), **ein** Bereich,
 * `BottomTabBar`. Kein Burger-Button, kein Drawer, kein Dialog — und damit
 * auch kein Knoten, der zweimal im Dokument hängt.
 *
 * **Ohne `play`-Assertions, mit Absicht** — die Anordnung hängt am echten
 * Viewport (`matchMedia`), und der Storybook-Vitest-Lauf rendert Stories in
 * einem 1280px-Fenster, nicht im hier eingestellten Story-Viewport. Geprüft
 * ist sie in `app-shell-layout.test.tsx` (jsdom, gestubbter Viewport).
 */
export const Mobile: Story = {
  args: {
    pageLabel: "Dashboard",
    headerActions: <ThemeToggle />,
    search: (
      <Input type="search" aria-label="Search" placeholder="Search…" leadingIcon={<Search />} />
    ),
  },
  parameters: {
    viewport: {
      options: {
        phone: { name: "Phone", styles: { width: "390px", height: "844px" } },
      },
    },
  },
  globals: { viewport: { value: "phone" } },
  render: (args) => (
    <Shell {...args}>
      <DashboardPage />
    </Shell>
  ),
};

/**
 * **Die Schiene ist der senkrechte Spiegel der ausgeklappten Spalte** — jedes
 * Bedienelement behält beim Einklappen seine Höhe auf der Seite.
 *
 * Das war bis 0.34.0 nicht so: die Schiene baute ihren eigenen senkrechten
 * Rhythmus (`py-stack-md` + `gap-stack-md`) statt die `h-16`-Chrome-Zeile und
 * die Polsterung des Spaltenkörpers zu spiegeln, also sprangen der Schalter
 * und die ganze Icon-Leiste beim Einklappen nach oben. Gemessen in Chromium,
 * relativ zur Oberkante der Spalte, damit weder Scrollposition noch
 * Fenstergröße eingehen.
 *
 * Das Orakel ist der AUSGEKLAPPTE Zustand, nicht eine im Code abgelesene Zahl:
 * die ausgeklappte Spalte ist die, an der sich die eingeklappte auszurichten
 * hat, und beide Messungen kommen aus demselben Browser-Layout.
 */
export const CollapsedRailKeepsVerticalPositions: Story = {
  args: { pageLabel: "Dashboard", headerActions: <ThemeToggle /> },
  render: (args) => (
    <Shell {...args}>
      <DashboardPage />
    </Shell>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const column = () => canvasElement.querySelector("aside") as HTMLElement;
    // Alles relativ zur Spaltenoberkante: absolute Viewport-Koordinaten wären
    // von der Fenstergröße des Runners abhängig, die Differenz nicht.
    const offsetTop = (el: Element) =>
      el.getBoundingClientRect().top - column().getBoundingClientRect().top;
    const centreY = (el: Element) => {
      const box = el.getBoundingClientRect();
      return box.top + box.height / 2 - column().getBoundingClientRect().top;
    };

    // Der gepinnte Fuß wird von unten gemessen — er hängt an der Unterkante der
    // Spalte, nicht an deren Oberkante.
    const offsetBottom = (el: Element) =>
      column().getBoundingClientRect().bottom - el.getBoundingClientRect().bottom;

    const toggleOpen = await canvas.findByRole("button", { name: "Navigation einklappen" });
    const openToggleCentre = centreY(toggleOpen);
    const openNavTop = offsetTop(await canvas.findByRole("button", { name: "Übersicht" }));
    const openFootBottom = offsetBottom(
      await canvas.findByRole("button", { name: /Jamie Lee/ }),
    );

    await userEvent.click(toggleOpen);

    const toggleRail = await canvas.findByRole("button", { name: "Navigation ausklappen" });
    await expect(centreY(toggleRail)).toBe(openToggleCentre);
    // Dieselbe Zeile, jetzt in ihrer Icon-Form: `NavItem` behält seinen Namen
    // über `aria-label`, deshalb findet sie derselbe Selektor.
    await expect(offsetTop(await canvas.findByRole("button", { name: "Übersicht" }))).toBe(
      openNavTop,
    );
    /* Und der Fuß: derselbe Knoten, derselbe Abstand zur Unterkante. Die
       Schiene brachte hier bis 0.34.0 ein eigenes `pb-stack-md` mit, zusätzlich
       zur Polsterung im Knoten des Konsumenten — der Nutzermenü-Knopf saß
       eingeklappt 16px höher. Die Höhe des Knopfs ändert sich (`sm` → `icon`),
       die Unterkante darf es nicht. */
    await expect(offsetBottom(await canvas.findByRole("button", { name: /Jamie Lee/ }))).toBe(
      openFootBottom,
    );
  },
};
