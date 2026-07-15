import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta = {
  title: "Components/Input",
  component: Input,
  args: { placeholder: "Suchen…" },
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
