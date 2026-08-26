import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { useState } from "react";
import {
  FolderOpen,
  History,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import {
  WorkspaceLayout,
  type WorkspaceMobileTab,
  type WorkspacePane,
} from "./workspace-layout";
import { Logo } from "../components/logo";
import { NavItem } from "../components/nav-item";
import { templateChromaticModes } from "./chromatic-modes";
import * as chatBubbleStories from "../components/chat-bubble.stories";
import * as checkboxStories from "../components/checkbox.stories";
import * as menuItemStories from "../components/menu-item.stories";

// Portable Stories: jeder Bereich ist eine bestehende Komponenten-Story —
// Verlauf = MenuItem-Liste, Hauptbereich = ChatBubble-Gespräch, Quellen =
// Checkbox-Auswahl. Nichts wird für dieses Template neu gemockt.
const { SelectMenu: HistoryList } = composeStories(menuItemStories, {});
const { Conversation } = composeStories(chatBubbleStories, {});
const { Indeterminate: SourceSelection } = composeStories(checkboxStories, {});

const TABS: WorkspaceMobileTab[] = [
  { id: "history", icon: <History />, label: "Verlauf", pane: "left" },
  { id: "chat", icon: <MessageSquare />, label: "Chat", pane: "main" },
  { id: "workspace", icon: <Sparkles />, label: "Workspace", pane: "main" },
  { id: "files", icon: <FolderOpen />, label: "Quellen", pane: "right" },
];

const collapsedPreview = (
  <>
    <MessageSquare className="h-5 w-5 text-on-surface-variant" aria-hidden />
    <Sparkles className="h-5 w-5 text-on-surface-variant" aria-hidden />
  </>
);

const meta = {
  title: "Templates/WorkspaceLayout",
  component: WorkspaceLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen", chromatic: { modes: templateChromaticModes } },
  // Basis-Args nur für die Props-Tabelle: jede Story rendert über `render`
  // mit eigenem Zustand, weil Breite und Einklapp-Zustand beim Konsumenten
  // liegen und in Storybook nur als lokaler State existieren können.
  args: {
    mainLabel: "Arbeitsbereich",
    mobileTabs: TABS,
    activeMobileTab: "chat",
    onMobileTabChange: () => {},
    mobileTabBarLabel: "Bereichswechsel",
    showRight: true,
    children: null,
  },
  argTypes: {
    left: { control: false },
    right: { control: false },
    mobileTabs: { control: false },
    onMobileTabChange: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof WorkspaceLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Der Zustand beider Leisten liegt — wie in einer App — außerhalb des
 * Templates. Hier ist es lokaler Story-State statt eines Contexts.
 */
const Interactive = ({
  showRight = true,
  leftOpenInitially = true,
  rightOpenInitially = true,
  nested = false,
}: {
  showRight?: boolean;
  leftOpenInitially?: boolean;
  rightOpenInitially?: boolean;
  /** Im AppShell bringt die Shell die Höhe mit; allein stehend braucht die Story einen Rahmen. */
  nested?: boolean;
}) => {
  const [leftOpen, setLeftOpen] = useState(leftOpenInitially);
  const [rightOpen, setRightOpen] = useState(rightOpenInitially);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(300);
  const [activeTab, setActiveTab] = useState("chat");

  const left: WorkspacePane = {
    content: (
      <div className="flex flex-col gap-stack-md p-gutter">
        <HistoryList />
      </div>
    ),
    label: "Verlauf",
    isOpen: leftOpen,
    width: leftWidth,
    minWidth: 150,
    maxWidth: 600,
    onOpenChange: setLeftOpen,
    onWidthChange: setLeftWidth,
    expandLabel: "Verlauf ausklappen",
    collapseLabel: "Verlauf einklappen",
    resizeLabel: "Breite des Verlaufs ändern",
    collapsedPreview,
  };

  const right: WorkspacePane = {
    content: (
      <div className="flex flex-col gap-stack-md p-gutter">
        <SourceSelection />
      </div>
    ),
    label: "Quellen",
    isOpen: rightOpen,
    width: rightWidth,
    minWidth: 150,
    maxWidth: 800,
    onOpenChange: setRightOpen,
    onWidthChange: setRightWidth,
    expandLabel: "Quellen ausklappen",
    collapseLabel: "Quellen einklappen",
    resizeLabel: "Breite der Quellen ändern",
  };

  const workspace = (
    <WorkspaceLayout
      left={left}
      right={right}
      showRight={showRight}
      mainLabel="Arbeitsbereich"
      mobileTabs={TABS}
      activeMobileTab={activeTab}
      onMobileTabChange={setActiveTab}
      mobileTabBarLabel="Bereichswechsel"
    >
      <div className="flex flex-col gap-stack-md p-gutter">
        <Conversation />
      </div>
    </WorkspaceLayout>
  );

  return nested ? workspace : <div className="h-dvh">{workspace}</div>;
};

/**
 * Drei Bereiche: `left` | Griff | Hauptbereich | Griff | `right`. Beide
 * Leisten lassen sich einklappen (Schiene) und ziehen (Maus **und**
 * ←/→ auf dem Griff). Unter `lg` zeigt dasselbe Template genau **einen**
 * Bereich plus die `BottomTabBar` — im Chromatic-Modus „light mobile" bzw.
 * indem man das Browser-Fenster schmaler zieht.
 */
export const Workspace: Story = {
  render: () => <Interactive />,
};

/**
 * `showRight={false}`: die Quellen sind aus der **Desktop**-Anordnung
 * genommen, ihr Einklapp-Zustand bleibt unangetastet — kommt die App in einen
 * Zustand, der sie wieder zeigt, ist die Leiste so offen wie zuvor. Auf
 * schmalen Bildschirmen bleibt der Reiter „Quellen" nutzbar.
 */
export const RightPaneHidden: Story = {
  render: () => <Interactive showRight={false} />,
};

/** Beide Leisten zugeklappt: zwei 60px-Schienen, kein Griff, breiter Hauptbereich. */
export const PanesCollapsed: Story = {
  render: () => <Interactive leftOpenInitially={false} rightOpenInitially={false} />,
};

/**
 * Verschachtelt: das Workspace-Template ist der Seiteninhalt des
 * `AppShellLayout` — genau wie `DashboardLayout` & Co. Die Shell bringt die
 * Höhe mit, deshalb steht hier kein eigener Rahmen darum. Der Arbeitsbereich
 * ist ein `region`-Landmark **im** einen `<main>` der Shell, kein zweites
 * `<main>` (in `workspace-layout.test.tsx` genau so geprüft).
 */
export const InAppShell: Story = {
  render: () => (
    <AppShellLayout
      logo={<Logo product="RAG" size="sm" />}
      pageLabel="Wissensbasis"
      nav={
        <>
          <NavItem>
            <LayoutDashboard width="1em" height="1em" aria-hidden />
            <span>Übersicht</span>
          </NavItem>
          <NavItem active>
            <Sparkles width="1em" height="1em" aria-hidden />
            <span>Wissensbasis</span>
          </NavItem>
          <NavItem>
            <Settings width="1em" height="1em" aria-hidden />
            <span>Einstellungen</span>
          </NavItem>
        </>
      }
    >
      <Interactive nested />
    </AppShellLayout>
  ),
};
