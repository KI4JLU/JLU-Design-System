import * as React from "react";
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

const CardTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "font-headline-md text-headline-md font-semibold text-on-surface",
        className,
      )}
      {...props}
    />
  ),
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
