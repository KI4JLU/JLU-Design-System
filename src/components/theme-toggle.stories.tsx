import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeToggle } from "./theme-toggle";
import { useTheme } from "../theme/ThemeContext";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { Button } from "./button";

const meta = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveExample = () => {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div className="space-y-4">
      <ThemeToggle />
      <p className="text-sm text-on-surface-variant">
        Auswahl: <strong>{theme}</strong> · aktiv: <strong>{resolvedTheme}</strong>
      </p>
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Vorschau</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button>Primär</Button>
          <Button variant="outline">Rahmen</Button>
        </CardContent>
      </Card>
    </div>
  );
};

/** Hell / System / Dunkel umschalten — die Tokens schalten live mit. */
export const Interactive: Story = {
  render: () => <InteractiveExample />,
};
