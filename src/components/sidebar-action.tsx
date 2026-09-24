import * as React from "react";
import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";
import { sidebarRowInsetX } from "./sidebar-card-variants";
import { useUiShape, type UiShape } from "./ui-shape-context";

export interface SidebarActionProps extends ButtonProps {
  /** Leading icon (16px), centred in a 28px slot like the cards' icon tiles. */
  icon: React.ReactNode;
  /** Default: the app-wide Style (`useUiShape`). */
  shape?: UiShape;
}

/**
 * A side panel's primary action row ("Neuer Chat"): a full-width button whose
 * label is left-aligned and whose icon sits on the same vertical axis as the
 * SidebarCards' icon tiles below it — same 1px border, same side inset, same
 * 28px icon slot (sidebarRowInsetX). 44px tall, the height of a pill row.
 * Radius follows the Style.
 */
const SidebarAction = React.forwardRef<HTMLButtonElement, SidebarActionProps>(
  ({ icon, shape: shapeProp, className, children, ...props }, ref) => {
    const uiShape = useUiShape().shape;
    const shape = shapeProp ?? uiShape;
    return (
      <Button
        ref={ref}
        data-slot="sidebar-action"
        className={cn(
          "h-11 w-full justify-start border border-transparent py-0 text-left",
          sidebarRowInsetX[shape],
          "rounded-[var(--ui-radius-control,var(--radius-action))]",
          className,
        )}
        {...props}
      >
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center [&>svg]:size-4">
          {icon}
        </span>
        <span className="min-w-0 truncate">{children}</span>
      </Button>
    );
  },
);
SidebarAction.displayName = "SidebarAction";

export { SidebarAction };
