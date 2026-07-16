import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge must be taught our custom token scales: without this it
 * cannot tell `text-body-base` (font size) apart from `text-on-primary`
 * (color), lumps them into one conflict group, and silently drops the color
 * class — e.g. a nav button losing its active `text-on-primary`, leaving
 * currentColor SVG icons un-inverted. Same ambiguity for `shadow-card` vs
 * shadow colors. Keep these lists in sync with the scales in tokens.css.
 */
/** Named spacing tokens (tokens.css `--spacing-*`) used by gap/padding/margin
 * utilities — without these, tailwind-merge can't resolve e.g.
 * cn("gap-stack-md", "gap-gutter") and keeps both classes. */
const spacingTokens = ["gutter", "stack-sm", "stack-md", "stack-lg", "margin-page"]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-lg",
            "headline-md",
            "headline-md-mobile",
            "label-sm",
            "stat-lg",
            "body-base",
          ],
        },
      ],
      shadow: [{ shadow: ["card", "card-hover", "overlay"] }],
      rounded: [{ rounded: ["action", "field"] }],
      gap: [{ gap: spacingTokens }],
      "gap-x": [{ "gap-x": spacingTokens }],
      "gap-y": [{ "gap-y": spacingTokens }],
      p: [{ p: spacingTokens }],
      px: [{ px: spacingTokens }],
      py: [{ py: spacingTokens }],
      pt: [{ pt: spacingTokens }],
      pr: [{ pr: spacingTokens }],
      pb: [{ pb: spacingTokens }],
      pl: [{ pl: spacingTokens }],
      m: [{ m: spacingTokens }],
      mx: [{ mx: spacingTokens }],
      my: [{ my: spacingTokens }],
      mt: [{ mt: spacingTokens }],
      mr: [{ mr: spacingTokens }],
      mb: [{ mb: spacingTokens }],
      ml: [{ ml: spacingTokens }],
    },
  },
})

/**
 * Merge Tailwind class names conditionally, resolving conflicts so the last
 * utility wins (e.g. cn("p-2", condition && "p-4") -> "p-4"). This is the
 * standard shadcn/ui helper and the required way to compose classes on the
 * shared UI components introduced from Phase 2 onwards.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
