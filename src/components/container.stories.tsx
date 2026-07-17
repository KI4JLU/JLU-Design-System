import type { Meta, StoryObj } from "@storybook/react-vite";
import { Container } from "./container";
import { Card } from "./card";

const meta = {
  title: "Layout/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
  argTypes: {
    size: { control: "select", options: ["default", "narrow"] },
    asChild: { control: false },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Zentrierte Seitenspalte: Seitenränder `gutter` (mobil) / `margin-page` (ab md),
 * maximale Breite `container-max`. `narrow` ist die einspaltige Lese-/Formularbreite.
 */
export const Playground: Story = {
  args: { size: "default" },
  render: (args) => (
    <Container {...args} className="py-gutter">
      <Card className="p-6">Inhalt — die Ränder kommen vom Container.</Card>
    </Container>
  ),
};
