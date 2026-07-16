import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta = {
  title: "Components/Input",
  component: Input,
  args: { placeholder: "Suchen…" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "inline"],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
  args: { disabled: true, value: "Nicht editierbar" },
};

/** `aria-invalid` steuert die Fehler-Optik (rot + roter Fokusring). */
export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "not-an-email", type: "email" },
};

/**
 * Randloses In-Flow-Feld für die Bearbeitung direkt in der Zeile — der Rahmen
 * kommt von der umgebenden Zeile, nicht vom Feld (z. B. Regel-Editor).
 */
export const Inline: Story = {
  render: () => (
    <div className="flex max-w-sm items-center gap-3 rounded-field border border-outline-variant bg-surface px-4 py-3">
      <input type="checkbox" defaultChecked aria-label="Regel aktiv" />
      <Input
        variant="inline"
        defaultValue="Antworte immer auf Deutsch."
        aria-label="Regel bearbeiten"
      />
    </div>
  ),
};
