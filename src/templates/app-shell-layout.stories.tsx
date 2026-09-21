import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
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
import { usePersistedWidth } from "../lib/persisted-width";
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
 *
 * **Gemessen für 0.30.0** (Chromium, 1280px-Fenster) — die Zahlen stehen hier
 * als Beleg jenes Releases, nicht als aktuelle Behauptung: Zeile 256–1200 →
 * Mitte **728**, Feld 504–952 → Mitte **728** (448px breit, das ist
 * `max-w-md`), Label 296–421,4 (125,4px breit), Umschalter 1058–1160 (102px
 * breit). Die beiden Ränder sind also um 23px verschieden breit, die Mitte
 * stimmt trotzdem auf den Pixel — mit dem `mx-auto`-Rezept von 0.29.0 stünde
 * das Feld hier ~11,7px daneben.
 *
 * **Seit 0.37.0 ist die linke Zahl eine andere**: die Einrückung der Zeile ist
 * `px-gutter` (24px) statt des Seitenmaßes (40px ab `md`), das Label beginnt
 * also bei 256 + 24 = **280** statt bei 296. Die Mitte ändert sich nicht — sie
 * hängt an den zwei gleich breiten Randregionen, nicht an der Einrückung, und
 * genau das prüft die `play`-Funktion unten weiterhin. Die neue Einrückung
 * misst `BarInsetMatchesColumns`.
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
 * ob links etwas steht. Gemessen für 0.30.0 (Chromium, 1280px-Fenster): Zeile
 * 256–1200 → Mitte **728**, Feld 504–952 → Mitte **728** — dieselben Zahlen
 * wie mit Label, und von der Einrückungsänderung in 0.37.0 unberührt (die
 * Mitte hängt an den Randregionen, nicht am `px-*`).
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
 * **Seit 0.37.0: die Zeile nimmt den Spalten-Gutter.** Bis 0.36.0 steckten
 * beide Leisten in einem `Container` — dem **Seitenmaß** (`px-gutter
 * md:px-margin-page`, zentriert, gedeckelt), also 40px ab `md`. Die Zeile ist
 * aber keine Seiteninhalts-Spalte, sondern Chrome zwischen zwei `SidePanel`s,
 * deren `h-16`-Kopfzeile mit `px-gutter` (24px) eingerückt ist. Gemessen in
 * Chromium (1280px-Fenster, JustRAGs `KbWorkspaceLayout`, 2026-09-21): erster
 * Inhalt der Leiste 40px von der Spaltenkante, Logo der Spalte 24px — genau
 * die Lücke, die der Entwickler gesehen hat.
 *
 * **Das Orakel ist die Spalte, keine Zahl im Code.** Die `play`-Funktion misst
 * beide Einrückungen im selben Browser-Layout und vergleicht sie miteinander:
 * `pageLabel.left − aside.right` gegen `Kopfzeilen-Erstkind.left − aside.left`.
 * Würde jemand `px-gutter` hier gegen ein anderes Maß tauschen, ohne
 * `SidePanel` anzufassen, fällt der Vergleich — ein literales „24" wäre auch
 * dann grün, wenn die Spalte umzöge.
 */
export const BarInsetMatchesColumns: Story = {
  args: { pageLabel: "Dashboard", headerActions: <ThemeToggle /> },
  render: (args) => (
    <Shell {...args}>
      <DashboardPage />
    </Shell>
  ),
  play: async ({ canvas, canvasElement }) => {
    const column = (
      await canvas.findByRole("complementary", { name: "Hauptnavigation" })
    ).getBoundingClientRect();

    // Die Kopfzeile der Spalte über ihren Schalter gefunden — nicht über eine
    // Klasse: der Schalter ist das einzige Element, das `SidePanel` dort
    // garantiert rendert, und sein Elternknoten IST die Zeile.
    const toggle = await canvas.findByRole("button", { name: "Navigation einklappen" });
    const headerRow = toggle.parentElement as HTMLElement;
    const columnFirst = headerRow.firstElementChild as HTMLElement;
    // Links liest die Zeile [Marke … Schalter]; das Erstkind ist also die
    // Marke und nicht der Schalter. Ohne diese Prüfung würde die Messung
    // stillschweigend den Schalter vermessen.
    await expect(columnFirst).not.toBe(toggle);

    const label = (await canvas.findByText("Dashboard")).getBoundingClientRect();
    const columnInset = columnFirst.getBoundingClientRect().left - column.left;
    const barInset = label.left - column.right;

    await expect(barInset).toBeCloseTo(columnInset, 0);

    // Und die Zeile ist so breit wie die Hauptspalte: kein `max-w-*`-Deckel,
    // kein `mx-auto`. (Bei 1280px bände der alte 1440px-Deckel noch nicht —
    // diese Zusicherung gilt dem breiten Fenster, in dem er es täte.)
    const barRow = (canvasElement.querySelector("header") as HTMLElement)
      .firstElementChild as HTMLElement;
    const main = canvasElement.querySelector("main") as HTMLElement;
    await expect(barRow.getBoundingClientRect().width).toBeCloseTo(
      main.getBoundingClientRect().width,
      0,
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

/**
 * Der Story-Speicher: ein `Storage` im Arbeitsspeicher, damit der
 * Storybook-Vitest-Lauf nicht in die echte `localStorage` des Runners
 * schreibt. Eine App lässt `storage` weg — dann ist es `window.localStorage`,
 * und genau das ist der Unterschied zwischen dieser Story und dem Ernstfall.
 */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, String(value)),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
  } satisfies Storage;
}

const storyStorage = memoryStorage();

/**
 * Beide Breiten über `usePersistedWidth` — **genau die Verdrahtung, die eine
 * App schreibt**, bis auf das injizierte `storage`. Der Konsument übergibt den
 * **ganzen** Schlüssel (das Paket vergibt keinen Namensraum), und die
 * Komponenten bleiben kontrolliert: der Haken ist das Stück, das in `width`
 * und `resize.onWidthChange` eingehängt wird, kein Default in der Komponente.
 */
function ResizableShell(
  props: Omit<
    AppShellLayoutProps,
    "leftOpen" | "onLeftOpenChange" | "leftWidth" | "leftResize" | "rightPanel"
  >,
) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("page");
  const [leftWidth, setLeftWidth] = usePersistedWidth("storybook.appShell.leftWidth", {
    defaultWidth: 300,
    minWidth: 200,
    maxWidth: 560,
    storage: storyStorage,
  });
  const [rightWidth, setRightWidth] = usePersistedWidth("storybook.appShell.rightWidth", {
    defaultWidth: 280,
    minWidth: 200,
    maxWidth: 520,
    storage: storyStorage,
  });
  return (
    <AppShellLayout
      {...props}
      leftOpen={leftOpen}
      onLeftOpenChange={setLeftOpen}
      activeMobileTab={activeTab}
      onMobileTabChange={setActiveTab}
      leftWidth={leftWidth}
      leftResize={{
        minWidth: 200,
        maxWidth: 560,
        onWidthChange: setLeftWidth,
        label: "Breite der Navigation ändern",
      }}
      rightPanel={{
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
        width: rightWidth,
        expandLabel: "Quellen ausklappen",
        collapseLabel: "Quellen einklappen",
        resize: {
          minWidth: 200,
          maxWidth: 520,
          onWidthChange: setRightWidth,
          label: "Breite der Quellen ändern",
        },
      }}
    >
      <DashboardPage />
    </AppShellLayout>
  );
}

/**
 * **Seit 0.36.0: beide Spalten sind ziehbar.** Die Shell komponiert dafür
 * `SidePanel` + `ResizeHandle` — genau die Komposition, die `WorkspaceLayout`
 * seit 0.23.1 hat; es gibt keinen zweiten Mechanismus und keine Speicherung im
 * Paket. Die Breiten sind **Zustand der App** (`useState` hier,
 * `localStorage`/Context in einer echten App): `onWidthChange` liefert jeden
 * geklemmten Wert, die App reicht ihn über `leftWidth` bzw. `rightPanel.width`
 * zurück.
 *
 * Die `play`-Funktion misst in Chromium, was jsdom nicht kann: sie fokussiert
 * den linken Trenner, drückt dreimal `→` und prüft, dass die **gemessene**
 * Box der Spalte um 3 × `step` (30px) gewachsen ist und exakt dem
 * `aria-valuenow` des Trenners entspricht. Für die rechte Spalte dasselbe mit
 * `←` — die Pfeiltasten sind pro Seite gespiegelt, weil die Taste den
 * *Trenner* bewegt und `aria-valuenow` die *Spalte* meldet.
 *
 * Orakel: das Layout des Browsers gegen den Zustand der Story — keine im
 * Komponentencode abgelesene Zahl. Startbreiten werden gemessen, nicht
 * behauptet.
 *
 * **Die Breiten hält `usePersistedWidth`** (0.36.0) — der Haken, der die
 * gezogene Breite pro Gerät überlebt, mit dem **ganzen** Schlüssel vom
 * Konsumenten. Diese Story reicht ein `Storage` im Arbeitsspeicher herein,
 * damit der Testlauf nichts in der echten `localStorage` hinterlässt; eine App
 * lässt `storage` weg.
 */
export const WithResizableColumns: Story = {
  args: { pageLabel: "Wissensbasis", headerActions: <ThemeToggle /> },
  render: (args) => <ResizableShell {...args} />,
  play: async ({ canvas, userEvent }) => {
    const step = 10;

    // Linke Spalte: `→` verbreitert sie.
    const leftColumn = await canvas.findByRole("complementary", {
      name: "Hauptnavigation",
    });
    const leftHandle = await canvas.findByRole("separator", {
      name: "Breite der Navigation ändern",
    });
    const leftBefore = leftColumn.getBoundingClientRect().width;
    leftHandle.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    const leftAfter = leftColumn.getBoundingClientRect().width;
    await expect(leftAfter).toBe(leftBefore + 3 * step);
    // Gemessene Box und gemeldeter Wert sind EINE Zahl, nicht zwei.
    await expect(leftHandle.getAttribute("aria-valuenow")).toBe(String(leftAfter));

    // Rechte Spalte: gespiegelt, also `←`.
    const rightColumn = await canvas.findByRole("complementary", { name: "Quellen" });
    const rightHandle = await canvas.findByRole("separator", {
      name: "Breite der Quellen ändern",
    });
    const rightBefore = rightColumn.getBoundingClientRect().width;
    rightHandle.focus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}");
    const rightAfter = rightColumn.getBoundingClientRect().width;
    await expect(rightAfter).toBe(rightBefore + 3 * step);
    await expect(rightHandle.getAttribute("aria-valuenow")).toBe(String(rightAfter));

    // Und die Trenner liegen auf den inhaltsseitigen Kanten: links rechts von
    // der Spalte, rechts links davon.
    await expect(leftHandle.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      leftColumn.getBoundingClientRect().right - 1,
    );
    await expect(rightHandle.getBoundingClientRect().right).toBeLessThanOrEqual(
      rightColumn.getBoundingClientRect().left + 1,
    );
  },
};

/**
 * **0.38.0 — der Trenner belegt keine Layout-Breite mehr.** Bis 0.37.0 war das
 * `ResizeHandle` ein 6px breites, transparentes Flex-Element in der Reihe;
 * durchgeschienen ist dabei der `bg-surface`-Hintergrund der Shell, also ein
 * getönter Streifen zwischen zwei `bg-surface-container-lowest`-Flächen
 * („da ist ein ganzer div zwischen Header und Sidebar", JustRAG-KB, 09/2026).
 * Jetzt ist der Wirt `w-0` und die Greiffläche ein `::after`-Overlay, das mit
 * 8px **über** der Randlinie liegt (je 4px in beide Nachbarn).
 *
 * Diese `play`-Funktion prüft in Chromium genau das, was jsdom nicht kann —
 * **Orakel ist das Layout und das Hit-Testing des Browsers**, jede erwartete
 * Zahl ist die gemessene Kante des *Nachbarn*, nie ein Literal:
 *
 * 1. die Box des Trenners ist 0px breit,
 * 2. die rechte Kante der linken Spalte **ist** die linke Kante der
 *    Hauptspalte — zwischen beiden liegt nichts mehr,
 * 3. `elementFromPoint` liefert auf dieser Linie ±3px (also von beiden Seiten
 *    her) den Trenner, ±5px dagegen nicht mehr: die 8px-Greiffläche ist real
 *    und sie ist zentriert,
 * 4. ein Zeiger-Zug, der an einem so *gefundenen* Punkt beginnt, verändert
 *    Breite und `aria-valuenow` weiterhin um denselben Betrag.
 *
 * Der Zug-Zustand färbt das Overlay (`after:bg-primary`); der Ruhezustand ist
 * durchsichtig. Der **Hover**-Ton (`hover:after:bg-outline-variant`) wird hier
 * *nicht* geprüft: CSS-`:hover` hängt am echten Zeiger des Browsers und wird
 * von per JavaScript verschickten Pointer-Events nicht ausgelöst.
 */
export const HandleHasNoLayoutWidth: Story = {
  args: { pageLabel: "Wissensbasis", headerActions: <ThemeToggle /> },
  render: (args) => <ResizableShell {...args} />,
  play: async ({ canvas, userEvent }) => {
    const column = await canvas.findByRole("complementary", {
      name: "Hauptnavigation",
    });
    const handle = await canvas.findByRole("separator", {
      name: "Breite der Navigation ändern",
    });
    const main = await canvas.findByRole("main");

    // Definierter Startwert, egal was eine frühere Story im gemeinsamen
    // `storyStorage` hinterlassen hat: `Home` ist das angekündigte Minimum.
    handle.focus();
    await userEvent.keyboard("{Home}");

    // (1) Keine Layout-Breite.
    await expect(handle.getBoundingClientRect().width).toBe(0);

    // (2) Deshalb berühren sich die Nachbarn. Die erwartete Zahl ist die Kante
    //     der Spalte, nicht eine aus dem Code abgelesene Breite.
    const columnBox = column.getBoundingClientRect();
    await expect(main.getBoundingClientRect().left).toBe(columnBox.right);

    // (3) Die Greiffläche liegt über dieser Linie — von beiden Seiten
    //     erreichbar, aber nicht breiter als 8px.
    const borderX = columnBox.right;
    const midY = columnBox.top + columnBox.height / 2;
    await expect(document.elementFromPoint(borderX - 3, midY)).toBe(handle);
    await expect(document.elementFromPoint(borderX + 3, midY)).toBe(handle);
    await expect(document.elementFromPoint(borderX - 5, midY)).not.toBe(handle);
    await expect(document.elementFromPoint(borderX + 5, midY)).not.toBe(handle);

    // Im Ruhezustand ist das Overlay durchsichtig.
    const restFill = getComputedStyle(handle, "::after").backgroundColor;
    await expect(restFill).toBe("rgba(0, 0, 0, 0)");

    // (4) Und ein Zug, der an einem per Hit-Test *gefundenen* Punkt beginnt,
    //     zieht weiterhin — der Griff, den der Nutzer trifft, ist der Griff,
    //     der die Schleife fährt.
    const grab = document.elementFromPoint(borderX + 3, midY) as HTMLElement;
    const widthBefore = column.getBoundingClientRect().width;
    const valueBefore = Number(handle.getAttribute("aria-valuenow"));
    grab.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: borderX + 3,
        clientY: midY,
      }),
    );
    // Gefüllt, sobald der Zug läuft (`after:transition-colors` blendet über,
    // deshalb gepollt statt einmal gelesen).
    await waitFor(async () => {
      await expect(getComputedStyle(handle, "::after").backgroundColor).not.toBe(
        restFill,
      );
    });
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: borderX + 43,
        clientY: midY,
      }),
    );
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));

    // 40px nach rechts, linke Spalte → 40px breiter. Handarithmetik auf der
    // *gemessenen* Startbreite. Gepollt, weil der Zustandswechsel hier aus
    // einem **nativen** `window`-Listener kommt (der Griff fährt die Schleife
    // selbst) — React stapelt das und rendert erst danach.
    await waitFor(async () => {
      await expect(Number(handle.getAttribute("aria-valuenow"))).toBe(valueBefore + 40);
    });
    await expect(column.getBoundingClientRect().width).toBe(widthBefore + 40);
    // Und die Kanten liegen nach dem Zug wieder aufeinander.
    await expect(main.getBoundingClientRect().left).toBe(
      column.getBoundingClientRect().right,
    );
  },
};
