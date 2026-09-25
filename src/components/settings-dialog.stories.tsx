import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Settings, User } from "lucide-react";
import { SettingsDialog, SettingsRow } from "./settings-dialog";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta = {
  title: "Components/SettingsDialog",
  component: SettingsDialog,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const [open, setOpen] = useState(true);
  const choice = (items: [string, string][], value: string) => (
    <Select defaultValue={value}>
      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
      <SelectContent>{items.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Einstellungen öffnen</Button>
      <SettingsDialog
        open={open}
        onOpenChange={setOpen}
        sections={[
          {
            value: "general",
            label: "Allgemein",
            icon: <Settings aria-hidden="true" />,
            keywords: ["Darstellung", "Stil", "Sprache"],
            content: (
              <>
                <SettingsRow label="Darstellung" control={choice([["system", "System"], ["light", "Hell"], ["dark", "Dunkel"]], "system")} />
                <SettingsRow label="Stil" description="Abgerundete Ecken oder Pillenform." control={choice([["rounded", "Abgerundet eckig"], ["pill", "Pille"]], "rounded")} />
                <SettingsRow label="Sprache" control={choice([["de", "Deutsch"], ["en", "English"]], "de")} />
              </>
            ),
          },
          {
            value: "profile",
            label: "Profil",
            icon: <User aria-hidden="true" />,
            content: (
              <>
                <SettingsRow label="Benutzername" control={<span className="text-on-surface-variant">@grace</span>} />
                <SettingsRow label="E-Mail" control={<span className="text-on-surface-variant">grace@uni-giessen.de</span>} />
              </>
            ),
          },
        ]}
      />
    </div>
  );
}

export const Default: Story = {
  args: { open: true, onOpenChange: () => {}, sections: [] },
  render: () => <Demo />,
};
