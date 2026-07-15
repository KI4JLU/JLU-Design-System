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
