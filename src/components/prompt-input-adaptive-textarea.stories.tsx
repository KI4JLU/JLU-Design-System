import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ArrowUp, FileText, WandSparkles } from "lucide-react";
import { PromptInputAdaptiveTextarea } from "./prompt-input-adaptive-textarea";
import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  PromptInputButton,
  PromptInputSubmit,
} from "./prompt-input";
import { InputGroupAddon } from "./input-group";
import type { PromptInputShape } from "./prompt-input-variants";

const meta = {
  title: "Components/PromptInputAdaptiveTextarea",
  component: PromptInputAdaptiveTextarea,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PromptInputAdaptiveTextarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The chat composer as JustRAG mounts it: plus menu bottom-left, tools and
 * send bottom-right, both overlaid on the frame; the textarea keeps one line
 * between them and moves above them once it wraps.
 */
function Composer({ shape, voice }: { shape: PromptInputShape; voice?: boolean }) {
  const [value, setValue] = useState("");
  const [recording, setRecording] = useState(false);
  return (
    <div className="mx-auto max-w-3xl">
      <PromptInput id="composer" shape={shape} onSubmit={() => setValue("")}>
        <InputGroupAddon align="inline-start" className="absolute bottom-1 left-3 p-0">
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger className="size-10" aria-label="Anhängen" />
            <PromptInputActionMenuContent align="start">
              <PromptInputActionMenuItem>Fotos oder Dateien hinzufügen</PromptInputActionMenuItem>
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        </InputGroupAddon>
        <PromptInputAdaptiveTextarea
          aria-label="Nachricht"
          className="px-4 text-base leading-normal"
          placeholder="Stelle eine Frage…"
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inlineLeft={72}
          inlineRight={172}
          laneHeight={48}
          maxHeight={240}
        />
        <InputGroupAddon align="inline-end" className="absolute right-3 bottom-1 gap-1 p-0">
          <PromptInputButton aria-label="Entwurf verbessern">
            <WandSparkles aria-hidden="true" />
          </PromptInputButton>
          <span className="inline-flex items-center gap-1 whitespace-nowrap px-2 text-sm text-on-surface-variant">
            <FileText size={16} aria-hidden="true" />
            <span>33</span>
          </span>
          <PromptInputSubmit
            className="size-10"
            aria-label="Senden"
            disabled={!value.trim()}
            idle={!value.trim()}
            voice={voice ? { label: "Spracheingabe", active: recording, onActivate: () => setRecording((r) => !r) } : undefined}
          >
            <ArrowUp aria-hidden="true" />
          </PromptInputSubmit>
        </InputGroupAddon>
      </PromptInput>
      <p className="mt-4 text-sm text-on-surface-variant">{value.length} Zeichen</p>
    </div>
  );
}

export const ChatComposer: Story = {
  args: { value: "", onValueChange: undefined } as never,
  render: () => <Composer shape="rounded" />,
};

/** `shape="pill"`: capsule frame, circular controls; falls back to the frame
 *  radius once the text wraps or files are attached. */
export const PillComposer: Story = {
  args: { value: "", onValueChange: undefined } as never,
  render: () => <Composer shape="pill" />,
};

/** With a speech-to-text provider wired: the idle send button becomes the
 *  voice trigger and turns back into the arrow as soon as there is a draft. */
export const VoiceIdle: Story = {
  args: { value: "", onValueChange: undefined } as never,
  render: () => <Composer shape="pill" voice />,
};
