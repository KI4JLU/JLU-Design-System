import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../lib/utils";

/**
 * Shared card surface. Replaces the repeated
 * `bg-surface-container-lowest border border-outline-variant rounded-xl` blocks.
 *
 * `interactive` — hover highlight for clickable cards in grids: the existing
 * border takes the primary color, so the card stays put (no translate) and
 * nothing around it shifts. Combine with a focusable child (link/button) for
 * keyboard users.
 * `accent` — left primary accent border (step/callout cards).
 * Both compose freely with each other and the sub-parts.
 */
export interface CardProps extends React.ComponentProps<"div"> {
  /** Hover highlight for clickable cards — recolors the border, no movement. */
  interactive?: boolean;
  /** Left primary accent border (steps, callouts). */
  accent?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, accent = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface shadow-card",
        interactive && "transition-colors hover:border-primary",
        accent && "border-l-4 border-l-primary",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

/**
 * A card title is **not** a page heading, which is why this renders a `div`
 * and keeps doing so by default: cards appear in grids, and a grid of `<h2>`s
 * that name nothing in the outline is worse than a grid of styled text (see
 * `docs/COMPONENT_GUIDELINES.md` → „Page headings: who owns them").
 *
 * `asChild` is the way out for the cases where the card genuinely *is* a
 * titled section of the page — the one in this library is `AuthLayout`, whose
 * card holds the whole page's title. It renders the single child element
 * instead of the `div` and hands it the type tokens, so the level is the call
 * site's choice and the look does not change.
 *
 * The `m-0` exists for exactly that path: as a `div` the element has no
 * user-agent margin, but as an `<h1>`–`<h6>` it does, and a consuming app that
 * reverts element margins in `@layer base` would otherwise push the title
 * apart from its description.
 */
export interface CardTitleProps extends React.ComponentProps<"div"> {
  /** Render the single child element instead of a `div` (e.g. an `<h1>`). */
  asChild?: boolean;
}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(
          "m-0 font-headline-md text-headline-md font-semibold text-on-surface",
          className,
        )}
        {...props}
      />
    );
  },
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm text-on-surface-variant", className)}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
