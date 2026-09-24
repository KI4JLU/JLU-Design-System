import { cva, type VariantProps } from "class-variance-authority";

/**
 * Shape of the composer (`PromptInput`) — the ONE place the frame radius and
 * the radius of everything inside it are decided.
 *
 * `rounded` — the frame radius every other card and field uses (`rounded-xl`),
 *   controls on `rounded-action`.
 * `pill` — a capsule while the composer is a single line; once the text has
 *   moved above the control bar or an attachment row sits on top, the corners
 *   stay at `rounded-2xl` (24px, half a control row) so they keep following
 *   the circular controls inside instead of dropping to the card radius (a
 *   full pill on a tall box would read as a capsule, not an input). Controls
 *   become circles.
 *
 * Propagation: the frame carries `group/prompt-input` and `data-shape`, and
 * every control inside reads it through `promptInputControlShape`, so a
 * consumer sets `shape` once on `<PromptInput>` and never restyles a button.
 */
export const promptInputFrameVariants = cva(
  "group/prompt-input flex-wrap overflow-hidden bg-surface-container-lowest",
  {
    variants: {
      shape: {
        rounded: "rounded-xl",
        pill: "rounded-full has-[>textarea[data-multiline]]:rounded-2xl has-[>[data-slot=prompt-input-attachments]]:rounded-2xl",
      },
    },
    defaultVariants: {
      shape: "rounded",
    },
  },
);

export type PromptInputShape = NonNullable<
  VariantProps<typeof promptInputFrameVariants>["shape"]
>;

/**
 * Radius of a control inside the composer: `rounded-action` by default, a
 * circle when the enclosing frame is `data-shape="pill"`. Applied by
 * `InputGroupButton` (hence every PromptInputButton / Submit / ActionMenu
 * trigger) and the attachment chip.
 */
export const promptInputControlShape =
  "rounded-action group-data-[shape=pill]/prompt-input:rounded-full";
