import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { FormLayout } from "./form-layout";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { Stack } from "../components/stack";
import { templateChromaticModes } from "./chromatic-modes";
import * as formStories from "../components/form.stories";
import * as selectStories from "../components/select.stories";

// Portable Stories: Feld-Beispiele aus den bestehenden Component-Stories
// werden als Formularinhalt wiederverwendet, nicht neu gemockt.
const { Field, WithError } = composeStories(formStories, {});
const { InForm: SelectInForm } = composeStories(selectStories, {});

const meta = {
  title: "Templates/FormLayout",
  component: FormLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen", chromatic: { modes: templateChromaticModes } },
} satisfies Meta<typeof FormLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Settings: Story = {
  args: {
    title: "Element-Einstellungen",
    description: "Name, Standard-Modell und Fehlerzustände.",
  },
  render: (args) => (
    <form onSubmit={(e) => e.preventDefault()}>
      <FormLayout
        {...args}
        actions={
          <>
            <Button variant="secondary" type="button">
              Abbrechen
            </Button>
            <Button type="submit">Speichern</Button>
          </>
        }
      >
        <Card className="p-6">
          <Stack gap="md">
            <Field />
            <SelectInForm />
          </Stack>
        </Card>
        <Card className="p-6">
          <WithError />
        </Card>
      </FormLayout>
    </form>
  ),
};
