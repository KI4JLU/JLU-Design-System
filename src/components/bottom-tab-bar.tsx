import * as React from "react";
import { cn } from "../lib/utils";
import {
  bottomTabBarIconVariants,
  bottomTabBarTabVariants,
  bottomTabBarVariants,
} from "./bottom-tab-bar-variants";

/**
 * Fixed bottom pane switcher for narrow viewports: a `<nav>` landmark with N
 * icon+label tabs, the current one marked `aria-current="page"`.
 *
 * Not a `SegmentedControl`: that is an inline `role="group"` of `aria-pressed`
 * toggle buttons for a *value* inside a page (chart range, …). This is app
 * chrome — a navigation landmark switching which pane the viewport shows, which
 * is what `aria-current="page"` means. Different role, different landmark,
 * different placement; merging them would give one component two ARIA
 * contracts.
 *
 * Controlled: `activeId` + `onChange`. Which pane an id maps to, and any
 * derivation of the active tab from other state, stays with the consumer —
 * this component renders what it is told.
 */
export interface BottomTabBarItem {
  /** Stable id reported back through `onChange`. */
  id: string;
  /** Icon node, e.g. a lucide icon; sized by the component. */
  icon: React.ReactNode;
  /** Visible (and accessible) tab label. */
  label: string;
}

export interface BottomTabBarProps
  extends Omit<
    React.HTMLAttributes<HTMLElement>,
    // `aria-label` is withheld so `label` is the one way to name the landmark —
    // otherwise a stray `aria-label` would be a second name for one thing. The
    // render applies `aria-label` after `{...props}`, so the type and the
    // runtime say the same.
    "children" | "onChange" | "aria-label"
  > {
  items: BottomTabBarItem[];
  /** Id of the current tab. An id not in `items` marks no tab as current. */
  activeId: string;
  onChange: (id: string) => void;
  /** Accessible name of the <nav> landmark. */
  label: string;
}

const BottomTabBar = React.forwardRef<HTMLElement, BottomTabBarProps>(
  ({ items, activeId, onChange, label, className, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn(bottomTabBarVariants(), className)}
      {...props}
      /* After the spread: `label` is the one way to name this landmark. */
      aria-label={label}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
            className={bottomTabBarTabVariants({ active })}
          >
            <span className={bottomTabBarIconVariants({ active })} aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  ),
);
BottomTabBar.displayName = "BottomTabBar";

export { BottomTabBar };
