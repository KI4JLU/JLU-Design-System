import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Initials avatar. Formalizes the hand-rolled
 * `rounded-full bg-primary-container flex items-center justify-center`
 * circles (sidebar user, top app bar, conversation lists). The initials are
 * decorative on their own — give the avatar an accessible name via
 * `aria-label` when it is not accompanied by the user's name as text — the
 * avatar then renders as `role="img"` (a plain span may not carry a label).
 * Include the status in the label when using `online` (e.g. "Jane Doe,
 * online"); without a label, `online` renders an sr-only "online" instead.
 */
const avatarSizes = {
  sm: "h-8 w-8 text-xs",
  default: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

const dotSizes = {
  sm: "h-2 w-2",
  default: "h-2.5 w-2.5",
  lg: "h-3 w-3",
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 1–2 characters, e.g. "SK". Longer strings are not truncated — keep them short. */
  initials: string;
  size?: keyof typeof avatarSizes;
  /** Shows a success-colored presence dot (with sr-only "online"). */
  online?: boolean;
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, initials, size = "default", online = false, ...props }, ref) => (
    <span
      ref={ref}
      role={props["aria-label"] || props["aria-labelledby"] ? "img" : undefined}
      className={cn("relative inline-flex shrink-0", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-full bg-primary-container font-semibold uppercase text-on-primary-container select-none",
          avatarSizes[size],
        )}
      >
        {initials}
      </span>
      {online && (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-0 bottom-0 block rounded-full bg-success ring-2 ring-surface",
              dotSizes[size],
            )}
          />
          <span className="sr-only">online</span>
        </>
      )}
    </span>
  ),
);
Avatar.displayName = "Avatar";

export { Avatar };
