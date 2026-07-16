import type { Meta, StoryObj } from "@storybook/react-vite";
import { Brain, ChartColumn, ChevronDown, Waypoints } from "lucide-react";
import { NavItem } from "./nav-item";

const meta = {
  title: "Components/NavItem",
  component: NavItem,
  argTypes: {
    level: { control: "select", options: ["top", "sub"] },
    active: { control: "boolean" },
    asChild: { control: false },
  },
} satisfies Meta<typeof NavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: (
      <>
        <Brain width="1em" height="1em" aria-hidden />
        <span>Agenten</span>
      </>
    ),
    active: false,
  },
};

/** Die komplette Sidebar-Navigation, 1:1 wie in den Apps. */
export const SidebarExample: Story = {
  render: () => (
    <nav className="flex w-64 flex-col gap-2 rounded-xl bg-surface-container-low border border-outline-variant p-4">
      <NavItem active>
        <Brain width="1em" height="1em" aria-hidden />
        <span>Agenten</span>
        <ChevronDown width="1em" height="1em" aria-hidden className="ml-auto" />
      </NavItem>
      <div className="ml-4 flex flex-col gap-1 border-l border-outline-variant pl-3">
        <NavItem level="sub" active>
          <Brain width="1em" height="1em" aria-hidden />
          <span className="truncate">Campus-Bot</span>
        </NavItem>
        <NavItem level="sub">
          <Brain width="1em" height="1em" aria-hidden />
          <span className="truncate">Prüfungsamt-Bot</span>
        </NavItem>
      </div>
      <NavItem>
        <Waypoints width="1em" height="1em" aria-hidden />
        <span>Konnektoren</span>
        <ChevronDown width="1em" height="1em" aria-hidden className="ml-auto" />
      </NavItem>
      <NavItem>
        <ChartColumn width="1em" height="1em" aria-hidden />
        <span>Statistiken</span>
      </NavItem>
    </nav>
  ),
};

/** Mit asChild rendert NavItem einen Router-Link statt eines Buttons. */
export const AsLink: Story = {
  render: () => (
    <NavItem asChild active className="w-64">
      <a href="#statistiken">
        <ChartColumn width="1em" height="1em" aria-hidden />
        <span>Statistiken</span>
      </a>
    </NavItem>
  ),
};
