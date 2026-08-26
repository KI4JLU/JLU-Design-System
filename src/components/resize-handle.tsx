import * as React from "react";
import { cn } from "../lib/utils";
import { resizeHandleVariants } from "./resize-handle-variants";

/**
 * Accessible drag handle for resizing a neighbouring pane (`SidePanel`).
 *
 * **Ownership — decided, do not split:** the handle owns the *interaction*,
 * the consumer owns the *value*. Every pointer move and every key press is
 * clamped here and reported through the single `onValueChange` callback, so
 * the consumer stores one number and nothing else; the transient "is being
 * dragged" flag stays internal (it is interaction state, like `:hover`, not
 * data). `onResizeStart` / `onResizeEnd` are *notifications* — use them to
 * suspend an expensive re-layout while dragging, never to run a second drag
 * loop. A consumer-side pointermove listener plus this one is the failure mode
 * this component exists to remove.
 *
 * **`side` is the side of the pane being resized**, and it flips the key
 * direction: a left pane's edge is on its right, so ArrowRight/dragging right
 * makes it wider; a right pane's edge is on its left, so ArrowLeft/dragging
 * right makes it *narrower*. Home/End are side-independent — WAI-ARIA defines
 * them as "minimum"/"maximum" value, not as a direction.
 *
 * `aria-valuenow` is always inside `[min, max]`: both input paths clamp.
 *
 * TODO: role is `slider` with `aria-orientation="vertical"` (the orientation
 * of the *bar*, while the value moves horizontally), carried over from the
 * consumer implementation this generalizes. The WAI-ARIA APG "Window Splitter"
 * pattern uses `role="separator"` with `tabindex` for exactly this widget —
 * whether switching is an improvement or a breaking change for assistive tech
 * is not yet confirmed; decide before this API is depended on widely.
 */
export interface ResizeHandleProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    // Everything the component guarantees is withheld from the spread: without
    // this a consumer could set `aria-valuenow` past `max` and defeat the
    // clamp, or drop `tabIndex` and make the widget unreachable. The render
    // applies these after `{...props}`, so the two agree at compile time and at
    // runtime. `aria-valuetext` stays open on purpose — announcing „320 Pixel"
    // is the consumer's to translate.
    | "onKeyDown"
    | "onPointerDown"
    | "children"
    | "role"
    | "tabIndex"
    | "aria-label"
    | "aria-orientation"
    | "aria-valuemin"
    | "aria-valuemax"
    | "aria-valuenow"
  > {
  /** Which side the pane being resized sits on — flips the arrow-key direction. */
  side: "left" | "right";
  /** Current pane width in px (`aria-valuenow`). Controlled by the consumer. */
  value: number;
  /** Smallest allowed width in px (`aria-valuemin`, Home). */
  min: number;
  /** Largest allowed width in px (`aria-valuemax`, End). */
  max: number;
  /** Arrow-key increment in px. */
  step?: number;
  /** Accessible name, e.g. „Verlaufsleiste breiter oder schmaler ziehen". */
  label: string;
  /** Receives every clamped width — from keys and from the pointer drag. */
  onValueChange: (value: number) => void;
  /** Pointer drag started (e.g. to suspend an expensive re-layout). */
  onResizeStart?: () => void;
  /** Pointer drag ended or was cancelled. */
  onResizeEnd?: () => void;
}

const ResizeHandle = React.forwardRef<HTMLDivElement, ResizeHandleProps>(
  (
    {
      side,
      value,
      min,
      max,
      step = 10,
      label,
      onValueChange,
      onResizeStart,
      onResizeEnd,
      className,
      ...props
    },
    ref,
  ) => {
    const [dragging, setDragging] = React.useState(false);
    // Teardown of the running drag, so an unmount mid-drag cannot leave
    // window listeners behind.
    const endDragRef = React.useRef<(() => void) | null>(null);
    React.useEffect(() => () => endDragRef.current?.(), []);

    const clamp = (n: number) => Math.min(max, Math.max(min, n));
    // +1: moving right grows a left pane. -1: moving right shrinks a right pane.
    const grow = side === "left" ? 1 : -1;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      let next: number;
      switch (event.key) {
        // ArrowUp/ArrowDown are aliases of ArrowRight/ArrowLeft, mirrored per
        // side exactly like them: one widget, one behaviour, whichever axis the
        // user reaches for. They exist because this handle declares
        // `aria-orientation="vertical"` — leaving the declared axis inert means
        // a screen-reader user is told „vertical slider" and then finds that no
        // vertical key does anything.
        case "ArrowRight":
        case "ArrowUp":
          next = value + grow * step;
          break;
        case "ArrowLeft":
        case "ArrowDown":
          next = value - grow * step;
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        default:
          return;
      }
      event.preventDefault();
      const clamped = clamp(next);
      if (clamped !== value) onValueChange(clamped);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      // Keep the drag from turning into a text selection — which also
      // suppresses the default focus, so focus is moved explicitly: after
      // dragging, the arrow keys have to keep working.
      event.preventDefault();
      event.currentTarget.focus();
      const startX = event.clientX;
      const startValue = value;
      // Reported inside the drag closure, not read from props: `value` is a
      // prop of the render that started the drag and goes stale on the first
      // move, which would swallow a move back to the starting width.
      let last = startValue;

      const onMove = (moveEvent: PointerEvent) => {
        const next = clamp(startValue + grow * (moveEvent.clientX - startX));
        if (next === last) return;
        last = next;
        onValueChange(next);
      };
      const onEnd = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
        endDragRef.current = null;
        setDragging(false);
        onResizeEnd?.();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onEnd);
      window.addEventListener("pointercancel", onEnd);
      endDragRef.current = onEnd;
      setDragging(true);
      onResizeStart?.();
    };

    return (
      <div
        ref={ref}
        className={cn(resizeHandleVariants({ dragging }), className)}
        {...props}
        /* After the spread on purpose: the type-level Omit above states these
           are ours, and this makes it true at runtime too (a JS consumer, or a
           cast, cannot smuggle an out-of-range aria-valuenow past the clamp). */
        role="slider"
        aria-orientation="vertical"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clamp(value)}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
      />
    );
  },
);
ResizeHandle.displayName = "ResizeHandle";

export { ResizeHandle };
