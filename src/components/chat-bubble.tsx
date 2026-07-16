import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { chatBubbleVariants } from "./chat-bubble-variants";

/**
 * Conversation bubble with the messenger-style asymmetric corner.
 * `from="user"` aligns right in primary, `from="assistant"` sits left on a
 * container surface. Layout (column flow, gaps, scroll) belongs to the
 * surrounding list; the bubble only sizes itself (`max-w-[75%]`, `ml-auto`
 * for user messages). Who is speaking should also be available to screen
 * readers — keep a visible sender/time line or add an sr-only prefix at the
 * call site.
 */
export interface ChatBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleVariants> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, from, ...props }, ref) => (
    <div ref={ref} className={cn(chatBubbleVariants({ from, className }))} {...props} />
  ),
);
ChatBubble.displayName = "ChatBubble";

export { ChatBubble };
