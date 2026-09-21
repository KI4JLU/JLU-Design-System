import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { expect } from "storybook/test";
import { FileText, History, MessageSquare } from "lucide-react";
import { SidePanel } from "./side-panel";

const meta = {
  title: "Layout/SidePanel",
  component: SidePanel,
  args: {
    side: "left",
    isOpen: true,
    width: 320,
    expandLabel: "Verlauf ausklappen",
    collapseLabel: "Verlauf einklappen",
    onExpand: () => {},
    onCollapse: () => {},
    children: null,
  },
  argTypes: {
    onExpand: { control: false },
    onCollapse: { control: false },
    header: { control: false },
    collapsedPreview: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof SidePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const entries = ["Zulassungsfristen", "Prüfungsordnung", "Bibliothek", "Mensa"];

const panelBody = (
  <ul className="flex min-h-0 flex-1 flex-col gap-stack-sm overflow-y-auto px-gutter py-stack-md">
    {entries.map((entry) => (
      <li
        key={entry}
        className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 font-body-base text-body-base text-on-surface"
      >
        {entry}
      </li>
    ))}
  </ul>
);

/**
 * Titel-Knoten für den `header`-Slot. `truncate` steht am Knoten des
 * Konsumenten, nicht im Rahmen: der Slot ist `min-w-0`, entscheiden muss die
 * Anwendung, ob ihr Titel kürzt, umbricht oder gar nicht schrumpft.
 */
const paneTitle = (text: string) => (
  <h2 className="truncate font-body-base text-body-base text-on-surface">{text}</h2>
);

const preview = (
  <>
    <History className="h-5 w-5 text-on-surface-variant" aria-hidden />
    <MessageSquare className="h-5 w-5 text-on-surface-variant" aria-hidden />
    <FileText className="h-5 w-5 text-on-surface-variant" aria-hidden />
  </>
);

/** Frame with a page-like neighbour, so the border edge is visible. */
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="flex h-120 overflow-hidden rounded-xl border border-outline-variant bg-surface">
    {children}
  </div>
);

const Interactive = ({
  side,
  title = "Verlauf",
}: {
  side: "left" | "right";
  title?: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const panel = (
    <SidePanel
      side={side}
      isOpen={isOpen}
      width={320}
      onExpand={() => setIsOpen(true)}
      onCollapse={() => setIsOpen(false)}
      expandLabel="Verlauf ausklappen"
      collapseLabel="Verlauf einklappen"
      header={paneTitle(title)}
      collapsedPreview={preview}
      aria-label="Verlauf"
    >
      {panelBody}
    </SidePanel>
  );
  const content = (
    <div className="flex flex-1 items-center justify-center font-body-base text-body-base text-on-surface-variant">
      Seiteninhalt
    </div>
  );
  return (
    <Frame>
      {side === "left" ? panel : content}
      {side === "left" ? content : panel}
    </Frame>
  );
};

/**
 * Kontrolliert: `isOpen` und `width` liegen beim Konsumenten. Der
 * Einklapp-Knopf gehört zum Rahmen — er ist im zugeklappten Zustand das
 * einzige Bedienelement. Links steht er am **nachlaufenden** Rand, also dem
 * zum Inhalt zeigenden; `header` füllt den Rest der Zeile.
 */
export const Playground: Story = {
  render: () => <Interactive side="left" />,
};

/**
 * Rechte Leiste: Rand und Chevron spiegeln sich über `side` — und der
 * Umschalter wandert mit. Er steht **vor** dem `header`, wieder am zum Inhalt
 * zeigenden Rand, so dass die beiden Kopfzeilen eines Workspace zur Mitte hin
 * spiegelsymmetrisch sind.
 */
export const RightSide: Story = {
  render: () => <Interactive side="right" />,
};

/**
 * Langer Titel: Der `header`-Slot ist `min-w-0`, ein `truncate`-Knoten kürzt
 * deshalb mit Ellipse, statt den Umschalter aus der Zeile zu drängen. Die
 * Zeile ist in beiden Richtungen `h-16` hoch — dieselbe Chrome-Einheit wie die
 * Leiste von `AppShellLayout`, damit die Kopfzeilen auf einer Linie liegen.
 */
export const LongHeaderTitle: Story = {
  render: () => (
    <Interactive
      side="left"
      title="Gesprächsverlauf zur Prüfungsordnung des Fachbereichs 07"
    />
  ),
};

/**
 * Zugeklappt: 60px-Schiene mit Ausklapp-Knopf und optionaler
 * `collapsedPreview`. Der Inhalt bleibt montiert, ist aber ausgeblendet —
 * Scrollposition und halb getippte Eingaben überleben das Einklappen. Der
 * `header` dagegen wird **gar nicht** gerendert: in der Schiene ist Platz für
 * genau ein Bedienelement (hier mit gesetztem `header`, der trotzdem fehlt).
 */
export const Collapsed: Story = {
  args: {
    isOpen: false,
    header: paneTitle("Verlauf"),
    collapsedPreview: preview,
    children: panelBody,
  },
  render: (args) => (
    <Frame>
      <SidePanel {...args} aria-label="Verlauf" />
      <div className="flex flex-1 items-center justify-center font-body-base text-body-base text-on-surface-variant">
        Seiteninhalt
      </div>
    </Frame>
  ),
};

/** Ohne `collapsedPreview` bleibt nur der Ausklapp-Knopf in der Schiene. */
export const CollapsedWithoutPreview: Story = {
  args: { isOpen: false, children: panelBody },
  render: (args) => (
    <Frame>
      <SidePanel {...args} aria-label="Verlauf" />
      <div className="flex flex-1 items-center justify-center font-body-base text-body-base text-on-surface-variant">
        Seiteninhalt
      </div>
    </Frame>
  ),
};

/**
 * **Geometrie der Kopfzeile (0.39.0): der Umschalter steht auf dem ersten
 * Bedienelement des Rumpfs.** Die Zeile ist `px-4` (16px) eingerückt und der
 * Knopf 32px breit (`p-1.5` + 20px-Icon), sein Mittelpunkt liegt also 32px von
 * der Kante der Leiste. Ein `p-4`-gepolsterter Rumpf — so polstert
 * `AppShellLayout` seine Navigation — setzt ein 32px-Bedienelement am
 * nachlaufenden Rand seiner ersten Zeile auf denselben Mittelpunkt: 16px
 * Polsterung + 16px halbe Breite. Bis 0.38.0 waren es `px-gutter` (24px) und
 * ein 36px-Knopf, also 42px, und die beiden verfehlten sich um 10px.
 *
 * **Das Orakel ist das Rechteck des Rumpf-Bedienelements, keine Zahl im
 * Test.** Die `play`-Funktion misst beide Mittelpunkte im selben
 * Browser-Layout und vergleicht sie miteinander — würde jemand `px-4` gegen
 * ein anderes Maß tauschen oder den Knopf wieder auf `p-2` stellen, fällt der
 * Vergleich. Nur die Breite des Knopfes (32px) und die Polsterung der Zeile
 * (16px) sind zusätzlich als Zahl festgehalten, weil sonst zwei gemeinsam
 * verschobene Maße gültig aussähen.
 */
export const ToggleAlignsWithBodyControl: Story = {
  args: {
    header: paneTitle("Verlauf"),
    children: (
      <div className="p-4">
        <div className="flex">
          <button className="ml-auto h-8 w-8" data-testid="body-control" />
        </div>
      </div>
    ),
  },
  render: (args) => (
    <Frame>
      <SidePanel {...args} aria-label="Verlauf" />
      <div className="flex flex-1 items-center justify-center font-body-base text-body-base text-on-surface-variant">
        Seiteninhalt
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const toggle = await canvas.findByRole("button", { name: "Verlauf einklappen" });
    const bodyControl = await canvas.findByTestId("body-control");
    const glyph = toggle.querySelector("svg") as SVGSVGElement;

    // Die eigentliche Zusicherung (0.41.0): die GEZEICHNETE Außenkante des
    // Symbols liegt auf der Außenkante des gefüllten Knopfs darunter — das
    // ist, was das Auge bei einem Ghost-Knopf ohne sichtbaren Kasten als
    // Bündigkeit liest. Nicht die svg-Box: lucide zeichnet 3..21 von 24, also
    // 2,5px innerhalb der 20px-Box, und genau dieser Rest war in 0.40.0 als
    // Stufe sichtbar. Die gezeichnete Kante kommt aus `getBBox()` (Nutzer-
    // einheiten), skaliert auf die gerenderte Box.
    const box = glyph.getBoundingClientRect();
    const bbox = glyph.getBBox();
    const scale = box.width / glyph.viewBox.baseVal.width;
    const drawnRight = box.left + (bbox.x + bbox.width) * scale;
    await expect(Math.abs(drawnRight - bodyControl.getBoundingClientRect().right)).toBeLessThan(1);

    // Und die beiden Maße, aus denen sich das ergibt — ohne sie wären zwei
    // gemeinsam verschobene Werte (etwa `px-6` plus ein 48px-Knopf) genauso
    // grün.
    await expect(toggle.getBoundingClientRect().width).toBeCloseTo(32, 0);
    // Der Elternknoten des Umschalters IST die Kopfzeile — `SidePanel` rendert
    // ihn direkt in die `h-16`-Zeile.
    const headerRow = toggle.parentElement as HTMLElement;
    await expect(getComputedStyle(headerRow).paddingLeft).toBe("16px");
  },
};
