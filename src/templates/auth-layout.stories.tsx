import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { KeyRound } from "lucide-react";
import { AuthLayout } from "./auth-layout";
import { Logo } from "../components/logo";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Stack } from "../components/stack";
import { FormItem, FormLabel, FormControl } from "../components/form";
import * as formStories from "../components/form.stories";

// Portable Stories: das Fehlerzustands-Beispiel der Form-Stories dient als
// Inhalt der Fehler-Variante — kein neu gemockter Formular-Content.
const { WithError: FieldWithError } = composeStories(formStories, {});

const meta = {
  title: "Templates/AuthLayout",
  component: AuthLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AuthLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const brand = <Logo product="App" size="lg" />;

/**
 * Der Standardfall: Single Sign-on über OIDC/Keycloak — ein einziger
 * primärer Button, der zum Identity Provider weiterleitet. Keine lokalen
 * Felder; der Redirect (`window.location`/Router) gehört in die App.
 */
export const SSO: Story = {
  args: {
    title: "Anmelden",
    description: "Mit Ihrem JLU-Account über Single Sign-on.",
  },
  render: (args) => (
    <AuthLayout
      {...args}
      logo={brand}
      footer={
        <span>
          Probleme bei der Anmeldung?{" "}
          <a href="#hilfe" className="underline underline-offset-4 hover:text-on-surface">
            Hilfe zum JLU-Login
          </a>
        </span>
      }
    >
      <Button className="w-full">
        <KeyRound width="1em" height="1em" aria-hidden />
        Mit JLU-Account anmelden
      </Button>
    </AuthLayout>
  ),
};

/** Fallback-Variante für lokale Konten (ohne SSO) — Felder aus den Form-Primitives. */
export const Login: Story = {
  args: {
    title: "Anmelden",
    description: "Plattform-Verwaltung der JLU.",
  },
  render: (args) => (
    <AuthLayout
      {...args}
      logo={brand}
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
