import { cva } from "class-variance-authority";

/**
 * ChatBubble style variants (cva). Kept in its own module (see
 * button-variants.ts) so files can share it without tripping the
 * react-refresh "only export components" rule.
 *
 * The asymmetric corner (`rounded-tr-sm` / `rounded-tl-sm`) points at the
 * sender, mirroring the messenger convention: user bubbles sit right in
 * primary, assistant bubbles sit left on a container surface.
 */
export const chatBubbleVariants = cva(
  "w-fit max-w-[75%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words",
  {
    variants: {
      from: {
        user: "ml-auto rounded-tr-sm bg-primary text-on-primary",
        assistant: "rounded-tl-sm bg-surface-container-high text-on-surface",
      },
    },
    defaultVariants: {
      from: "assistant",
    },
  },
);
