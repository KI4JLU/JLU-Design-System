import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
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

const Interactive = ({ side }: { side: "left" | "right" }) => {
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
 * einzige Bedienelement.
 */
export const Playground: Story = {
  render: () => <Interactive side="left" />,
};

/** Rechte Leiste: Rand und Chevron spiegeln sich über `side`. */
export const RightSide: Story = {
  render: () => <Interactive side="right" />,
};

/**
 * Zugeklappt: 60px-Schiene mit Ausklapp-Knopf und optionaler
 * `collapsedPreview`. Der Inhalt bleibt montiert, ist aber ausgeblendet —
 * Scrollposition und halb getippte Eingaben überleben das Einklappen.
 */
export const Collapsed: Story = {
  args: { isOpen: false, collapsedPreview: preview, children: panelBody },
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
