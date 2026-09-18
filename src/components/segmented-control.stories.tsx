import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { SegmentedControl } from "./segmented-control";

const OPTIONS = [
  { value: "tag", label: "Tag" },
  { value: "woche", label: "Woche" },
  { value: "monat", label: "Monat" },
];

const meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  args: {
    options: OPTIONS,
    value: "woche",
    onValueChange: () => {},
    "aria-label": "Zeitraum",
  },
  argTypes: {
    value: { control: false },
    onValueChange: { control: false },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveExample = () => {
  const [value, setValue] = useState("woche");
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onValueChange={setValue}
      aria-label="Zeitraum"
    />
  );
};

/** Typischer Einsatz: der Diagramm-Zeitraum-Umschalter (Tag/Woche/Monat). */
export const Playground: Story = {
  render: () => <InteractiveExample />,
};

/**
 * Icon-only segments: pass an `icon` and the `label` becomes the accessible
 * name instead of the visible text. The card/list view toggle above a list.
 */
export const IconOnly: Story = {
  args: {
    "aria-label": "Ansicht",
    value: "card",
    options: [
      { value: "card", label: "Karten", icon: <LayoutGrid className="h-4 w-4" aria-hidden /> },
      { value: "list", label: "Liste", icon: <List className="h-4 w-4" aria-hidden /> },
    ],
  },
};
