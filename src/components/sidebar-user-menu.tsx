import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./dropdown-menu";

/**
 * User menu for the sidebar footer: initials avatar, name over role, and a
 * trailing chevron — the whole row is the dropdown trigger. Formalizes the
 * block that was hand-rolled in every app's sidebar footer. Name and role
 * truncate, so long values never widen the 256px column.
 *
 * The menu items are the `children` (DropdownMenuItems) — this component owns
 * the trigger and the popup frame, the app owns the actions and their routing.
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full min-w-0 justify-start">
          <Avatar initials={initials} size="sm" />
          <span className="flex min-w-0 flex-col items-start">
            <span className="w-full truncate text-left font-semibold">{name}</span>
            {role && (
              <span className="w-full truncate text-left text-xs text-on-surface-variant">
                {role}
              </span>
            )}
          </span>
          <ChevronDown className="ml-auto shrink-0" width="1em" height="1em" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { SidebarUserMenu };
