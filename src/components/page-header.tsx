import * as React from "react";
import { cn } from "../lib/utils";
import { headingTag, type HeadingLevel } from "../lib/heading-level";

/**
 * Page title row: heading + optional description on the left, optional
 * actions (buttons, menus) on the right. Stacks vertically on mobile and
 * switches to the two-side row from md up. The heading uses the headline
 * type tokens (mobile size below md). Optional `children` render as a
 * full-width row below title/actions — meant for tabs or filter toolbars.
 *
 * The title is always a **real heading element**; `headingLevel` says which
 * level it occupies (default `1`). See `docs/COMPONENT_GUIDELINES.md` →
 * „Page headings: who owns them" for the rule this follows and why the level
 * is the call site's decision rather than this component's.
 *
 * The `m-0` on the heading and the description is not cosmetic and must not be
 * removed: both elements have a non-zero **user-agent** margin (measured in
 * Chromium: `h1` 0.67em, `p` 1em), and a consuming app that reverts element
 * margins in `@layer base` — which any app keeping its own prose styling next
 * to Tailwind Preflight does — otherwise leaks that margin into this
 * component. One consumer measured 16.08 px on the heading and patched it from
 * the outside with `[&>header_h1]:m-0`. The utility sits in Tailwind's
 * `utilities` layer, so it changes nothing where Preflight is intact and it
 * wins against that revert as long as the revert is **layered**. Being layered
 * is the condition, not the `base` name: an unlayered declaration outranks
 * every layered one of equal importance, so a reset outside any `@layer`
 * defeats `m-0`. Long form in `docs/COMPONENT_GUIDELINES.md` → „Margins: a DS
 * component never leans on the consumer's reset".
 */
export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Page title. Rendered as a real heading — `headingLevel` picks which. */
  title: React.ReactNode;
  /** Muted line under the title. */
  description?: React.ReactNode;
  /** Right-aligned action area (Buttons, DropdownMenus, …). */
  actions?: React.ReactNode;
  /**
   * Level of the title in the document outline, `1`–`6`. Default `1`: an
   * `<h1>`, which is what this component has always rendered, so no existing
   * call site moves.
   *
   * Pass `2` (or deeper) when the page around the header already has its own
   * `<h1>` — a template inside an admin frame or a CMS page is the normal
   * case, not an edge case, and two `<h1>`s on one page is a WCAG 1.3.1
   * defect. Only the element changes; the type tokens stay the same, so the
   * heading looks identical at every level.
   */
  headingLevel?: HeadingLevel;
}

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    { className, title, description, actions, headingLevel = 1, children, ...props },
    ref,
  ) => {
    const Heading = headingTag(headingLevel);
    return (
      <header
        ref={ref}
        className={cn("flex flex-col gap-stack-md", className)}
        {...props}
      >
        <div className="flex flex-col gap-stack-sm md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <Heading className="m-0 font-headline-md text-headline-md-mobile text-on-surface md:text-headline-md">
              {title}
            </Heading>
            {description && (
              <p className="m-0 text-body-base text-on-surface-variant">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-stack-sm">{actions}</div>
          )}
        </div>
        {children}
      </header>
    );
  },
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
