import * as React from "react";
import { Container } from "../components/container";
import { PageHeader } from "../components/page-header";
import { Stack } from "../components/stack";
import { cn } from "../lib/utils";

/**
 * Template „Formular": narrow single column — PageHeader, the form sections
 * as `children`, and a separated footer row for the primary/secondary
 * actions (right-aligned from sm up, stacked with the primary action first
 * on mobile). The template renders no <form> element: wrap it in your own
 * <form onSubmit=…> so submit buttons in `actions` work naturally.
 */
export interface FormLayoutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Page title. */
  title: React.ReactNode;
  /** Muted line under the title. */
  description?: React.ReactNode;
  /** Footer actions (submit/cancel Buttons). */
  actions?: React.ReactNode;
}

const FormLayout = React.forwardRef<HTMLDivElement, FormLayoutProps>(
  ({ className, title, description, actions, children, ...props }, ref) => (
    <Container
      ref={ref}
      size="narrow"
      className={cn("flex flex-col gap-stack-lg py-gutter md:py-margin-page", className)}
      {...props}
    >
      <PageHeader title={title} description={description} />
      <Stack gap="lg">{children}</Stack>
      {actions && (
        <div className="flex flex-col-reverse gap-stack-sm border-t border-outline-variant pt-gutter sm:flex-row sm:justify-end">
          {actions}
        </div>
      )}
    </Container>
  ),
);
FormLayout.displayName = "FormLayout";

export { FormLayout };
