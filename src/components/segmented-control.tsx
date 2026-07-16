import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Single-select segment row (e.g. the Tag/Woche/Monat chart-range switch).
 * Controlled: `value` + `onValueChange`. The active segment is announced via
 * `aria-pressed`; pass an `aria-label` describing the choice on the container.
 * Renders raw <button> elements — this repo defines the primitives, so the
 * raw-elements rule does not apply here.
 */
export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps
  extends React.HTMLAttributes<HTMLDivElement> {
  options: SegmentedControlOption[];
  value: string;
  onValueChange: (value: string) => void;
}

const SegmentedControl = React.forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(({ options, value, onValueChange, className, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    className={cn(
      "inline-flex overflow-hidden rounded-action border border-outline-variant",
      className,
    )}
    {...props}
  >
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={active}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "px-4 py-2 font-label-sm text-label-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
            active
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-high",
          )}
        >
          {option.label}
        </button>
      );
    })}
  </div>
));
SegmentedControl.displayName = "SegmentedControl";

export { SegmentedControl };
