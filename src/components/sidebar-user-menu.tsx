import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./dropdown-menu";
import { useSidebarCollapsed } from "./sidebar-context";

/**
 * User menu for the sidebar footer: initials avatar, name over role, and a
 * trailing chevron — the whole row is the dropdown trigger. Formalizes the
 * block that was hand-rolled in every app's sidebar footer. Name and role
 * truncate, so long values never widen the 256px column.
 *
 * The menu items are the `children` (DropdownMenuItems) — this component owns
 * the trigger and the popup frame, the app owns the actions and their routing.
 *
 * **Collapsed.** In a collapsed `Sidebar` the trigger shrinks to the avatar
 * alone (a round icon-sized button), and the chevron goes — at 80px there is
 * room for the circle and nothing else. The menu is *kept*, not hidden: it is
 * the only route to sign-out, and a control that disappears when the column
 * narrows would make collapsing lossy. Name and role stay in the DOM as
 * `sr-only`, so the trigger's accessible name is the **same string in both
 * states** rather than a second, collapsed-only name that could drift.
 */
export interface SidebarUserMenuProps {
  /** 1–2 characters for the avatar, e.g. "JL". */
  initials: string;
  /** Display name — the emphasized first line. */
  name: React.ReactNode;
  /** Secondary line under the name (role, e-mail, tenant …). */
  role?: React.ReactNode;
  /** Menu entries — `DropdownMenuItem`s (use `asChild` for links). */
  children: React.ReactNode;
}

function SidebarUserMenu({ initials, name, role, children }: SidebarUserMenuProps) {
  const collapsed = useSidebarCollapsed();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn("min-w-0", !collapsed && "w-full justify-start")}
        >
          <Avatar initials={initials} size="sm" />
          <span
            className={cn(
              "flex min-w-0 flex-col items-start",
              // sr-only, not hidden: the accessible name of the trigger is
              // computed from its contents, so removing the text would leave
              // an unnamed button.
              collapsed && "sr-only",
            )}
          >
            <span className="w-full truncate text-left font-semibold">{name}</span>
            {role && (
              <span className="w-full truncate text-left text-xs text-on-surface-variant">
                {role}
              </span>
            )}
          </span>
          {!collapsed && (
            <ChevronDown className="ml-auto shrink-0" width="1em" height="1em" aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { SidebarUserMenu };
