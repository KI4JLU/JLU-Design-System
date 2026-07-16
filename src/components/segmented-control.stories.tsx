import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
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
