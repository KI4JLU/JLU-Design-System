import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";
import { FormItem, FormLabel, FormControl, FormMessage } from "./form";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  args: { placeholder: "System-Prompt eingeben…" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
  args: { disabled: true, value: "Nicht editierbar" },
};

/** In den Form-Primitives: Label, aria-Verdrahtung und Fehlertext inklusive. */
export const InFormItem: Story = {
  render: () => (
    <FormItem className="max-w-sm" error="Der Prompt darf nicht leer sein.">
      <FormLabel>System-Prompt</FormLabel>
      <FormControl>
        <Textarea rows={4} defaultValue="" />
      </FormControl>
      <FormMessage />
    </FormItem>
  ),
};
