import * as React from "react";

/**
 * The two pieces of shared state one `Sidebar` publishes to its own subtree.
 * In their own module so `sidebar.tsx` keeps exporting only the component
 * (react-refresh's "only export components" rule — same reason the
 * `*-variants.ts` files exist).
 */

/**
 * Where a `Sidebar` instance is being rendered.
 *
 * @deprecated Since 0.30.0 **nothing produces the `"drawer"` value any more.**
 * `AppShell` no longer renders a mobile drawer — below `lg` it shows one area
 * at a time plus a `BottomTabBar` — so it no longer renders any node twice and
 * has nothing to tell apart. Every `Sidebar` is therefore `"standalone"`. The
 * context object stays (internal, never exported) so `Sidebar`'s own reader
 * keeps compiling and a standalone `Sidebar` behaves exactly as before; it is
 * a candidate for deletion once `Sidebar` itself is revisited. The reasoning
 * below describes the removed drawer and is kept as the record of why the
 * mechanism existed.
 *
 * `AppShell` rendered the **same** sidebar node twice — once as the sticky
 * desktop column, once inside the mobile drawer — so a Sidebar could not tell the
 * two apart from its props. This context was how `AppShell` told it: the
 * drawer copy was wrapped in a provider with `"drawer"`.
 *
 * Why it matters: a "minimise the navigation column" control is meaningless
 * inside a modal drawer that is already full-height and dismissed with Escape,
 * and a drawer that opened *collapsed* would show icon-only rows with no
 * control to widen them. So the drawer copy renders expanded and without the
 * toggle, whatever `collapsed` says. That decision is made in JavaScript, not
 * with a `lg:` utility, because it is not a question about the viewport: it is
 * a question about *which of the two mounts* this is — and only `AppShell`
 * knows the answer. It also keeps `Sidebar` consistent with its own doc
 * comment and with `SidePanel`'s, both of which put viewport behaviour in the
 * composing shell rather than in the component.
 */
export type SidebarSurface = "standalone" | "drawer";

export const SidebarSurfaceContext = React.createContext<SidebarSurface>("standalone");

/**
 * Whether the surrounding `Sidebar` is currently rendering its collapsed,
 * icon-width form. Already resolved against the surface above — inside the
 * drawer this is always `false`.
 *
 * Consumed by `NavItem` and `SidebarUserMenu`, and exported for consumers who
 * hang their own node into the `header`/`footer` slots and need to shrink it
 * the same way. Defaults to `false`, so every component reading it behaves
 * exactly as before when used outside a `Sidebar`.
 */
export const SidebarCollapsedContext = React.createContext(false);

export function useSidebarCollapsed(): boolean {
  return React.useContext(SidebarCollapsedContext);
}
