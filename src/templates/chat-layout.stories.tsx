import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { SendHorizontal } from "lucide-react";
import { ChatLayout } from "./chat-layout";
import { Avatar } from "../components/avatar";
import { Button } from "../components/button";
import { Textarea } from "../components/textarea";
import { templateChromaticModes } from "./chromatic-modes";
import * as chatBubbleStories from "../components/chat-bubble.stories";

// Portable Stories: der Gesprächsverlauf kommt 1:1 aus den ChatBubble-Stories.
const { Conversation } = composeStories(chatBubbleStories, {});

const meta = {
  title: "Templates/ChatLayout",
  component: ChatLayout,
  tags: ["!autodocs"],
  parameters: { chromatic: { modes: templateChromaticModes } },
} satisfies Meta<typeof ChatLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Das Widget füllt seinen Eltern-Container — hier ein h-96-Rahmen wie im Einbettungskontext. */
export const Widget: Story = {
  render: () => (
    <div className="h-96 max-w-md">
      <ChatLayout
        header={
          <>
            <Avatar initials="AS" online aria-label="Assistent, online" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-on-surface">Assistent</span>
              <span className="text-xs text-on-surface-variant">Online</span>
            </div>
          </>
        }
        composer={
          <div className="flex items-end gap-stack-sm">
            <Textarea
              variant="inline"
              rows={1}
              placeholder="Nachricht schreiben…"
              aria-label="Nachricht"
              className="flex-1"
            />
            <Button size="icon" aria-label="Senden">
              <SendHorizontal width="1em" height="1em" aria-hidden />
            </Button>
          </div>
        }
      >
        <Conversation />
      </ChatLayout>
    </div>
  ),
};

/** Ohne Header — eingebettet in einen Kontext, der die Identität schon zeigt. */
export const Headless: Story = {
  render: () => (
    <div className="h-96 max-w-md">
      <ChatLayout
        composer={
          <div className="flex items-end gap-stack-sm">
            <Textarea
              variant="inline"
              rows={1}
              placeholder="Nachricht schreiben…"
              aria-label="Nachricht"
              className="flex-1"
            />
            <Button size="icon" aria-label="Senden">
              <SendHorizontal width="1em" height="1em" aria-hidden />
            </Button>
          </div>
        }
      >
        <Conversation />
      </ChatLayout>
    </div>
  ),
};
