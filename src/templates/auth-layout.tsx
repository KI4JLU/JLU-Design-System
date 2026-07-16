import * as React from "react";
import { cn } from "../lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/card";
import { Stack } from "../components/stack";

/**
 * Template „Login/Auth": a single centered card on the page surface —
 * optional logo above, title/description in the card header, the form as
 * `children`, muted links (password reset, registration) in `footer`.
 * Fills the viewport height and keeps token page margins on small screens.
 * The form logic itself stays with the consumer.
 */
export interface AuthLayoutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Brand block centered above the card. */
  logo?: React.ReactNode;
  /** Card heading (e.g. „Anmelden"). */
  title: React.ReactNode;
  /** Muted line under the title. */
  description?: React.ReactNode;
  /** Muted centered area below the card (links: „Passwort vergessen?" …). */
  footer?: React.ReactNode;
}

const AuthLayout = React.forwardRef<HTMLDivElement, AuthLayoutProps>(
  ({ className, logo, title, description, footer, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center bg-surface px-gutter py-margin-page",
        className,
      )}
      {...props}
    >
      <Stack gap="lg" className="w-full max-w-md">
        {logo && <div className="flex justify-center">{logo}</div>}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{title}</CardTitle>
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

export { AuthLayout };
