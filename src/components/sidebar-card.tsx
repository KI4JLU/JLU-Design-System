import * as React from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { sidebarCardVariants, sidebarControlShape, sidebarIconTileVariants } from "./sidebar-card-variants";
import { useUiShape, type UiShape } from "./ui-shape-context";

export interface SidebarCardAction {
  label: string;
  icon?: React.ReactNode;
  onSelect: (e: Event) => void;
  destructive?: boolean;
  /** Draw a separator above this item. */
  separatorBefore?: boolean;
}

export interface SidebarCardProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
  /** Leading glyph (an svg, or an emoji string), shown in the tinted tile. */
  icon?: React.ReactNode;
  /** A short type label instead of a glyph ("PDF", "DOCX"). Wins over `icon`. */
  iconText?: string;
  title: string;
  /** Opens the item: the title button and a click anywhere on the card. */
  onOpen: () => void;
  /** Secondary lines under the title (status, errors, progress). */
  meta?: React.ReactNode;
  /** Inline controls before the checkbox (e.g. retry). */
  extra?: React.ReactNode;
  actions?: SidebarCardAction[];
  /** Accessible name prefix of the actions trigger: `${actionsLabel} ${title}`. */
  actionsLabel?: string;
  active?: boolean;
  /** Show the selection checkbox. */
  selectable?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Accessible name prefix of the checkbox: `${selectLabel} ${title}`. */
  selectLabel?: string;
  /** Batch mode: a click toggles the selection instead of opening; menu and extras hide. */
  selectionMode?: boolean;
  /** Default: the app-wide Style (`useUiShape`). */
  shape?: UiShape;
  titleTestId?: string;
}

/** A click that landed on one of the card's own controls — or on its portaled
 *  menu, whose React events still bubble through the card. */
const isControlClick = (e: React.MouseEvent) =>
  (e.target as HTMLElement).closest(
    'button, a, input, [role="checkbox"], [role="menu"], [role="menuitem"]',
  ) !== null;

/**
 * The row card of a side panel — a chat in a history list, a source in a
 * sources list. Icon tile · title (+ meta) · extra · checkbox · actions menu.
 *
 * The whole card is the pointer target; the title button is the keyboard
 * path, and clicks on the card's own controls are left to them. Forwards ref
 * and props to the `<li>`, so it can be a Radix `asChild` trigger (a hover
 * preview). Render it inside a `<ul>`.
 */
const SidebarCard = React.forwardRef<HTMLLIElement, SidebarCardProps>(
  (
    {
      icon, iconText, title, onOpen, meta, extra, actions, actionsLabel,
      active, selectable, selected = false, onSelectedChange, selectLabel,
      selectionMode, shape: shapeProp, titleTestId, className, onClick, ...rest
    },
    ref,
  ) => {
    const uiShape = useUiShape().shape;
    const shape = shapeProp ?? uiShape;
    const activate = () => (selectionMode && onSelectedChange ? onSelectedChange(!selected) : onOpen());
    const planeClick = (e: React.MouseEvent<HTMLLIElement>) => {
      onClick?.(e);
      if (e.defaultPrevented || isControlClick(e)) return;
      activate();
    };
    const control = sidebarControlShape[shape];

    return (
      // Whole-plane click is a pointer convenience; the title button is the keyboard path.
      <li
        ref={ref}
        data-slot="sidebar-card"
        data-shape={shape}
        className={cn(
          sidebarCardVariants({ shape, state: active || (selectionMode && selected) ? "active" : "idle" }),
          className,
        )}
        onClick={planeClick}
        {...rest}
      >
        <span aria-hidden="true" className={sidebarIconTileVariants({ shape })}>
          {iconText ? (
            <span className="text-[8px] font-bold tracking-wide">{iconText}</span>
          ) : (
            icon
          )}
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            data-testid={titleTestId}
            onClick={activate}
            title={title}
            aria-current={active ? "true" : undefined}
            className="block w-full truncate text-left text-sm font-medium text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {title}
          </button>
          <div data-slot="sidebar-card-meta">{meta}</div>
        </div>
        {!selectionMode && extra}
        {selectable && (
          <Checkbox
            checked={selected}
            onCheckedChange={(c) => onSelectedChange?.(c === true)}
            aria-label={selectLabel ? `${selectLabel} ${title}` : title}
          />
        )}
        {!selectionMode && actions && actions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={control}
                aria-label={actionsLabel ? `${actionsLabel} ${title}` : title}
              >
                <MoreVertical aria-hidden="true" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((a, i) => (
                <React.Fragment key={a.label}>
                  {a.separatorBefore && i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem variant={a.destructive ? "destructive" : undefined} onSelect={a.onSelect}>
                    {a.icon}
                    {a.label}
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </li>
    );
  },
);
SidebarCard.displayName = "SidebarCard";

export interface SidebarSelectionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** e.g. "3 ausgewählt" */
  countLabel: string;
  onCancel: () => void;
  cancelLabel?: string;
  /** Batch actions, right-aligned (icon buttons). */
  children?: React.ReactNode;
  shape?: UiShape;
}

/** The bar a side panel shows while its cards are in selection mode. */
const SidebarSelectionBar = React.forwardRef<HTMLDivElement, SidebarSelectionBarProps>(
  ({ countLabel, onCancel, cancelLabel = "Abbrechen", children, shape: shapeProp, className, ...props }, ref) => {
    const uiShape = useUiShape().shape;
    const shape = shapeProp ?? uiShape;
    return (
      <div
        ref={ref}
        role="toolbar"
        className={cn(
          "flex items-center gap-1 border border-outline-variant bg-surface-container-lowest px-1 py-0.5",
          shape === "pill" ? "rounded-full" : "rounded-xl",
          className,
        )}
        {...props}
      >
        <Button variant="ghost" size="icon" className={sidebarControlShape[shape]} onClick={onCancel} aria-label={cancelLabel} title={cancelLabel}>
          <span aria-hidden="true" className="text-base leading-none">×</span>
        </Button>
        <span className="flex-1 text-sm text-on-surface-variant" aria-live="polite">{countLabel}</span>
        {children}
      </div>
    );
  },
);
SidebarSelectionBar.displayName = "SidebarSelectionBar";

export interface SidebarCardListProps extends React.HTMLAttributes<HTMLUListElement> {
  shape?: UiShape;
}

/** The `<ul>` for SidebarCards: spacing follows the app-wide Style (pills sit closer). */
const SidebarCardList = React.forwardRef<HTMLUListElement, SidebarCardListProps>(
  ({ shape: shapeProp, className, ...props }, ref) => {
    const uiShape = useUiShape().shape;
    const shape = shapeProp ?? uiShape;
    return (
      <ul
        ref={ref}
        data-slot="sidebar-card-list"
        className={cn("m-0 flex list-none flex-col p-0", shape === "pill" ? "gap-2" : "gap-2.5", className)}
        {...props}
      />
    );
  },
);
SidebarCardList.displayName = "SidebarCardList";

export { SidebarCard, SidebarCardList, SidebarSelectionBar };
