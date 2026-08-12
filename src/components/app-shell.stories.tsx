import type { Meta, StoryObj } from "@storybook/react-vite";
import { LayoutDashboard, Settings, Users } from "lucide-react";
import { AppShell } from "./app-shell";
import { Sidebar } from "./sidebar";
import { NavItem } from "./nav-item";
import { Container } from "./container";
import { PageHeader } from "./page-header";
import { Card } from "./card";
import { Logo } from "./logo";

const meta = {
  title: "Layout/AppShell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const brand = <Logo product="App" size="sm" />;

/**
 * Ab lg: feste Sidebar mit rechtem Rand. Darunter: Top-Bar mit Menü-Button,
 * die Sidebar öffnet sich als Drawer (Fokusfalle, Escape schließt).
 * Viewport verkleinern, um den Wechsel zu sehen.
 */
export const Responsive: Story = {
  args: {
    topBar: <div className="flex items-center gap-stack-sm">{brand}</div>,
    sidebar: (
      <Sidebar header={brand}>
        <NavItem active>
          <LayoutDashboard width="1em" height="1em" aria-hidden />
          <span>Übersicht</span>
        </NavItem>
        <NavItem>
          <Users width="1em" height="1em" aria-hidden />
          <span>Team</span>
        </NavItem>
        <NavItem>
          <Settings width="1em" height="1em" aria-hidden />
          <span>Einstellungen</span>
        </NavItem>
      </Sidebar>
    ),
  },
  render: (args) => (
    <AppShell {...args}>
      <Container className="py-gutter md:py-margin-page">
        <PageHeader title="Übersicht" description="Hauptbereich — Inhalt kommt von der Seite." />
        <Card className="mt-gutter p-6">Seiteninhalt</Card>
      </Container>
    </AppShell>
  ),
};
