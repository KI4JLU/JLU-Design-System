import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ResizeHandle } from "./resize-handle";
import { SidePanel } from "./side-panel";

const MIN = 150;
const MAX = 600;

const meta = {
  title: "Layout/ResizeHandle",
  component: ResizeHandle,
  args: {
    side: "left",
    value: 320,
    min: MIN,
    max: MAX,
    step: 10,
    label: "Breite der Verlaufsleiste ändern",
    onValueChange: () => {},
  },
  argTypes: {
    onValueChange: { control: false },
    onResizeStart: { control: false },
    onResizeEnd: { control: false },
  },
} satisfies Meta<typeof ResizeHandle>;

export default meta;
type Story = StoryObj<typeof meta>;

const Pane = ({ label, width }: { label: string; width?: number }) => (
  <div
    style={width ? { width } : undefined}
    className="flex flex-1 shrink-0 items-center justify-center bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant"
  >
    {label}
  </div>
);

const SingleHandle = ({ side }: { side: "left" | "right" }) => {
  const [width, setWidth] = useState(320);
  const pane = <Pane label={`${width}px`} width={width} />;
  return (
    <div className="flex h-80 overflow-hidden rounded-xl border border-outline-variant bg-surface">
      {side === "left" ? pane : <Pane label="Inhalt" />}
      <ResizeHandle
        side={side}
        value={width}
        min={MIN}
        max={MAX}
        label="Breite ändern"
        onValueChange={setWidth}
      />
      {side === "left" ? <Pane label="Inhalt" /> : pane}
    </div>
  );
};

/**
 * Ziehen mit der Maus **und** Tastatur: ←/→ (und ↑/↓ als Alias) um `step`,
 * Home/End auf `min`/`max`. Die Richtung hängt an `side` — die linke Leiste
 * wächst mit → bzw. ↑, die rechte mit ← bzw. ↓. Den Zieh-Vorgang besitzt die
 * Komponente, den Wert der Konsument.
 */
export const Playground: Story = {
  render: () => <SingleHandle side="left" />,
};

/** Rechte Leiste: gespiegelte Richtung, gleicher Wertebereich. */
export const RightPane: Story = {
  render: () => <SingleHandle side="right" />,
};

const Workspace = () => {
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(320);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="flex h-120 overflow-hidden rounded-xl border border-outline-variant bg-surface">
      <SidePanel
        side="left"
        isOpen={leftOpen}
        width={leftWidth}
        onExpand={() => setLeftOpen(true)}
        onCollapse={() => setLeftOpen(false)}
        expandLabel="Verlauf ausklappen"
        collapseLabel="Verlauf einklappen"
        aria-label="Verlauf"
      >
        <div className="flex flex-1 items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
          Verlauf · {leftWidth}px
        </div>
      </SidePanel>
      {leftOpen && (
        <ResizeHandle
          side="left"
          value={leftWidth}
          min={MIN}
          max={MAX}
          label="Breite der Verlaufsleiste ändern"
          onValueChange={setLeftWidth}
        />
      )}

      <Pane label="Chat" />

      {rightOpen && (
        <ResizeHandle
          side="right"
          value={rightWidth}
          min={MIN}
          max={MAX}
          label="Breite der Quellenleiste ändern"
          onValueChange={setRightWidth}
        />
      )}
      <SidePanel
        side="right"
        isOpen={rightOpen}
        width={rightWidth}
        onExpand={() => setRightOpen(true)}
        onCollapse={() => setRightOpen(false)}
        expandLabel="Quellen ausklappen"
        collapseLabel="Quellen einklappen"
        aria-label="Quellen"
      >
        <div className="flex flex-1 items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
          Quellen · {rightWidth}px
        </div>
      </SidePanel>
    </div>
  );
};

/**
 * Zusammenspiel beider Primitive: zwei `SidePanel` mit je einem
 * `ResizeHandle`. Jede Leiste zeichnet genau **eine** Randlinie (über `side`),
 * das Handle zeichnet keine — deshalb gibt es hier keine doppelten 1px-Linien
 * und keine negativen Margins. Das Zusammensetzen zu einer Seite ist Aufgabe
 * des Workspace-Templates, nicht dieser Story.
 */
export const InAWorkspace: Story = {
  render: () => <Workspace />,
};
