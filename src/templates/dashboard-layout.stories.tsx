import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  ArrowUpDown,
  Bot,
  Code,
  Link2,
  ListFilter,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "./dashboard-layout";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { FilterMenu } from "../components/filter-menu";
import { Grid } from "../components/grid";
import { Input } from "../components/input";
import { ListToolbar } from "../components/list-toolbar";
import { templateChromaticModes } from "./chromatic-modes";

const meta = {
  title: "Templates/DashboardLayout",
  component: DashboardLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen", chromatic: { modes: templateChromaticModes } },
} satisfies Meta<typeof DashboardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const FILTER_OPTIONS = [
  { value: "all", label: "Alle" },
  { value: "active", label: "Aktiv" },
  { value: "paused", label: "Pause" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "conversations", label: "Gespräche" },
  { value: "rating", label: "Bewertung" },
];

const ACCENT_CLASSES = {
  primary: { iconBg: "bg-primary/10", iconText: "text-primary" },
  secondary: { iconBg: "bg-secondary/10", iconText: "text-secondary" },
} as const;

const FOOTER_ACTIONS = [
  { icon: Settings, label: "Einstellungen" },
  { icon: Code, label: "Einbetten" },
];

// Spiegelt Felder und Aktionen der Konnektor-Karten aus CampusAgents 1:1 —
// keine reduzierte Platzhalter-Karte, damit das Template realistisch bleibt.
const ITEMS = [
  {
    icon: Bot,
    accent: "primary",
    status: { tone: "primary", label: "Aktiv" },
    name: "Sales Tracker",
    linkedTo: "Team Alpha",
    routing: "public",
    conversations: 128,
    rating: "4,8 / 5",
  },
  {
    icon: MessageCircle,
    accent: "secondary",
    status: { tone: "neutral", label: "Pause" },
    name: "Support Bot",
    linkedTo: "Team Beta",
    routing: "internal",
    conversations: 64,
    rating: "4,2 / 5",
  },
  {
    icon: Sparkles,
    accent: "primary",
    status: { tone: "primary", label: "Aktiv" },
    name: "Onboarding Guide",
    linkedTo: "Team Gamma",
    routing: "public",
    conversations: 212,
    rating: "4,9 / 5",
  },
] as const;

const StandardExample = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("name");
  return (
    <DashboardLayout
      title="Konnektoren"
      description={
        <>
          Konnektoren sind die <b className="text-on-surface">Front eines Agenten</b>: Chat, Formular oder
          API-Endpunkt.
        </>
      }
      actions={<span className="text-body-base text-on-surface-variant">{ITEMS.length} Konnektoren</span>}
      toolbar={
        <ListToolbar
          search={
            <Input
              leadingIcon={<Search aria-hidden />}
              placeholder="Konnektoren durchsuchen…"
              aria-label="Konnektoren durchsuchen"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          }
          filters={
            <>
              <FilterMenu
                icon={ListFilter}
                label="Filter"
                options={FILTER_OPTIONS}
                value={statusFilter}
                defaultValue="all"
                onChange={setStatusFilter}
              />
              <FilterMenu
                icon={ArrowUpDown}
                label="Sortieren"
                options={SORT_OPTIONS}
                value={sortOption}
                defaultValue="name"
                onChange={setSortOption}
              />
            </>
          }
        />
      }
    >
      <Grid cols={4}>
        {ITEMS.map((item) => {
          const accent = ACCENT_CLASSES[item.accent];
          return (
            <Card
              key={item.name}
              interactive
              className="@container flex flex-col p-4"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.iconBg}`}>
                  <item.icon className={accent.iconText} width="1em" height="1em" aria-hidden />
                </div>
                <Badge dot tone={item.status.tone}>
                  {item.status.label}
                </Badge>
              </div>

              <div className="mb-3">
                <h4 className="font-headline-md text-base font-bold">{item.name}</h4>
                <div className="mt-1 flex items-center gap-2 text-on-surface-variant">
                  <Link2 className="text-sm" width="1em" height="1em" aria-hidden />
                  <span className="font-label-sm text-xs truncate">{item.linkedTo}</span>
                </div>
              </div>

              <div className="my-3 border-t border-outline-variant/30" />

              {/* Schmale Karte (4er-Raster): Kennzahlen untereinander, sonst
                  dreispaltig mit Trennlinien — Container-Query, weil die
                  Kartenbreite an der Spaltenzahl hängt, nicht am Viewport. */}
              <div className="mb-4 grid grid-cols-1 gap-2 @[16rem]:grid-cols-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs text-on-surface-variant">Routing</span>
                  <span className="truncate text-sm font-semibold">{item.routing}</span>
                </div>
                <div className="flex min-w-0 flex-col @[16rem]:border-l @[16rem]:border-outline-variant/30 @[16rem]:pl-2">
                  <span className="truncate text-xs text-on-surface-variant">Gespräche</span>
                  <span className="truncate text-sm font-semibold">{item.conversations}</span>
                </div>
                <div className="flex min-w-0 flex-col @[16rem]:border-l @[16rem]:border-outline-variant/30 @[16rem]:pl-2">
                  <span className="truncate text-xs text-on-surface-variant">Bewertung</span>
                  <span className="truncate text-sm font-semibold">{item.rating}</span>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-1 gap-2 @[14rem]:grid-cols-2">
                {FOOTER_ACTIONS.map((action) => (
                  <Button key={action.label} variant="outline" size="sm" className="w-full min-w-0">
                    <action.icon className="text-sm" width="1em" height="1em" aria-hidden />
                    <span className="truncate">{action.label}</span>
                  </Button>
                ))}
              </div>
            </Card>
          );
        })}

        <div className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low/50 p-4 text-on-surface-variant transition-all hover:border-primary hover:text-primary">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-current transition-transform group-hover:scale-110">
            <Plus className="text-[28px]" width="1em" height="1em" aria-hidden />
          </div>
          <span className="text-center font-headline-md text-base font-bold">Element hinzufügen</span>
          <p className="mt-1 text-center text-xs opacity-70">Neues Element anlegen</p>
        </div>
      </Grid>
    </DashboardLayout>
  );
};

/**
 * Toolbar (Suche + Filter/Sortieren) zuerst, dann Titel mit gedämpfter
 * Anzahl in derselben Zeile, Erklärtext darunter — das Konnektoren-/
 * Agenten-Dashboard-Muster. Karten-Grid max. 4 pro Reihe (`Grid cols={4}`).
 */
export const Standard: Story = {
  args: { title: "Konnektoren" },
  render: () => <StandardExample />,
};
