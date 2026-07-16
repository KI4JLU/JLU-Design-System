import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./spinner";
import { Button } from "./button";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6 text-on-surface-variant">
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
    </div>
  ),
};

/** Erbt die Textfarbe — funktioniert in Buttons und auf getönten Flächen. */
export const InButton: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled>
        <Spinner size="sm" label="Wird gespeichert …" />
        Speichern …
      </Button>
      <Button variant="outline" disabled>
        <Spinner size="sm" />
        Laden …
      </Button>
    </div>
  ),
};
