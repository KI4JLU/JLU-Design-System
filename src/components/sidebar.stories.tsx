import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
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
 * `label` mirrors the visible text: it is the accessible name and the tooltip
 * text once the column is collapsed. The text itself sits in a `<span>`, which
 * is what lets the collapsed form hide it.
 */
const nav = (
  <>
    <NavItem label="Übersicht" active data-testid="row-uebersicht">
      <LayoutDashboard width="1em" height="1em" aria-hidden />
      <span>Übersicht</span>
    </NavItem>
    <NavItem label="Team" data-testid="row-team">
      <Users width="1em" height="1em" aria-hidden />
      <span>Team</span>
    </NavItem>
    <NavItem label="Einstellungen" data-testid="row-einstellungen">
      <Settings width="1em" height="1em" aria-hidden />
      <span>Einstellungen</span>
    </NavItem>
  </>
);

const brand = (
  <span data-testid="brand">
    <Logo product="App" size="sm" />
  </span>
);

/**
 * Oracle for every width assertion below: the token as **declared in
 * `src/tokens.css`**, read back out of the CSSOM and converted with the
 * document's own root font size. Deliberately not a literal `"256px"` — a
 * literal would still pass if `w-(--width-sidebar)` compiled to nothing and
 * the column happened to end up that wide, and it would have to be edited
 * whenever the token is retuned, which is the thing the token exists to
 * prevent. A missing or non-rem token throws rather than quietly comparing
 * `""`.
 */
function tokenWidth(name: string): string {
  const root = getComputedStyle(document.documentElement);
  const raw = root.getPropertyValue(name).trim();
  const match = /^([\d.]+)rem$/.exec(raw);
  if (!match) throw new Error(`Token ${name} fehlt oder ist kein rem-Maß: "${raw}"`);
  return `${parseFloat(match[1]) * parseFloat(root.fontSize)}px`;
}

const expandedWidth = () => tokenWidth("--width-sidebar");
const collapsedWidth = () => tokenWidth("--width-sidebar-collapsed");

const aside = (canvasElement: HTMLElement) =>
  canvasElement.querySelector("aside") as HTMLElement;

/**
 * Die strukturelle Navigationsspalte: Header (Marke), scrollbare Navigation,
 * Footer (Nutzermenü: Avatar, Name/Rolle, Chevron). Positionierung und
 * Viewport-Verhalten liefert das komponierende Gerüst. **Seit 0.30.0 ist das
 * nicht mehr `AppShell`** — dessen Navigationsspalte ist ein `SidePanel`;
 * `Sidebar` ist die eigenständige Navigationsspalte außerhalb der Shell. Der
 * ThemeToggle sitzt in `AppShellLayout` rechts in der Chrome-Zeile, nicht im
 * Sidebar-Footer.
 */
export const Complete: Story = {
  render: () => (
    <div className="h-160 overflow-hidden rounded-xl border border-outline-variant">
      <Sidebar header={<Logo product="App" size="sm" />} footer={userMenu}>
        {nav}
      </Sidebar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Die ausgeklappte Breite ist unverändert gegenüber dem früheren `w-64`:
    // dasselbe Maß, jetzt aus dem Token.
    await expect(getComputedStyle(aside(canvasElement)).width).toBe(expandedWidth());
  },
};

/**
 * Eingeklappt: nur Icons, Breite aus `--width-sidebar-collapsed`. Jede Zeile
 * behält ihren zugänglichen Namen (`aria-label` aus `label`) und bekommt einen
 * Tooltip mit demselben Text; das Nutzermenü schrumpft auf den Avatar.
 *
 * Der Zustand ist **kontrolliert** — hier als festes Prop gesetzt, damit die
 * Story genau einen Zustand zeigt; die interaktive Variante steht darunter.
 */
export const Collapsed: Story = {
  render: () => (
    <div className="h-160 overflow-hidden rounded-xl border border-outline-variant">
      <Sidebar collapsed onCollapsedChange={() => {}} header={brand} footer={userMenu}>
        {nav}
      </Sidebar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = aside(canvasElement);
    // 1. Die Breite kommt aus dem Token — und ist eine andere als die
    //    ausgeklappte (sonst wäre der Vergleich oben trivial erfüllbar).
    await expect(getComputedStyle(column).width).toBe(collapsedWidth());
    await expect(collapsedWidth()).not.toBe(expandedWidth());

    // 2. Das Utility, das den Text ausblendet, kompiliert wirklich. Eine
    //    Klassennamens-Prüfung (so wie im jsdom-Test) wäre auch dann grün,
    //    wenn `[&>*:not(svg)]:hidden` zu nichts kompilierte — genau der
    //    Fehlermodus, den eine Arbitrary-Variant-Syntax haben kann.
    const row = canvasElement.querySelector("[data-testid='row-team']") as HTMLElement;
    await expect(getComputedStyle(row.querySelector("span")!).display).toBe("none");
    await expect(getComputedStyle(row.querySelector("svg")!).display).not.toBe("none");

    // 3. Nichts läuft aus der 80px-Spalte heraus — weder das Zeilen-Icon noch
    //    der auf den Avatar geschrumpfte Nutzermenü-Schalter noch der
    //    Ausklapp-Schalter. Das ist die eigentliche Probe auf die hergeleitete
    //    Breite: die Innenabstände stammen aus `navItemVariants` bzw. den
    //    Button-Varianten, nicht aus dieser Komponente.
    //    Und sie sind mittig: `mx-auto` am Nutzermenü hat den Avatar sichtbar
    //    links der Achse stehen lassen (auto-Margins wirken nicht auf eine
    //    inline-flex-Box) — eine reine „passt hinein"-Prüfung hat das nicht
    //    gesehen, eine Mittenprüfung schon.
    const box = column.getBoundingClientRect();
    const centered = (el: Element, what: string) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) throw new Error(`${what} ist nicht sichtbar`);
      if (r.left < box.left || r.right > box.right) {
        throw new Error(
          `${what} ragt aus der Spalte: ${r.left}–${r.right} vs ${box.left}–${box.right}`,
        );
      }
      const off = Math.abs((r.left + r.right) / 2 - (box.left + box.right) / 2);
      if (off > 1) throw new Error(`${what} steht ${off}px neben der Spaltenachse`);
    };
    centered(row.querySelector("svg")!, "Zeilen-Icon");
    centered(row, "Navigationszeile");
    centered(
      canvasElement.querySelector("[aria-label='Navigation ausklappen']")!,
      "Ausklapp-Schalter",
    );
    centered(canvasElement.querySelector("[aria-haspopup='menu']")!, "Nutzermenü");
  },
};

function CollapsibleDemo() {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div className="h-160 overflow-hidden rounded-xl border border-outline-variant">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        header={brand}
        footer={userMenu}
      >
        {nav}
      </Sidebar>
    </div>
  );
}

/**
 * Derselbe Zustand, diesmal von der App gehalten (`useState`) — so sieht die
 * vorgesehene Verdrahtung aus. Die Sidebar merkt sich nichts: sie ruft
 * `onCollapsedChange` auf und rendert, was danach als `collapsed` zurückkommt.
 */
export const Collapsible: Story = {
  render: () => <CollapsibleDemo />,
  play: async ({ canvasElement, userEvent }) => {
    const column = aside(canvasElement);
    const brandBox = (
      canvasElement.querySelector("[data-testid='brand']") as HTMLElement
    ).getBoundingClientRect();
    const toggle = canvasElement.querySelector(
      "[aria-label='Navigation einklappen']",
    ) as HTMLElement;

    // Rechtsbündig in derselben Zeile wie die Marke: der Schalter beginnt
    // hinter der Marke, und sein rechter Rand liegt genau die 16px der
    // Header-Zeile (`px-4`) vor der Spaltenkante. Das Maß stammt aus Tailwinds
    // veröffentlichter Spacing-Skala, nicht aus dieser Komponente.
    const toggleBox = toggle.getBoundingClientRect();
    await expect(toggleBox.left).toBeGreaterThanOrEqual(brandBox.right);
    await expect(Math.round(column.getBoundingClientRect().right - toggleBox.right)).toBe(16);
    // Vertikal in derselben Zeile (Mittelpunkte auf ±1px).
    await expect(
      Math.abs(
        (toggleBox.top + toggleBox.bottom) / 2 - (brandBox.top + brandBox.bottom) / 2,
      ),
    ).toBeLessThanOrEqual(1);

    await expect(getComputedStyle(column).width).toBe(expandedWidth());
    await userEvent.click(toggle);
    await expect(getComputedStyle(aside(canvasElement)).width).toBe(collapsedWidth());

    // …und zurück, über den Schalter, der eingeklappt übrig bleibt.
    const expand = canvasElement.querySelector(
      "[aria-label='Navigation ausklappen']",
    ) as HTMLElement;
    await expect(expand).not.toBeNull();
    await userEvent.click(expand);
    await expect(getComputedStyle(aside(canvasElement)).width).toBe(expandedWidth());
  },
};
