import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { Brain } from "lucide-react";
import { AuthLayout } from "./auth-layout";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Stack } from "../components/stack";
import { FormItem, FormLabel, FormControl } from "../components/form";
import { templateChromaticModes } from "./chromatic-modes";
import * as formStories from "../components/form.stories";

// Portable Stories: das Fehlerzustands-Beispiel der Form-Stories dient als
// Inhalt der Fehler-Variante — kein neu gemockter Formular-Content.
const { WithError: FieldWithError } = composeStories(formStories, {});

const meta = {
  title: "Templates/AuthLayout",
  component: AuthLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen", chromatic: { modes: templateChromaticModes } },
} satisfies Meta<typeof AuthLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Login: Story = {
  args: {
    title: "Anmelden",
    description: "CampusAgents-Verwaltung der JLU.",
  },
  render: (args) => (
    <AuthLayout
      {...args}
      logo={
        <div className="flex items-center gap-stack-sm">
          <Brain width="1.5em" height="1.5em" aria-hidden className="text-primary" />
          <span className="font-headline-md text-headline-md-mobile">CampusAgents</span>
        </div>
      }
      footer={
        <a href="#passwort" className="underline underline-offset-4 hover:text-on-surface">
          Passwort vergessen?
        </a>
      }
    >
      <Stack gap="md">
        <FormItem>
          <FormLabel>E-Mail</FormLabel>
          <FormControl>
            <Input type="email" autoComplete="username" />
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel>Passwort</FormLabel>
          <FormControl>
            <Input type="password" autoComplete="current-password" />
          </FormControl>
        </FormItem>
        <Button className="w-full">Anmelden</Button>
      </Stack>
    </AuthLayout>
  ),
};

/** Fehlerzustand — Feld-Story aus den Form-Stories, im Template platziert. */
export const WithFieldError: Story = {
  args: { title: "Anmelden" },
  render: (args) => (
    <AuthLayout {...args}>
      <Stack gap="md">
        <FieldWithError />
        <Button className="w-full">Erneut versuchen</Button>
      </Stack>
    </AuthLayout>
  ),
};
