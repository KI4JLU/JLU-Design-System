import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay } from "./dialog";

/**
 * Responsive application frame. From lg up the `sidebar` node is a sticky
 * full-height column with a right border; below lg it moves into a left
 * drawer (Radix Dialog: focus trap, Escape, scroll lock) opened from a
 * sticky top bar. Pass the SAME node (typically <Sidebar>) — AppShell
 * renders it in both places, only one is visible per breakpoint.
 *
 * The drawer closes automatically when a link inside it is clicked (SPA
 * navigation keeps the page alive); buttons (e.g. section toggles) keep it
 * open. Everything else — routing, page content — stays with the consumer.
 */
export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Navigation column, usually a <Sidebar>. Rendered on desktop and in the mobile drawer. */
  sidebar: React.ReactNode;
  /** Content of the mobile top bar next to the menu button (logo/brand). */
  topBar?: React.ReactNode;
}

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ className, sidebar, topBar, children, ...props }, ref) => {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    return (
      <div
        ref={ref}
        className={cn("flex min-h-dvh bg-surface text-on-surface", className)}
        {...props}
      >
        <div className="sticky top-0 hidden h-dvh shrink-0 border-r border-outline-variant lg:block">
          {sidebar}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center gap-stack-sm border-b border-outline-variant bg-surface px-gutter py-stack-sm lg:hidden">
            <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Navigation öffnen">
                  <Menu className="h-5 w-5" aria-hidden />
                </Button>
              </DialogTrigger>
              <DialogPortal>
                <DialogOverlay />
                <DialogPrimitive.Content
                  aria-describedby={undefined}
                  className="fixed inset-y-0 left-0 z-50 flex shadow-overlay focus:outline-none"
                  onClick={(e) => {
                    // Links navigate → the drawer is done; section-toggle
                    // buttons stay interactive without closing it.
                    if ((e.target as HTMLElement).closest("a")) setDrawerOpen(false);
                  }}
                >
                  <DialogPrimitive.Title className="sr-only">
                    Navigation
                  </DialogPrimitive.Title>
                  {sidebar}
                </DialogPrimitive.Content>
              </DialogPortal>
            </Dialog>
            {topBar && (
              <div className="flex min-w-0 flex-1 items-center gap-stack-sm">{topBar}</div>
            )}
          </header>
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
    );
  },
);
AppShell.displayName = "AppShell";

export { AppShell };
