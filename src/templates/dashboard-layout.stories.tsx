import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { DashboardLayout } from "./dashboard-layout";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { Grid } from "../components/grid";
import { Stack } from "../components/stack";
import { templateChromaticModes } from "./chromatic-modes";
import * as cardStories from "../components/card.stories";

// Portable Stories: vorhandene Component-Stories als Inhalt wiederverwenden
// statt Demo-Content neu zu mocken. Leere Projekt-Annotationen, damit der
// Preview-Decorator (Theme-Wrapper) nicht doppelt um die innere Story liegt.
const { Basic: CardBasic, Interactive: CardInteractive } = composeStories(cardStories, {});

const meta = {
  title: "Templates/DashboardLayout",
  component: DashboardLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen", chromatic: { modes: templateChromaticModes } },
} satisfies Meta<typeof DashboardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const stats = [
  ["Konversationen", "1 284"],
  ["Gelöst", "92 %"],
  ["Ø Antwortzeit", "1,8 s"],
  ["Aktive Widgets", "12"],
] as const;

export const Standard: Story = {
  args: { title: "Statistiken" },
  render: (args) => (
    <DashboardLayout
      {...args}
      description="Nutzung aller Widgets der letzten 30 Tage."
      actions={<Button variant="outline">Exportieren</Button>}
      stats={
        <>
          {stats.map(([label, value]) => (
            <Card key={label} className="p-6">
              <Stack gap="sm">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                  {label}
                </span>
                <span className="font-stat-lg text-stat-lg text-on-surface">{value}</span>
              </Stack>
            </Card>
          ))}
        </>
      }
    >
      <Grid cols={2}>
        <CardBasic />
        <CardInteractive />
      </Grid>
    </DashboardLayout>
  ),
};

/** Ohne Stats-Zeile: Header + freier Inhalt. */
export const WithoutStats: Story = {
  args: { title: "Agenten" },
  render: (args) => (
    <DashboardLayout {...args} actions={<Button>Agent anlegen</Button>}>
      <Grid cols={3}>
        <CardInteractive />
        <CardInteractive />
        <CardInteractive />
      </Grid>
    </DashboardLayout>
  ),
};
