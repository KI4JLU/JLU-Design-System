import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  ArrowUpDown,
  Box,
  Layers,
  Link2,
  ListFilter,
  Plus,
  Search,
  Settings,
  Shapes,
  Share2,
} from "lucide-react";
import { DashboardLayout } from "./dashboard-layout";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { FilterMenu } from "../components/filter-menu";
import { Grid } from "../components/grid";
import { Input } from "../components/input";
import { ListToolbar } from "../components/list-toolbar";

const meta = {
  title: "Templates/DashboardLayout",
  component: DashboardLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DashboardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const FILTER_OPTIONS = [
  { value: "all", label: "Alle" },
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Inaktiv" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "field-2", label: "Feld 2" },
  { value: "field-3", label: "Feld 3" },
];

const ACCENT_CLASSES = {
  primary: { iconBg: "bg-primary/10", iconText: "text-primary" },
  secondary: { iconBg: "bg-secondary/10", iconText: "text-secondary" },
} as const;

const FOOTER_ACTIONS = [
  { icon: Settings, label: "Aktion 1" },
  { icon: Share2, label: "Aktion 2" },
];

// Bewusst anwendungsneutrale Platzhalter: die Karte behält die Feld- und
// Aktionsdichte einer echten Listen-Karte (Icon, Status, Zuordnung, drei
// Kennzahlen, zwei Aktionen), bindet das Template aber an keine konkrete App.
const ITEMS = [
  {
    icon: Box,
    accent: "primary",
    status: { tone: "primary", label: "Aktiv" },
    name: "Element A",
    group: "Gruppe 1",
    field1: "Wert",
    field2: 128,
    field3: "4,8",
  },
  {
    icon: Layers,
    accent: "secondary",
    status: { tone: "neutral", label: "Inaktiv" },
    name: "Element B",
    group: "Gruppe 2",
    field1: "Wert",
    field2: 64,
    field3: "4,2",
  },
  {
    icon: Shapes,
    accent: "primary",
    status: { tone: "primary", label: "Aktiv" },
    name: "Element C",
    group: "Gruppe 3",
    field1: "Wert",
    field2: 212,
    field3: "4,9",
  },
] as const;

const StandardExample = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("name");
  return (
    <DashboardLayout
      title="Elemente"
      description={
        <>
          Erklärzeile unter dem Titel — Platz für einen{" "}
          <b className="text-on-surface">hervorgehobenen Begriff</b> und einen kurzen Zusatz.
        </>
      }
      actions={<span className="text-body-base text-on-surface-variant">{ITEMS.length} Elemente</span>}
      toolbar={
        <ListToolbar
          search={
            <Input
              leadingIcon={<Search aria-hidden />}
              placeholder="Elemente durchsuchen…"
              aria-label="Elemente durchsuchen"
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
                  <span className="font-label-sm text-xs truncate">{item.group}</span>
                </div>
              </div>

              <div className="my-3 border-t border-outline-variant/30" />

              {/* Schmale Karte (4er-Raster): Kennzahlen untereinander, sonst
                  dreispaltig mit Trennlinien — Container-Query, weil die
                  Kartenbreite an der Spaltenzahl hängt, nicht am Viewport. */}
              <div className="mb-4 grid grid-cols-1 gap-2 @[16rem]:grid-cols-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs text-on-surface-variant">Feld 1</span>
                  <span className="truncate text-sm font-semibold">{item.field1}</span>
                </div>
                <div className="flex min-w-0 flex-col @[16rem]:border-l @[16rem]:border-outline-variant/30 @[16rem]:pl-2">
                  <span className="truncate text-xs text-on-surface-variant">Feld 2</span>
                  <span className="truncate text-sm font-semibold">{item.field2}</span>
                </div>
                <div className="flex min-w-0 flex-col @[16rem]:border-l @[16rem]:border-outline-variant/30 @[16rem]:pl-2">
                  <span className="truncate text-xs text-on-surface-variant">Feld 3</span>
                  <span className="truncate text-sm font-semibold">{item.field3}</span>
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
 * Anzahl in derselben Zeile, Erklärtext darunter — das Listen-Dashboard-
 * Muster. Karten-Grid max. 4 pro Reihe (`Grid cols={4}`).
 */
export const Standard: Story = {
  args: { title: "Elemente" },
  render: () => <StandardExample />,
};
