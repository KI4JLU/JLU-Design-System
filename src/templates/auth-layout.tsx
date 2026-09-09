import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { headingTag, type HeadingLevel } from "../lib/heading-level";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/card";
import { Stack } from "../components/stack";
import { authLayoutVariants } from "./auth-layout-variants";

/**
 * Template „Login/Auth": a single centered card on the page surface —
 * optional logo above, title/description in the card header, the form as
 * `children`, muted links (password reset, registration) in `footer`.
 * Fills the viewport height and keeps token page margins on small screens.
 * The form logic itself stays with the consumer.
 *
 * **Who owns the page heading here.** `title` is required, but by default it
 * lands in `CardTitle`'s `div` and contributes **no** heading to the outline —
 * so the page's `<h1>` is the call site's until it says otherwise. That
 * default is not a preference: one shipping consumer already passes its own
 * `<h1>` element *into* the `title` slot (JustRAG's `Login.tsx`, precisely
 * because the slot was not a heading), and a heading added here by default
 * would nest an `<h1>` inside an `<h1>`. Set `headingLevel` to hand the
 * heading to the template — that call site can then pass plain text and drop
 * its wrapper. The rule and the per-template defaults are in
 * `docs/COMPONENT_GUIDELINES.md` → „Page headings: who owns them".
 *
 * `width` sizes the centered column: `default` (448px) for a login form,
 * `prose` (672px) for long-form page copy such as terms of use or an
 * accessibility statement. It is a prop and not a `className` because the
 * constraint sits on the inner column, which `className` — merging into the
 * root element — cannot reach; see `auth-layout-variants.ts` for why those two
 * steps and no others.
 */
export interface AuthLayoutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof authLayoutVariants> {
  /** Brand block centered above the card. */
  logo?: React.ReactNode;
  /**
   * Card heading (e.g. „Anmelden"). Without `headingLevel` this is **styled
   * text, not a heading** — see the component doc above.
   */
  title: React.ReactNode;
  /**
   * Level of `title` in the document outline, `1`–`6`. **Omitted by default**,
   * and then the title stays inside `CardTitle`'s `div` exactly as before — a
   * consumer passing no new prop sees no change at all.
   *
   * Set it (normally `1` — an auth page owns its viewport, so nothing above it
   * carries an `<h1>`) to let the template render the heading, and pass plain
   * text as `title` rather than your own element.
   */
  headingLevel?: HeadingLevel;
  /** Muted line under the title. */
  description?: React.ReactNode;
  /** Muted centered area below the card (links: „Passwort vergessen?" …). */
  footer?: React.ReactNode;
}

const AuthLayout = React.forwardRef<HTMLDivElement, AuthLayoutProps>(
  (
    {
      className,
      logo,
      title,
      headingLevel,
      description,
      footer,
      width,
      children,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center bg-surface px-gutter py-margin-page",
        className,
      )}
      {...props}
    >
      <Stack gap="lg" className={authLayoutVariants({ width })}>
        {logo && <div className="flex justify-center">{logo}</div>}
        <Card>
          <CardHeader className="text-center">
            <AuthLayoutTitle headingLevel={headingLevel}>{title}</AuthLayoutTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && (
          <div className="text-center text-sm text-on-surface-variant">{footer}</div>
        )}
      </Stack>
    </div>
  ),
);
AuthLayout.displayName = "AuthLayout";

/**
 * The two shapes of the card title, split out so the branch is readable and
 * so the „no `headingLevel`" path is visibly the untouched original: a plain
 * `CardTitle`, no heading, no extra class. With a level it is the same
 * `CardTitle` handed a heading element through `asChild`, so the typography
 * comes from the one place that owns it.
 */
function AuthLayoutTitle({
  headingLevel,
  children,
}: {
  headingLevel?: HeadingLevel;
  children: React.ReactNode;
}) {
  if (headingLevel === undefined) {
    return <CardTitle>{children}</CardTitle>;
  }
  // `createElement` and not `<Heading>`: assigning the tag name to a
  // capitalised variable inside a component body trips
  // `react-hooks/static-components`, whose concern — a component identity that
  // changes every render resets its state — cannot apply to an intrinsic tag
  // name, which has no state. This is the rewrite rather than a suppression.
  return (
    <CardTitle asChild>
      {React.createElement(headingTag(headingLevel), null, children)}
    </CardTitle>
  );
}

export { AuthLayout };
