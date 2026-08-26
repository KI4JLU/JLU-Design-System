import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Star,
  User,
  Users,
} from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import {
  SectionedGridLayout,
  type SectionedGridSection,
} from "./sectioned-grid-layout";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/card";
import { DropdownMenuItem } from "../components/dropdown-menu";
import { Logo } from "../components/logo";
import { NavItem } from "../components/nav-item";
import { SidebarUserMenu } from "../components/sidebar-user-menu";
import { templateChromaticModes } from "./chromatic-modes";
import * as menuItemStories from "../components/menu-item.stories";

// Portable Story: der freiformige Sektions-Body (`body`) ist eine bestehende
// Komponenten-Story — die MenuItem-Liste steht hier für ein ganzes Panel im
// Sektionskörper (Katalog/Entdecken), das kein Karten-Grid ist.
const { SelectMenu: PanelBody } = composeStories(menuItemStories, {});

// Die Grid-Zellen sind hier lokal gebaut und bewusst app-neutral: keine
// bestehende Card-Story hat die Form einer Rasterzelle (Card.Basic bringt ein
// `max-w-sm` und einen Statistik-Körper mit, Card.Interactive rendert sein
// eigenes zweispaltiges Grid). Die Dichte einer echten Zelle bleibt erhalten:
// Titel, Meta-Zeile, ein Status-Badge, eine Aktion.
const CELLS = [
  { name: "Sammlung A", meta: "Zuletzt aktiv vor 2 Std.", tone: "primary", state: "Geteilt" },
  { name: "Sammlung B", meta: "Zuletzt aktiv vor 3 Tagen", tone: "neutral", state: "Privat" },
  { name: "Sammlung C", meta: "Zuletzt aktiv vor 1 Woche", tone: "neutral", state: "Privat" },
  { name: "Sammlung D", meta: "Zuletzt aktiv vor 2 Wochen", tone: "primary", state: "Geteilt" },
] as const;

function DemoCells({ count = CELLS.length }: { count?: number }) {
  return (
    <>
      {CELLS.slice(0, count).map((cell) => (
        <Card key={cell.name} interactive className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-stack-sm">
              <CardTitle className="text-body-base">{cell.name}</CardTitle>
              <Badge tone={cell.tone}>{cell.state}</Badge>
            </div>
            <CardDescription>{cell.meta}</CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Button variant="outline" size="sm">
              Öffnen
            </Button>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}

/** „Neu anlegen"-Zelle: erste Zelle desselben Grids, nicht eine eigene Zeile. */
function CreateCell({ label }: { label: string }) {
  return (
    <Button
      variant="outline"
      className="h-full min-h-40 w-full flex-col gap-stack-sm border-dashed"
      aria-label={label}
    >
      <Plus width="1.5em" height="1.5em" aria-hidden />
      <span>{label}</span>
    </Button>
  );
}

const meta = {
  title: "Templates/SectionedGridLayout",
  component: SectionedGridLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen", chromatic: { modes: templateChromaticModes } },
  // Basis-Args nur für die Props-Tabelle: jede Story rendert über `render` mit
  // eigenem Zustand, weil der Auf-/Zu-Zustand beim Konsumenten liegt und in
  // Storybook nur als lokaler State existieren kann.
  args: {
    label: "Sammlungen",
    title: "Sammlungen",
    sections: [],
    cols: 3,
  },
  argTypes: {
    sections: { control: false },
    title: { control: false },
    description: { control: false },
    actions: { control: false },
  },
} satisfies Meta<typeof SectionedGridLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Vier Sektionen, wie sie eine Übersichtsseite hat — und alle drei
 * Body-Formen: Karten-Grid mit Create-Zelle, freiformiges Panel, Leerzustand.
 * Der Zustand liegt (wie in einer App) außerhalb des Templates; hier ist es
 * lokaler Story-State statt eines Contexts.
 */
const Interactive = ({ title }: { title?: ReactNode }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({
    favorites: true,
    discover: false,
    shared: false,
    mine: true,
  });
  const toggle = (id: string) => (isOpen: boolean) =>
    setOpen((prev) => ({ ...prev, [id]: isOpen }));

  const sections: SectionedGridSection[] = [
    {
      id: "favorites",
      title: "Favoriten",
      icon: <Star className="text-primary" width="1em" height="1em" aria-hidden />,
      count: 2,
      isOpen: open.favorites,
      onOpenChange: toggle("favorites"),
      items: <DemoCells count={2} />,
    },
    {
      id: "discover",
      title: "Entdecken",
      icon: <Search className="text-on-surface-variant" width="1em" height="1em" aria-hidden />,
      isOpen: open.discover,
      onOpenChange: toggle("discover"),
      body: <PanelBody />,
    },
    {
      id: "shared",
      title: "Mit mir geteilt",
      icon: <Users className="text-on-surface-variant" width="1em" height="1em" aria-hidden />,
      count: 0,
      isOpen: open.shared,
      onOpenChange: toggle("shared"),
      emptyState: "Noch nichts geteilt.",
    },
    {
      id: "mine",
      title: "Meine Sammlungen",
      icon: <BookOpen className="text-on-surface-variant" width="1em" height="1em" aria-hidden />,
      count: 4,
      isOpen: open.mine,
      onOpenChange: toggle("mine"),
      headerAction: (
        <Button variant="outline" size="sm">
          <Plus width="1em" height="1em" aria-hidden />
          <span>Neu</span>
        </Button>
      ),
      createCell: <CreateCell label="Neue Sammlung" />,
      items: <DemoCells />,
    },
  ];

  return (
    <SectionedGridLayout
      label="Sammlungen"
      title={title}
      description="Erklärzeile unter dem Titel — was auf dieser Seite gruppiert ist."
      actions={
        <span className="text-body-base text-on-surface-variant">6 Sammlungen</span>
      }
      sections={sections}
    />
  );
};

/**
 * Standard: Titelzeile, dann Sektionen. Zwei sind offen, zwei zu — der
 * Zustand kommt von außen, das Template ändert ihn nie selbst.
 */
export const Standard: Story = {
  render: () => <Interactive title="Sammlungen" />,
};

const AllClosed = () => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const sections: SectionedGridSection[] = ["Favoriten", "Entdecken", "Mit mir geteilt"].map(
    (name, index) => ({
      id: `s${index}`,
      title: name,
      count: index * 2,
      isOpen: open[`s${index}`] ?? false,
      onOpenChange: (isOpen: boolean) =>
        setOpen((prev) => ({ ...prev, [`s${index}`]: isOpen })),
      items: <DemoCells count={2} />,
    }),
  );
  return <SectionedGridLayout label="Sammlungen" title="Sammlungen" sections={sections} />;
};

/**
 * Alle Sektionen zu: nur die Kopfzeilen bleiben stehen. Der Body ist dabei
 * **ausgehängt**, nicht per CSS versteckt — das Aufklappen montiert ihn neu
 * (und löst damit ein Nachladen aus, wenn der Body eins mitbringt).
 */
export const AllCollapsed: Story = {
  render: () => <AllClosed />,
};

/**
 * Der vorgesehene Einsatz: als `children` des `AppShellLayout`. Marke,
 * Seitenlabel, Theme-Umschalter und Nutzermenü gehören dem Shell — dieses
 * Template bringt nur den Inhalt und **kein** zweites `<main>`.
 */
export const InAppShell: Story = {
  render: () => (
    <AppShellLayout
      logo={<Logo product="RAG" size="sm" />}
      pageLabel="Sammlungen"
      nav={
        <>
          <NavItem active>
            <LayoutDashboard width="1em" height="1em" aria-hidden />
            <span>Übersicht</span>
          </NavItem>
          <NavItem>
            <BookOpen width="1em" height="1em" aria-hidden />
            <span>Sammlungen</span>
          </NavItem>
          <NavItem>
            <Settings width="1em" height="1em" aria-hidden />
            <span>Einstellungen</span>
          </NavItem>
        </>
      }
      sidebarFooter={
        <SidebarUserMenu initials="JL" name="Jane Lehmann" role="Angemeldet">
          <DropdownMenuItem>
            <User width="1em" height="1em" aria-hidden />
            <span>Profil</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LogOut width="1em" height="1em" aria-hidden />
            <span>Abmelden</span>
          </DropdownMenuItem>
        </SidebarUserMenu>
      }
    >
      {/* Der Seitentitel steht schon in der `pageLabel`-Zeile des Shells —
          hier trägt das Template nur die Sektionen. */}
      <Interactive />
    </AppShellLayout>
  ),
};
