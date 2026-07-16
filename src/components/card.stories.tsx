import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Button } from "./button";

const meta = {
  title: "Components/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Widget-Statistik</CardTitle>
        <CardDescription>Letzte 30 Tage</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-on-surface-variant">1 284 Konversationen, 92 % gelöst.</p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" size="sm">
          Details
        </Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Klickbare Karte im Grid: `interactive` hebt die Karte beim Hover an
 * (Schatten + Translate). Für Tastatur-Nutzer gehört ein fokussierbares
 * Element (Link/Button) in die Karte.
 */
export const Interactive: Story = {
  render: () => (
    <div className="grid max-w-2xl grid-cols-2 gap-4">
      {["Prüfungsamt-Bot", "Bibliotheks-Bot"].map((name) => (
        <Card key={name} interactive>
          <CardHeader>
            <CardTitle className="text-body-base">{name}</CardTitle>
            <CardDescription>Zuletzt aktiv vor 2 Std.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" size="sm">
              Öffnen
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  ),
};

/** Schritt-/Callout-Karte mit linkem Akzentrand (`accent`). */
export const Accent: Story = {
  render: () => (
    <Card accent className="max-w-sm">
      <CardHeader>
        <CardTitle className="text-body-base">Schritt 1: Skript einbinden</CardTitle>
        <CardDescription>
          Fügen Sie das Snippet vor dem schließenden <code>&lt;/body&gt;</code> ein.
        </CardDescription>
      </CardHeader>
    </Card>
  ),
};

/** Card hat kein Default-Padding — ohne Sub-Parts Padding selbst setzen. */
export const PaddedContainer: Story = {
  render: () => (
    <Card className="max-w-sm p-6">
      <p>
        Card ohne Sub-Parts — Padding per <code>className=&quot;p-6&quot;</code>.
      </p>
    </Card>
  ),
};
