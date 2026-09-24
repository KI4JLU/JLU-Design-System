import * as React from "react";
import { Circle, Square } from "lucide-react";
import { SegmentedControl } from "./segmented-control";
import { useUiShape, type UiShape } from "./ui-shape-context";

export interface UiShapeToggleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Accessible name of the group. Default "Stil". */
  label?: string;
  roundedLabel?: string;
  pillLabel?: string;
}

/**
 * The global Style switch (rounded squares / pills), the sibling of
 * `ThemeToggle`. Reads and writes `useUiShape()`; icon-only segments, named
 * for screen readers.
 */
const UiShapeToggle = React.forwardRef<HTMLDivElement, UiShapeToggleProps>(
  ({ label = "Stil", roundedLabel = "Abgerundet eckig", pillLabel = "Pille", ...props }, ref) => {
    const { shape, setShape } = useUiShape();
    return (
      <SegmentedControl
        ref={ref}
        aria-label={label}
        value={shape}
        onValueChange={(v) => setShape(v as UiShape)}
        options={[
          { value: "rounded", label: roundedLabel, icon: <Square aria-hidden="true" className="size-4" /> },
          { value: "pill", label: pillLabel, icon: <Circle aria-hidden="true" className="size-4" /> },
        ]}
        {...props}
      />
    );
  },
);
UiShapeToggle.displayName = "UiShapeToggle";

export { UiShapeToggle };
