import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { logoVariants } from "./logo-variants";

/**
 * Platform wordmark: prefix ("JLU") + product name in a primary badge —
 * „JLU [CampusAgents]", „JLU [API]", „JLU [RAG]". Formalizes the brand
 * template as a component: colors come from tokens (`text-on-surface`,
 * `bg-primary`/`text-on-primary`), so the logo switches with the theme
 * instead of carrying hardcoded brand hex values. Renders real text —
 * screen readers read „JLU CampusAgents" naturally, no aria needed.
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
      <span className="rounded-[0.25em] bg-primary px-[0.4em] py-[0.18em] text-on-primary">
        {product}
      </span>
    </span>
  ),
);
Logo.displayName = "Logo";

export { Logo };
