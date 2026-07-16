import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "./grid";
import { Card, CardHeader, CardTitle, CardDescription } from "./card";

const meta = {
  title: "Layout/Grid",
  component: Grid,
  argTypes: {
    cols: { control: "select", options: [1, 2, 3, 4] },
    gap: { control: "select", options: ["sm", "md", "lg", "gutter"] },
    asChild: { control: false },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `cols` ist die Desktop-Spaltenzahl; der Umbruch auf 1 Spalte (mobil) ist eingebaut. */
export const Playground: Story = {
  args: { cols: 3, gap: "gutter" },
  render: (args) => (
    <Grid {...args}>
      {["Campus-Bot", "Prüfungsamt-Bot", "Bibliotheks-Bot"].map((name) => (
        <Card key={name}>
          <CardHeader>
            <CardTitle className="text-body-base">{name}</CardTitle>
            <CardDescription>Zuletzt aktiv vor 2 Std.</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </Grid>
  ),
};
