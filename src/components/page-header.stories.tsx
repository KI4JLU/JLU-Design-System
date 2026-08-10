import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "./button";
import { Input } from "./input";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    title: "Widgets",
    description: "Alle Chat-Widgets dieser Organisation.",
  },
  render: (args) => (
    <PageHeader
      {...args}
      actions={
        <>
          <Button variant="outline">Importieren</Button>
          <Button>
            <Plus width="1em" height="1em" aria-hidden />
            Widget anlegen
          </Button>
        </>
      }
    />
  ),
};

/** Untergeordnete Zeile (children) für Toolbars/Filter unter dem Titel. */
export const WithToolbarRow: Story = {
  args: { title: "Team" },
  render: (args) => (
    <PageHeader {...args} actions={<Button>Neu</Button>}>
      <Input placeholder="Suchen…" className="max-w-xs" />
    </PageHeader>
  ),
};
