import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { logoVariants } from "./logo-variants";

/**
 * Platform wordmark: prefix ("JLU") + product name in a brand badge —
 * „JLU [CampusAgents]", „JLU [API]", „JLU [RAG]". Formalizes the brand
 * template as a component on the dedicated brand tokens: the badge
 * (`bg-brand`/`text-on-brand`) stays brand-constant in both themes, the
 * wordmark (`text-brand-wordmark`) inverts in dark mode for legibility.
 * Renders real text — screen readers read „JLU CampusAgents" naturally,
 * no aria needed.
 */
export interface LogoProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof logoVariants> {
  /** Product/platform name shown in the badge (e.g. "CampusAgents", "API", "RAG"). */
  product: string;
  /** Wordmark before the badge. */
  prefix?: string;
}

const Logo = React.forwardRef<HTMLSpanElement, LogoProps>(
  ({ className, size, product, prefix = "JLU", ...props }, ref) => (
    <span ref={ref} className={cn(logoVariants({ size, className }))} {...props}>
      {prefix}
      <span className="rounded-[0.25em] bg-brand px-[0.4em] py-[0.18em] text-on-brand">
        {product}
      </span>
    </span>
  ),
);
Logo.displayName = "Logo";

export { Logo };
