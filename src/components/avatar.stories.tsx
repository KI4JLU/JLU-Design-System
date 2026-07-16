import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { initials: "SK", "aria-label": "Steffen Karcher" },
};

export const Sizes: Story = {
  args: { initials: "SK" },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar initials="SK" size="sm" aria-label="Steffen Karcher" />
      <Avatar initials="SK" aria-label="Steffen Karcher" />
      <Avatar initials="SK" size="lg" aria-label="Steffen Karcher" />
    </div>
  ),
};

/** Präsenz-Punkt (`online`) — mit sr-only „online" für Screenreader. */
export const Online: Story = {
  args: { initials: "SK" },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar initials="KD" size="sm" online aria-label="Kateryna Dzhukh, online" />
      <Avatar initials="KD" online aria-label="Kateryna Dzhukh, online" />
      <Avatar initials="KD" size="lg" online aria-label="Kateryna Dzhukh, online" />
    </div>
  ),
};

/** Typischer Einsatz: Avatar + Name/Meta in einer Zeile (Sidebar, Gesprächsliste). */
export const WithText: Story = {
  args: { initials: "SK" },
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar initials="NB" online />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-on-surface">Niklas Bender</span>
        <span className="text-xs text-on-surface-variant">niklas.bender@hrz.uni-giessen.de</span>
      </div>
    </div>
  ),
};
