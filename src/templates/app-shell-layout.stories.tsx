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

const meta = {
  title: "Templates/AppShellLayout",
  component: AppShellLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppShellLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Die Label-Zeile selbst — das erste Element im `<main>`, das `AppShell`
 * rendert. Über die Struktur gesucht und nicht über eine Klasse: `h-16` ist
 * genau die Behauptung, die hier geprüft wird, und ein Selektor `.h-16` wäre
 * auch dann grün, wenn das Utility zu nichts kompilierte.
 */
const bar = (canvasElement: HTMLElement) =>
  canvasElement.querySelector("main")!.firstElementChild as HTMLElement;

/**
 * **64px, in jeder der vier Kombinationen** (nur Label / nur Aktionen /
 * beides / nichts). Die Zahl ist kein aus diesem Code abgelesenes Maß,
 * sondern der veröffentlichte Geometrie-Vertrag dieser Zeile: JustRAG
 * positioniert seine Toasts mit `top: 76px` = 64 + 12 darunter und misst
 * dieselbe 64 in einem eigenen Chromium-Test (`AppShellGeometry` in
 * HomeView.stories.tsx). Eine Zeile, die ohne Label zusammenfiele, schöbe
 * dort Toasts über das Chrome — deshalb hängt die Prüfung an jeder Story, die
 * eine neue Kombination zeigt, statt einmal zentral.
 */
async function expectBarHeight(canvasElement: HTMLElement) {
  await expect(getComputedStyle(bar(canvasElement)).height).toBe("64px");
}

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
  play: async ({ canvasElement }) => expectBarHeight(canvasElement),
};

/**
 * Der Anlass für den Slot: eine **Suche** in der Label-Zeile, daneben ein
 * vollständig englischer `ThemeToggle` mit eigener `id`. Der Slot nimmt den
 * Platz rechts vom Label; `w-full max-w-md mx-auto` **auf dem eigenen
 * Wrapper** des Suchfelds zentriert es darin (Auto-Margins schlagen
 * `justify-end`) — zentriert also *in der Fläche nach dem Label*, nicht im
 * Viewport. Beides sind Chrome-Elemente: keine Überschrift gehört hier hinein.
 *
 * **Warum der Wrapper (korrigiert in 0.29.0).** Bis dahin standen die drei
 * Klassen hier direkt am `<Input leadingIcon=…>` — und taten nichts: bei
 * gesetztem `leadingIcon` landet `className` am inneren `<input>`, das in
 * einem `<span class="block w-full">` steckt und selbst inline-block ist, wo
 * `margin: auto` zu `0px` berechnet wird. Gemessen (Chromium): das Feld stand
 * linksbündig in der Slot-Fläche, nicht zentriert, während die Doku
 * „zentriert" behauptete. Die Klassen gehören an den Knoten, der das
 * Flex-Item **ist**.
 */
export const WithSearchAndEnglishToggle: Story = {
  args: {
    logo: <Logo product="App" size="sm" />,
    pageLabel: "Dashboard",
    nav,
    sidebarFooter: userMenu,
    headerActions: (
      <>
        <div className="w-full max-w-md mx-auto">
          <Input
            type="search"
            aria-label="Search"
            placeholder="Search…"
            leadingIcon={<Search />}
          />
        </div>
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
  play: async ({ canvasElement, canvas }) => {
    await expectBarHeight(canvasElement);
    // Die Gegenprobe zu `WithCenteredSearchOnly`: **mit** Label heißt
    // „zentriert" ausdrücklich *nicht* „auf der Mitte der Zeile". Ohne diese
    // Assertion wäre die dortige Gleichheit nicht falsifizierbar — sie könnte
    // auch gelten, weil irgendetwas immer in der Mitte landet.
    const row = bar(canvasElement).getBoundingClientRect();
    const label = bar(canvasElement).querySelector("p")!.getBoundingClientRect();
    const field = (await canvas.findByRole("searchbox", { name: "Search" })).getBoundingClientRect();
    await expect(field.left).toBeGreaterThan(label.right);
    await expect(
      Math.abs((field.left + field.right) / 2 - (row.left + row.right) / 2),
    ).toBeGreaterThan(1);
  },
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
  play: async ({ canvasElement }) => expectBarHeight(canvasElement),
};

/**
 * **Seit 0.29.0: `pageLabel` ist optional** — und das ist der Fall, für den es
 * das ist. Die Seite hier bringt ihren Titel selbst mit (`SectionedGridLayout`
 * → `PageHeader`); ein Label in der Chrome-Zeile wäre dieselbe Zeichenkette
 * ein zweites Mal, direkt über der echten Überschrift. Weggelassen rendert das
 * Template **kein Element** dafür — auch kein leeres `<p>`, das als Flex-Item
 * die Zentrierung um seine eigene Breite verschöbe.
 *
 * Damit gehört die Zeile den `headerActions`: `flex-1` gibt dem Slot die
 * ganze Breite, `w-full max-w-md mx-auto` am **eigenen Wrapper** des Feldes
 * zentriert es darin. Kein neues Prop — dieselben zwei Utilities wie mit
 * Label, nur ist die Fläche, in der sie zentrieren, jetzt die ganze Zeile.
 * Die `play`-Funktion misst das in Chromium: Feldmitte = Zeilenmitte.
 */
export const WithCenteredSearchOnly: Story = {
  args: {
    logo: <Logo product="App" size="sm" />,
    nav,
    sidebarFooter: userMenu,
    headerActions: (
      <div className="w-full max-w-md mx-auto">
        <Input
          type="search"
          aria-label="Search"
          placeholder="Search…"
          leadingIcon={<Search />}
        />
      </div>
    ),
  },
  render: (args) => (
    <AppShellLayout {...args}>
      <SectionedGridPage />
    </AppShellLayout>
  ),
  play: async ({ canvasElement, canvas }) => {
    await expectBarHeight(canvasElement);

    // Orakel: die Symmetrie der Zeile selbst, gerechnet aus den Boxen, die
    // Chromiums Layout-Engine liefert — nicht aus Klassennamen. In jsdom wäre
    // dieselbe Prüfung wertlos (kein Stylesheet, alle Boxen 0×0), deshalb
    // steht sie hier und nicht in `app-shell-layout.test.tsx`.
    const row = bar(canvasElement).getBoundingClientRect();
    const field = (
      await canvas.findByRole("searchbox", { name: "Search" })
    ).getBoundingClientRect();
    await expect((field.left + field.right) / 2).toBeCloseTo(
      (row.left + row.right) / 2,
      0,
    );
    // …und das Feld füllt die Zeile nicht etwa aus (dann wäre die Mitte
    // trivial gleich): `max-w-md` deckelt es, links und rechts bleibt Luft.
    await expect(field.left).toBeGreaterThan(row.left);
    await expect(field.right).toBeLessThan(row.right);

    // Kein Label-Element, nicht nur kein Text: die Zeile enthält keinen
    // Absatz. Genau das unterscheidet „nichts rendern" von „leeres <p>".
    await expect(bar(canvasElement).querySelector("p")).toBeNull();
  },
};

/**
 * Weder Label noch Aktionen — die leere Zeile. Sie bleibt trotzdem **64px
 * hoch**: Consumer legen Overlays unter dieser Kante ab (JustRAGs
 * `Toast.css`: `top: 76px` = 64 + 12), und eine Zeile, die beim Weglassen der
 * letzten Prop zusammenfiele, wäre für eine unveränderte Aufrufstelle eine
 * brechende Geometrie-Änderung. Wer die Zeile wirklich nicht will, bekommt
 * dafür ein eigenes Prop — auf einer Karte, mit einer Migration, nicht
 * stillschweigend hier.
 */
export const WithoutPageLabelOrActions: Story = {
  args: {
    logo: <Logo product="App" size="sm" />,
    nav,
    sidebarFooter: userMenu,
  },
  render: (args) => (
    <AppShellLayout {...args}>
      <SectionedGridPage />
    </AppShellLayout>
  ),
  play: async ({ canvasElement }) => {
    await expectBarHeight(canvasElement);
    // Leer heißt leer: die Container-Spalte in der Zeile trägt kein Kind.
    await expect(bar(canvasElement).firstElementChild!.children.length).toBe(0);
  },
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
