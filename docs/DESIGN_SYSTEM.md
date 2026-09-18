# Design System — Governance & Foundation

Status: **v0.1.0 — extracted into its own package.** This document is the
contract for how tokens and shared components are added, reviewed, and
versioned. Built as Phases 0–4 inside CampusAgents; extracted here (Phase 5)
so multiple JLU projects consume one design system as a dependency
(`@ki4jlu/design-system`) instead of maintaining copies.

---

## 1. Ownership

| Role | Owner | Responsibility |
|------|-------|----------------|
| Design system owner | **@KI4JLU** (Sten Seegel) | Final say on tokens, component API, and variants. Reviews every PR in this repo. |
| Contributors | Whole frontend team | May propose tokens/components via the process below. |

The review gate is wired via [`.github/CODEOWNERS`](../.github/CODEOWNERS):
every path in this repo auto-requests the owner's review.

---

## 2. Token Architecture (two layers)

Tokens live in [`src/tokens.css`](../src/tokens.css) and are split into two
layers so themes change without touching component code.

### Layer 1 — Primitive tokens (`--p-*`)
Raw values with **no meaning** (e.g. `--p-blue-600`, `--p-gray-100`). Defined in
the plain `:root` block, deliberately **outside** `@theme` so Tailwind does
*not* generate `--p-*` utilities. **Never reference a primitive in a
component.**

### Layer 2 — Semantic tokens (`--color-*`, `--radius-*`, `--spacing-*`, `--shadow-*`, …)
Describe **intent** and reference primitives via `var(--p-*)`. Defined in the
`@theme` block, which is what generates the Tailwind utilities (`bg-primary`,
`text-on-surface`, `bg-success`, `shadow-card`, …). **Application code uses
only these.**

```
Component  ─uses→  Semantic (--color-primary)  ─references→  Primitive (--p-blue-600)
```

### What exists today
- **Brand/surface/text/outline** — Material-3 style semantic set (`primary`,
  `surface`, `surface-container-*`, `on-surface`, `outline`, …).
- **Status/feedback** — `success`, `warning`, `info` (+ `on-*` and
  `*-container` variants).
- **Interaction states** — `primary-hover`, `primary-active`, `focus-ring`,
  `disabled`, `on-disabled`. In dark these lighten *beyond* `primary`, which
  itself flips to a light accent — `bg-primary` therefore always pairs with
  `text-on-primary`, never with a hardcoded white.
- **Elevation** — four steps: `shadow-card`, `shadow-card-hover`,
  `shadow-overlay`, `shadow-modal`. Values live in the `--elevation-*` ramp
  (plain `:root`, not `@theme`) so the dark block can raise their opacity:
  Tailwind inlines `@theme` shadow values rather than referencing them, so a
  `--shadow-*` override would be silently ignored. Adding a step means adding
  it to the `shadow` classGroup in `src/lib/utils.ts` too.
- **Scrim** — `--color-scrim` (black in both themes), used as `bg-scrim/50`
  under modal surfaces. Translucent `bg-black/<n>` is lint-blocked.
- **Chart series** — `chart-1..4` + `chart-track` for SVG charts
  (`fill-chart-1`, `stroke-chart-2`, `bg-chart-3` for legend dots); lighten in
  dark mode so series stay readable on dark surfaces.
- **Typography / spacing / radius** — display/headline/label/stat/body scales,
  `spacing-gutter`/`stack-*`/`margin-page`, `radius-*`.
- **Layout widths** — `--max-width-container-*` (the three `Container` page
  widths) and `--width-sidebar` / `--width-sidebar-collapsed` (the navigation
  column in its two states). Written at the call site as
  `max-w-(--token)` / `w-(--token)`, **not** as `max-w-container-max` /
  `w-sidebar`: tailwind-merge does not recognise a custom theme key as a
  conflict, so the theme-key form would let a call site's own width lose to CSS
  source order. Full measurement in `container-variants.ts`.
- **Control radii** — `radius-action` (Buttons **and** NavItems, one dial:
  default `lg`) and `radius-field` (Input/Textarea, default `lg`).
  Change the token, every control follows — never hardcode a radius on a
  control at a call site.

Every semantic color token (light **and** dark) references a primitive via
`var(--p-*)` — no literal hex in the `@theme` block or the dark block.

Guardrail for reviewers: `grep -nE '^\s*--(color|shadow)-[a-z-]+:\s*#' src/tokens.css`
must return nothing (a semantic token with a literal hex fails review).

### Color exceptions in consuming apps
Consumer code is token-only. Deliberate exceptions (e.g. an editor-styled code
block, SVG chart colors without a token vocabulary yet, or a user-configured
runtime accent color) need an explicit justification in review **in the
consuming repo** — new exceptions get the same scrutiny there.

---

## 3. Theming

- The active theme lives on `<html data-theme="light|dark">`. The dark block in
  `tokens.css` (`[data-theme="dark"]`) overrides the *semantic* tokens only.
- [`ThemeProvider`](../src/theme/ThemeContext.tsx) resolves the user's choice —
  **light / dark / system** — persists it to `localStorage` (key via
  `storageKey`, default "theme"), and tracks the OS setting while on "system".
  Consumers add the no-flash inline script to their `index.html` **before
  first paint** (see Storybook „Theming"; keep it in sync with the provider —
  without it the page flashes the light theme before React mounts). Users
  switch via [`ThemeToggle`](../src/components/theme-toggle.tsx).
- **Controlled mode**: a consumer that already owns theme state passes
  `theme` + `onThemeChange` — the provider then reads/writes no
  `localStorage` and keeps no internal choice; `setTheme` only calls
  `onThemeChange`. It still resolves "system" and stays the single writer of
  `<html data-theme>`. Uncontrolled (no `theme` prop) is unchanged. The two
  migration paths for apps with their own theme context (keep ownership vs.
  hand it to the provider) live in Storybook „Theming".
- No `@media (prefers-color-scheme)` in our CSS — "system" is resolved in JS,
  so there is a single dark block (no duplication).
- Every theme must define values for: default, **hover, active, focus,
  disabled**, borders, elevated surfaces, and shadows. Background + text alone
  is not sufficient — missing states are the most common source of visual bugs.
- Both themes require a **visual QA pass** before merge, not just code review.

---

## 4. Component Rules

- Application code uses the **shared components from
  `@ki4jlu/design-system`**. No raw `<button>` / form controls without a
  documented justification in the PR.
- **No hardcoded colors.** Every color goes through a semantic token.
- Compose classes with `cn()` (exported by the package).
- **Every raw element with a non-zero user-agent margin carries an explicit
  margin utility** (`m-0` unless the design says otherwise): headings, `<p>`,
  `<pre>`, and the `<ol>` Radix renders for the toast viewport. Without it a
  consuming app's `@layer base { margin: revert }` — the counterweight any app
  keeping its own prose styling next to Tailwind Preflight has — wins the
  cascade and the user-agent margin lands *inside* the component (measured:
  16.08 px on `PageHeader`'s heading in production). A utility sits in the
  `utilities` layer, so it changes nothing where Preflight is intact and it
  beats a **layered** consumer reset — the `@layer base` shape a Preflight app
  has. Being layered is the condition, not the `base` name: an **unlayered**
  declaration outranks every layered one of equal importance whatever its
  specificity, so a reset written outside any `@layer` defeats `m-0` (measured
  in Chromium: unlayered `p { margin: revert }` leaves 14 px on a `text-sm`
  `<p>`, exactly as if the utility were absent). Pinned — for the layered case,
  the only one a consumer is known to have — by the
  `Foundations/UA-Margin-Reset` story;
  rationale in [COMPONENT_GUIDELINES.md → „Page headings: who owns
  them"](./COMPONENT_GUIDELINES.md#page-headings-who-owns-them).
- New component **variants require review** by the design system owner before
  merge.
- New components follow shadcn/ui patterns (Radix primitives + cva + tokens),
  and `npx shadcn@latest add <component>` is the preferred way to start one.
  A generated file is **not** mergeable as emitted: it ships shadcn's own token
  vocabulary, the unified `radix-ui` import, an inline `cva` map, and it writes
  a token block into `src/tokens.css`. The canonical, ordered normalisation
  steps — including the full **shadcn → JLU token mapping table** and the
  guardrail greps for the reverted `tokens.css` injection — live in
  [COMPONENT_GUIDELINES.md → „Generating a component with the shadcn CLI"](./COMPONENT_GUIDELINES.md#generating-a-component-with-the-shadcn-cli).
  One copy, deliberately: a mapping restated in two files is a mapping that
  goes stale in one of them.
- Internal imports may use the `@/*` alias (`@/lib/utils`, `@/components/x`),
  which is what the generator emits; existing files use relative paths and
  both resolve. `vite-plugin-dts` rewrites the alias to a relative path in the
  published `.d.ts`, so it never reaches consumers — verified, do not
  "simplify" this away.
- `cva` variant maps live in a sibling `*-variants.ts` file (see
  [`button-variants.ts`](../src/components/button-variants.ts)), not in the
  component file, to satisfy react-refresh's "only export components" rule.

### Shared component inventory (`src/components/`)
| Component | File | Notes |
|-----------|------|-------|
| `Badge` (+ `badgeVariants`) | `badge.tsx` / `badge-variants.ts` | status chip: `tone` = neutral/primary/secondary/success/warning/error/info; `appearance` = filled pill or inline text |
| `Button` (+ `buttonVariants`) | `button.tsx` / `button-variants.ts` | variants: default/secondary/outline/ghost/destructive/destructive-outline/link; sizes: default/sm/lg/icon; `asChild` via Radix Slot |
| `Card` (+ Header/Title/Description/Content/Footer) | `card.tsx` | surface + border + `shadow-card` |
| `CodeBlock` | `code-block.tsx` | fixed-dark code viewer (identical in both themes, `code-surface` tokens) with built-in copy button (clipboard write + Copy→Check confirmation for ~2 s) |
| `Input` (+ shared `fieldVariants`) | `input.tsx` / `field-variants.ts` | honors `aria-invalid` styling; `variant`: default (framed) / inline (borderless in-flow field for in-row editing) |
| `Label` | `label.tsx` | Radix Label |
| `Logo` (+ `logoVariants`) | `logo.tsx` / `logo-variants.ts` | platform wordmark „JLU [Produkt]" (CampusAgents/API/RAG): prefix + badge on the brand tokens (`brand`/`on-brand` theme-invariant, `brand-wordmark` inverts in dark), sizes sm/default/lg; real text (no aria needed) |
| `Dialog` (+ parts) | `dialog.tsx` | Radix — focus trap, Esc-to-close, ARIA, scroll lock; built-in close button label overridable via `closeLabel` (default „Schließen") |
| Form field primitives | `form.tsx` | `FormItem/FormLabel/FormControl/FormDescription/FormMessage`; a11y label + `aria-describedby`/`aria-invalid` wiring; **no** react-hook-form (add later if forms need schema validation) |
| `MenuItem` (+ `menuItemVariants`) | `menu-item.tsx` / `menu-item-variants.ts` | dropdown/listbox/popover row: `selected`, `highlighted` (keyboard), `destructive`; ARIA roles stay at call sites |
| `NavItem` (+ `navItemVariants`) | `nav-item.tsx` / `nav-item-variants.ts` | sidebar/menu row: `level` top/sub, `active` sets `aria-current="page"`; `asChild` for router links. `label` (a plain string mirroring the visible text) is what lets a row collapse: inside a collapsed `Sidebar` it becomes the row's `aria-label` **and** a `Tooltip`, and the non-`<svg>` children are hidden. Without `label` a row does not collapse at all — the row cannot invent a name it was not told. The collapsed state comes from the `Sidebar` (context), never from a prop, so one column cannot end up half collapsed |
| `SegmentedControl` | `segmented-control.tsx` | single-select segment row (e.g. Tag/Woche/Monat chart-range switch, or an icon-only card/list view toggle): controlled `value`/`onValueChange`, `role="group"`, active segment via `aria-pressed`. **`icon` per option (0.33.0)** makes that segment icon-only — the icon is shown, `label` goes `sr-only` and stays the accessible name. `label` is required either way, so an unnamed segment is not expressible; the segment also becomes square (`h-9 w-9`), since the text padding has no icon width to balance |
| `FilterChips` | `filter-chips.tsx` / `filter-chips-variants.ts` | single-select filter strip above a list — a row of pill chips, exactly one active, plus an optional trailing icon-only action chip (`onAdd` + `addLabel`, the „+“). Controlled `value`/`onValueChange`; a `value` matching no option renders every chip inactive rather than throwing, which is the readable failure when a stored filter outlives its category. Same ARIA as `SegmentedControl` (`role="group"` + `aria-pressed`) and deliberately NOT `tablist` (no panels to switch) or `radiogroup` (roving focus would make Tab skip the strip). Scrolls horizontally in ONE row rather than wrapping — wrapping would change the chrome's height as categories are added and move the list under the reader. Distinct from `FilterMenu`, which hides its options in a dropdown, and from `SegmentedControl`, whose joined border suits a fixed axis rather than a set the user extends at runtime |
| `Switch` | `switch.tsx` | Radix Switch — role="switch", keyboard toggle; pair with `Label`/`FormControl` |
| `Textarea` (+ shared `fieldVariants`) | `textarea.tsx` / `field-variants.ts` | mirrors `Input` (tokens, focus ring, `aria-invalid`); `variant`: default / inline (composer in a Card); `min-h-24`/`resize-y` only in default |
| `ThemeToggle` | `theme-toggle.tsx` | segmented light/system/dark switch on the theme runtime; all labels overridable (`themeLabel`, `lightLabel`, `systemLabel`, `darkLabel`; German defaults); `id` lands on the `role="group"` element, the one part a consumer has reason to address from outside (the option buttons stay internal) |
| `Table` (+ Header/Body/Footer/Row/Head/Cell/Caption) | `table.tsx` | semantic `<table>` part set, **no Radix** (Radix ships no table primitive; shadcn's own source imports only React + `cn`). Brings its own horizontal scroll container — role-less and untabbable, so the `table`/`rowgroup`/`row`/`columnheader`/`cell` tree is untouched; reach it via `containerClassName` (bounded height = vertical scrolling). `TableHead` defaults to `scope="col"`; `TableCaption` is the table's accessible name. Diverges from shadcn where the evidence did: cells **wrap** by default (`whitespace-nowrap` per cell at the call site), `wrap-anywhere` for hashes/URLs, and every divider carries `border-outline-variant` — a bare `border-b` would render in `currentColor`, since this repo has no global `border-border` reset. No sticky header yet (see MDX „Bewusst nicht enthalten") |
| `Tabs` (+ List/Trigger/Content) | `tabs.tsx` | Radix — APG „Tabs": `tablist` / `tab` + `aria-selected` + `aria-controls` / `tabpanel` + `aria-labelledby`, ein Tabstopp für die ganze Leiste, Pfeiltasten + Home/End, `orientation` horizontal/vertical, `activationMode` automatic (Default) / manual. Abgrenzung: Tabs benennen einen Inhaltsbereich (ein Panel je Reiter), `SegmentedControl` setzt nur einen Wert (`role="group"` + `aria-pressed`), `BottomTabBar` ist Chrome-Navigation (`aria-current="page"`). Aktiv = Unterstrich + `text-primary`, damit Tabs auch optisch nicht wie ein SegmentedControl aussehen. Zwei geprüfte Radix-Eigenheiten stehen in der MDX: inaktive Panels sind **ausgehängt** (Panel-Zustand überlebt den Wechsel nicht, `forceMount` ist kein Ersatz), und der Roving-Tabindex sitzt vor dem ersten Fokus auf dem `tablist`-Container statt auf dem aktiven Reiter |
| `Toast` (+ Provider/Viewport/Title/Description/Action/Close, `TOAST_DURATIONS`) | `toast.tsx` / `toast-variants.ts` | Radix (`@radix-ui/react-toast`) — flüchtige Statusmeldung in der festen Bildschirmecke; ersetzt JustRAGs `ToastContainer.tsx`/`Toast.css`. `variant` = neutral/success/error/warning/info steuert Akzentkante, Icon (WCAG 1.4.1 — Status nicht nur über Farbe), Standarddauer (`TOAST_DURATIONS`, JustRAGs Werte: Erfolg 4 s, Fehler 6 s) **und** die Dringlichkeit der Ansage: `error` → `assertive`, sonst `polite`, per `type` übersteuerbar. Kein handgeschriebenes `role="alert"` — Radix sagt über ein verborgenes `role="status"` an, dessen explizites `aria-live="assertive"` zusammen mit dem impliziten `aria-atomic` der Rolle genau das ergibt, was `role="alert"` definiert; der sichtbare Toast ist selbst keine Live-Region (genau eine Ansage). Kein Fokusdiebstahl; WCAG 2.2.1 ist über Radix' Pause bei Hover **und** Fokus (F8 in den Viewport) plus `ToastClose`/`duration={Infinity}` erfüllt, nicht über einen eigenen Schalter. Keine Ein-/Ausblend-Animation wie bei allen schwebenden Flächen, damit ist `prefers-reduced-motion` gegenstandslos. **Die Warteschlange bleibt in der App** (JustRAGs `MAX_TOASTS = 5`): das Paket liefert Darstellung + Timer, keinen `toast()`-Singleton. Bewusst gegen `sonner` entschieden (eigene Toast-Maschine mit eigenem State/Markup/CSS — Bruch mit dem „dünne Radix-Hülle"-Muster). `z-100` liegt über `Dialog`/`BottomTabBar` (`z-50`); ein `Toast` ohne gemounteten `ToastViewport` rendert still gar nichts |
| `Tooltip` (+ Trigger/Content/Provider) | `tooltip.tsx` | Radix — APG tooltip: `role="tooltip"` + `aria-describedby` on the trigger, opens on hover **and** focus, Escape dismisses, never focusable; replaces `title=` hints. Each `Tooltip` mounts its own provider (shadcn shape, no app setup); style is the re-pointed shadcn look (`bg-primary`/`text-on-primary`, `shadow-overlay`, no animation/arrow like all floating surfaces) |

*(Inventory above predates v0.9.0; Avatar, Badge dot, ChatBubble, Checkbox,
DropdownMenu, Popover, Select, Spinner are documented in Storybook and the
Changelog cards on the board.)*

### Layout primitives (`src/components/`)
Layout values come **only** from tokens (spacing `stack-*`/`gutter`/
`margin-page`, the page widths `--max-width-container-max`/`-content`/
`-reading`, radius, colors) — no raw pixel values.

| Component | File | Notes |
|-----------|------|-------|
| `Stack` (+ `stackVariants`) | `stack.tsx` / `stack-variants.ts` | 1-D flex: `direction` column/row, `gap` = spacing tokens, align/justify/wrap; `asChild` for semantic elements |
| `Grid` (+ `gridVariants`) | `grid.tsx` / `grid-variants.ts` | responsive grid. `cols` 1–4 is the **desktop** count and a BREAKPOINT ladder — the mobile collapse (→1) is built in, but the steps land where Tailwind's `md`/`xl` fall, so `cols={3}` renders two columns everywhere from 768 to 1279px. **`cols="auto"` (0.32.0) counts no columns at all**: `repeat(auto-fill, minmax(min(17.5rem,100%),1fr))` fills as many tracks as FIT, so the count follows the container and keeps following it inside a shell whose side columns collapse. That is the one a wall of cards wants. `auto-fill` not `auto-fit`, so a grid holding one card leaves it card-sized instead of stretching it across the row; the inner `min(…,100%)` keeps a 280px track from overflowing a narrower screen |
| `Container` (+ `containerVariants`) | `container.tsx` / `container-variants.ts` | centered page column: `px-gutter md:px-margin-page`; `size` names the page's role — `page` (1440px, default), `content` (1000px), `reading` (672px), all three from `--max-width-container-*`. Never a `max-w-*` at the call site |
| `PageHeader` | `page-header.tsx` | `<h1>` (headline tokens, mobile size below md) + description + right-aligned `actions`; `children` = toolbar row below |
| `Sidebar` | `sidebar.tsx` / `sidebar-context.ts` | structural nav column: `header`/`footer` slots, scrollable `<nav aria-label>` for NavItems; positioning/drawer live in AppShell. **Collapsible, controlled only** — `collapsed`/`onCollapsedChange`, no `defaultCollapsed`. The toggle belongs to the column (it is the only way back out of the collapsed state) and renders as the trailing item of the header row, right-aligned inline with the brand; it appears only when `onCollapsedChange` is given. Both widths are tokens (`--width-sidebar` / `--width-sidebar-collapsed`); the expanded one is exactly what `w-64` resolved to before. Publishes the collapsed state on `SidebarCollapsedContext` to `NavItem`, `SidebarUserMenu` and (via the exported `useSidebarCollapsed`) a consumer's own header/footer node — **since 0.30.0 `SidePanel` publishes it too**, so the two frames are interchangeable to everything downstream. **Since 0.30.0 no shell renders it**: `AppShell`/`AppShellLayout` use `SidePanel` columns, so `Sidebar` is the standalone nav column only, unchanged and still exported; `SidebarSurfaceContext` is **deleted** (the drawer that produced the `"drawer"` value is gone, so nothing wrote it and only `Sidebar` read it). Open: the two frames now differ only in the collapsed width (80px icon column vs 60px rail), so `Sidebar` is a candidate for deletion in favour of `SidePanel` |
| `AppShell` | `app-shell.tsx` | responsive frame, **rebuilt in 0.30.0**: an optional `SidePanel` column on each side (`left`/`right`, both `AppShellPanel` — `content`, `header`, `footer`, `label`, `isOpen`, `onOpenChange`, `width` default 256 = `--width-sidebar`, `expandLabel`/`collapseLabel`, `collapsedPreview`) around a main column of `topBar` (the `h-16` chrome row) plus the page's one scrolling `<main>`. Collapsed **is** the 60px rail — there is no icon-column mode. Below `lg` one area at a time plus a `BottomTabBar`: the consumer declares `mobileTabs` (each tab names the area it shows), `activeMobileTab`, `onMobileTabChange`, `mobileTabBarLabel`; the arrangement is chosen in JS (`useIsDesktop`, shared with `WorkspaceLayout` in `lib/pane-layout.ts`), never with a `lg:` ladder. **No drawer, no dialog, no focus trap** — the non-overlay arrangement needs none — and therefore **no node mounted twice** (the `sidebar`/`menuLabel`/`drawerLabel` props are gone and `SidebarSurfaceContext` with them). `AppShellPanel.footer` is forwarded to `SidePanel.footer`, so a collapsed column keeps its sign-out route in the rail and a `SidebarUserMenu` there renders as its avatar alone |
| `SidebarUserMenu` | `sidebar-user-menu.tsx` | sidebar-footer user menu: initials avatar, name over role, chevron; the whole row is the dropdown trigger. In a collapsed `Sidebar` it shrinks to the avatar alone (round, icon-sized, no chevron) — kept rather than hidden, because it is the only route to sign-out. Name and role stay as `sr-only`, so the trigger's accessible name is the same string in both states |
| `SidePanel` | `side-panel.tsx` / `side-panel-variants.ts` | controlled collapsible pane frame: `side` left/right, `isOpen`, `width`, collapsed rail (`SIDE_PANEL_RAIL_WIDTH` = 60px) with an `collapsedPreview` slot. The collapse/expand control belongs to the frame — it is the only control that exists while collapsed. Children stay mounted but leave the accessibility tree, so scroll position and half-typed input survive a collapse. The toggle shares an `h-16` row with the optional `header` slot (title/brand, expanded-only, `min-w-0` so a `truncate`d title clips instead of pushing the toggle out — `header` is *unmounted* while collapsed, unlike `children`), and it sits on the **content-facing** edge in both directions: `[header … toggle]` on a left pane, `[toggle … header]` on a right one, carried by DOM order rather than an `order-*` utility so reading and tab order match the visual one. `h-16` is the same chrome unit as `AppShellLayout`'s bar, so both pane headers and the main column's bar align; the collapsed rail's 60px **width** is unchanged. **`footer` (0.30.0)** pins a node under the body and, unlike `header`, survives collapsing — it moves to the bottom of the rail, because it is typically the only route to sign-out; it *moves* rather than being rendered twice, so it loses component state across a collapse while `children` do not. **Publishes its collapsed state on `SidebarCollapsedContext` (0.30.0)**, so `NavItem` / `SidebarUserMenu` inside it shrink to their icon form in the rail — before that only `Sidebar` provided it, and a nav column moved onto this frame rendered full-width labels inside 60px. `collapsedPreview` is what a composing template moves a nav into (`AppShellLayout` does exactly that since 0.31.0). No viewport awareness: which pane is rendered is the template's job |
| `ResizeHandle` | `resize-handle.tsx` / `resize-handle-variants.ts` | accessible pane resizer: focusable `role="separator"` (WAI-ARIA APG „Window Splitter") with `aria-valuemin/max/now`, clamped, and `aria-orientation="vertical"` for the bar itself (not the role's default). Arrow keys move by `step` (default 10) **mirrored per side** — a left pane grows on `→`/`↑`, a right pane on `←`/`↓`; Home/End are min/max values and are deliberately *not* mirrored. Owns its pointer-drag loop and reports through one `onValueChange`. See „Entschieden: `separator` statt `slider`" in the MDX — role **and** vertical mirroring were one decision and are both settled (owner, 08/2026). `controls` (→ `aria-controls`, the pane root whose width `aria-valuenow` reports) completes the pattern: every *required* APG piece is present; of the *optional* keys, Home/End are in, `Enter` (collapse — `SidePanel`'s visible button) and F6 are deliberately out. In `WorkspaceLayout` the id is minted by the template and always wired; see „Entschieden: `aria-controls` zeigt auf die Leisten-Wurzel" in the MDX |
| `BottomTabBar` | `bottom-tab-bar.tsx` / `bottom-tab-bar-variants.ts` | fixed bottom `navigation` landmark for narrow-screen pane switching: `items` of icon + label, exactly one `aria-current="page"`. Deliberately **not** `SegmentedControl` — that is a `role="group"` of `aria-pressed` toggles, an inline control rather than a landmark whose active item is the displayed view |

### Page templates (`src/templates/`)
One template per page category of the migration order — real importable
components (`AppShellLayout`, `AuthLayout`, `DashboardLayout`, `FormLayout`,
`ChatLayout`, `TableLayout`, `WorkspaceLayout`, `SectionedGridLayout`). Rules:

- **Two kinds of template, and the difference is not size.** Most templates are
  page *content* and hang into `AppShellLayout` as `children`
  (`DashboardLayout`, `FormLayout`, `TableLayout`, `ChatLayout`,
  `SectionedGridLayout`) — their own landmark is a `<section aria-label>` inside
  the shell's one `<main>`. `WorkspaceLayout` is the opposite and the one case
  so far: it **owns the viewport and *is* the chrome of its screen** — its two
  side panes are the vertical chrome columns — so it must **never** be nested in
  `AppShellLayout`, where the shell's nav column plus the left pane put two
  chrome columns on one screen (found in Storybook, `fix(workspace-layout):
  standalone`). Consequently it renders the page's `<main>` itself, because
  nothing above it does. The deciding question for a new template is „does it
  bring the chrome, or fill a slot", and its MDX has to answer it.
- Templates are **layout composition only**: slots (`ReactNode` props) for
  injected content, no business logic, no data fetching. `SectionedGridLayout`
  is the overview/browse page category — a stack of collapsible sections, each
  holding a `Grid` of cards, with an optional `PageHeader` above. It is page
  *content* (hung into `AppShellLayout` as `children`, like `DashboardLayout`),
  and it takes its sections **as given**: grouping, sorting and „is this
  section empty" stay in the app, which is why the section body is a
  three-way union (`items` + optional `createCell` · `emptyState` · free-form
  `body`) instead of a derivation over `items`.
- **Collapsible sections are ARIA disclosures, not an `Accordion`.** There is
  no `Accordion` primitive and `SectionedGridLayout` does not smuggle one in:
  `isOpen`/`onOpenChange` per section are controlled by the app (as with
  `SidePanel` and `WorkspaceLayout`, and deliberately without a `defaultOpen`),
  the trigger sits inside the `<h2>` (APG's accordion markup) and carries
  `aria-expanded` + `aria-controls`. The referenced panel element is **always**
  in the DOM — an `aria-controls` that resolves only while open is a dangling
  reference — while its children are unmounted on collapse (the source
  implementation's data re-read hangs off that mount, the opposite trade-off to
  `SidePanel`'s). The panel is deliberately no `region`: APG warns against
  landmark proliferation, so the template contributes exactly one landmark,
  its own `<section aria-label>`.
- Responsive behavior lives **inside** the template (sidebar collapse, grid
  breaks, mobile action stacking) — consuming apps write no breakpoint ladders.
  Which *mechanism* the template uses is its own choice: CSS wherever CSS can
  do it, and a **single** JS media query where the arrangement genuinely
  differs rather than merely narrowing. `WorkspaceLayout` is the one case so
  far — below `lg` a pane fills the screen, ignores its collapse state and
  loses its collapse control, and none of the three is expressible as a class
  on the same markup. It queries Tailwind's own `--breakpoint-lg` (`64rem`),
  Tailwind's own `--breakpoint-lg`, read from `theme.css` rather than restated; a second, differing
  breakpoint anywhere in a template is a review FAIL. The consumer still writes
  no ladder — it passes the current pane as a controlled prop.
- **A dimension a template constrains on an *inner* element needs a prop.** A
  consumer's `className` merges into the template's **root**, so any `max-w-*`,
  height or gap that sits deeper is unreachable from every call site — and it
  fails *silently*, as a layout that simply looks wrong. `AuthLayout` had
  exactly this (`max-w-md` on the inner column) and legal pages adopting it
  dropped from 720px to 448px unnoticed; it is now the `width` prop
  (`auth-layout-variants.ts`). Prefer the named prop over a
  `stackClassName`-style passthrough: a second class surface re-opens what
  `layout-only-classname` exists to close, and that rule cannot see arbitrary
  values on composition components, so the passthrough would be unpoliced. The
  check for a new template: does `className` reach every dimension the template
  fixes? Where it doesn't, name the choices as variants. Templates whose width
  comes from `Container` (`FormLayout`, `TableLayout`, `DashboardLayout`) are
  fine — `className` merges onto the same element that carries the `max-w-*`.
- **Who renders the page heading is one rule for all templates, and the level
  is the call site's.** A template renders its `title` as a real heading
  element; `headingLevel` (`1`–`6`, type `HeadingLevel`) says where in the
  outline it sits, defaulting per template to exactly what it rendered before
  the prop existed. A template with a second heading role *derives* it
  (`SectionedGridLayout`'s sections are `headingLevel + 1`) and never hardcodes
  a second level; a template with no `title` prop contributes no heading, and
  its text slots (`AppShellLayout.pageLabel`) are chrome, not the page heading
  — and since 0.29.0 that slot may be left out entirely (the bar then renders
  no element for it), which changes who *shows* the title, never who owns it.
  A new template answers this in its MDX. The rule, the reasoning and the
  frozen per-template defaults live in one place —
  [COMPONENT_GUIDELINES.md → „Page headings: who owns
  them"](./COMPONENT_GUIDELINES.md#page-headings-who-owns-them) — because the
  four-way split it replaced was the cost of never writing it down.
- **A template does not decide which controls belong in its chrome — it opens
  the position.** A control a template mounts by itself can be neither moved,
  suppressed, localized nor addressed by the app, and the app has no way to
  add a second one beside it. `AppShellLayout` hardcoded a `<ThemeToggle />`
  in its page-label bar and hit all four at once (KI-784): one consumer wanted
  the toggle in its user menu, another wanted a search field in that bar, a
  third needed an `id` on it, and its four label props were unreachable from a
  bilingual app. The fix is a `ReactNode` slot (`headerActions`) and **no**
  fallback content — a "render the toggle when the slot is empty" default
  would have kept exactly the case the slot exists to solve (the app that
  wants the position *empty*) impossible. The slot inherits the position's
  rules, heading ownership included: chrome stays chrome.
- **A chrome position keeps its geometry when it is empty.** Making a slot
  optional is additive; making the *box* around it disappear is not. Consumers
  measure a chrome bar's height once and position their own overlays against
  it (JustRAG derives `top: 76px` from `AppShellLayout`'s 64px page-label bar),
  so a bar that collapsed once every slot in it was omitted would move their
  UI without any call site changing a line — a breaking change arriving
  through an *unchanged* call site, which is the kind that is found in
  production. Rendering nothing for the missing content and keeping the
  position is the default (0.29.0, `pageLabel`); removing the position is a
  separate, explicitly migrated decision.
- **A control that belongs to a *component* the template composes is
  forwarded, not re-slotted.** The previous rule is about a position the
  *template* would otherwise fill with an opinion of its own. Where the
  component already owns the control — `Sidebar`'s collapse toggle, which has
  to survive collapsing and carries `aria-expanded` + `aria-controls` on a
  `<nav>` id minted inside it — a template-level slot would re-open exactly
  the question the component closed, one level higher, and could not reach the
  id at all. `AppShellLayout` therefore forwards the column's state and labels
  instead of slotting a control (0.28.0, KI-793; since 0.30.0 the column is a
  `SidePanel` and the props are `leftOpen` / `onLeftOpenChange` /
  `collapseLabel` / `expandLabel`), and it `Pick`s the four narrow-screen tab
  props straight from `AppShellProps`: same names, same descriptions, nothing
  to drift. The test for which rule applies is „who owns the control", not „is
  it in my subtree".
  **Since 0.31.0 the navigation moves into the collapsed rail** — the same `nav`
  node, mounted once, as `content` while `leftOpen` and as `collapsedPreview`
  otherwise, so minimising shrinks the column to icons instead of emptying it.
  Below `lg` the shown column still ignores the collapse state entirely.
  Forwarding is only additive as long as the props stay optional and keep the
  component's defaults — a forwarded prop with a new default at template level
  is a behaviour change in disguise.
- **A template that composes a component with labelled controls forwards those
  labels too.** The defaults are German; an app that cannot reach them ships
  German strings it never chose. Where the consumer can construct the
  component itself, deleting the mount is the better fix (0.26.0's
  `ThemeToggle`) — where the template owns the instance, forwarding is the
  only route (0.28.0's `collapseLabel`/`expandLabel`).
- Apps **import** templates; they never rebuild a page skeleton. If a template
  doesn't fit, extend it here (owner review), don't fork it in the app.
- Each template has a story under `Templates/` (content composed from existing
  component stories via portable stories) and an MDX page documenting slots,
  responsive behavior, and do's/don'ts.

### Tooling & enforcement
- **Lint gate** — the shipped ESLint plugin
  ([`eslint-plugin/index.js`](../eslint-plugin/index.js), exported as
  `@ki4jlu/design-system/eslint-plugin`):
  - `design-system/no-hardcoded-colors` (**error**) — blocks raw Tailwind
    palette utilities (`bg-blue-500`, `dark:text-green-400`) and hex classes
    (`bg-[#1e1e2e]`). Genuine exceptions need an `// eslint-disable-next-line`
    **with a reason**.
  - `design-system/no-raw-ui-elements` (**warn**) — surfaces raw
    `<button>`/`<input>` that should be `Button`/`Input`. Warn, not error,
    because some low-level controls (dropdown internals, range/color inputs,
    textareas) legitimately stay raw.
  - `design-system/layout-only-classname` (**warn**) — flags skin classes
    (positive paddings, font sizes/families, line-height, wrap/truncate) in
    `className` on design-system controls. Encodes guideline rules 4 and 5:
    looks belong in variants; controls are never shrunk to fit. `p-0` and
    padding on `variant="inline"` fields are allowed.
- **Component workbench & docs** — Storybook (`npm run storybook`): autodocs
  props tables, a11y addon, MDX pages (Einführung / Tokens / Theming), theme
  toolbar switching light/dark/system live via the real ThemeProvider.
- **Review gate** — [`.github/CODEOWNERS`](../.github/CODEOWNERS).
- **Visual regression** — **not automated yet.** The only check on rendering is
  manual both-theme QA (§3), performed by the reviewer before a PR is approved.
  Chromatic was wired up but never activated (no project token), which meant a
  green check that had never rendered a pixel; it was removed rather than left
  as a false gate.

  The planned replacement is self-hosted and needs no third-party service: the
  Storybook stories already run in real Chromium via
  [`@storybook/addon-vitest`](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
  and `@vitest/browser-playwright`, and CI already installs that browser — so
  Vitest 4's `toMatchScreenshot()` can diff against baseline PNGs committed to
  the repo. Baselines must be generated in CI (or a container matching it), not
  on a developer machine: font rendering differs between macOS and Ubuntu and
  would make every local baseline fail in CI.

  When it lands, template stories must keep being snapshotted in the mode
  matrix that Chromatic covered — **light/dark × 1280 px/390 px** — so layout
  regressions are caught at the **composition** level, not only per component.
  390 px is below the `lg` breakpoint, where the shell shows one area at a time
  plus a `BottomTabBar` instead of its columns.

---

## 5. Accessibility (requirement, not follow-up)

Minimum bar for every shared component:
- WCAG-compliant contrast (both themes)
- Full keyboard navigation
- Visible focus indicator (use `focus-ring` token)
- Accessible dialog behaviour: focus trap, escape to close, correct ARIA roles
- Proper form labels + validation messaging (`aria-invalid` / `aria-describedby`)

---

## 6. Contribution Process

**Adding/changing a token**
1. Add the primitive (if a new raw value) to the `:root` block.
2. Add/point the semantic token in `@theme` at that primitive.
3. Provide the dark-mode value in the `[data-theme="dark"]` block.
4. Note it in the Changelog. PR requires owner approval.

**Adding a component / variant**
1. Prefer `npx shadcn@latest add <component>` (wired via `components.json`;
   writes flat into `src/components/`), then work through the **post-generation
   checklist** in
   [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md#post-generation-checklist)
   — it is the canonical, ordered list (token mapping, reverting the
   `tokens.css` injection, the Radix import swap, the `*-variants.ts` split,
   story/MDX/test, both-theme QA) and covers steps 2–4 below for generated
   components.
2. Meet the accessibility bar (§5). Add a test where behaviour is non-trivial.
3. Add a `*.stories.tsx` next to the component (Storybook is the documentation).
4. New variants need explicit owner review.

**Adding a template (`src/templates/`)**
1. Compose **only** layout primitives + existing shared components; layout
   values only via tokens. Single responsibility: slots in, skeleton out — no
   business logic.
2. Responsive behavior (breakpoints, collapse) belongs inside the template.
3. Add a story under `Templates/` — reuse existing component stories via
   portable stories (`composeStories`) instead of re-mocking content — plus an
   MDX page (slots/props, responsive behavior, do's/don'ts).
4. **No template is used in an app before its PR is reviewed** (CODEOWNERS
   requests the owner). Check it by hand in **both themes and at both widths**
   (desktop and below `lg`, where the sidebars collapse) — until the snapshot
   suite in §4 exists, that manual pass is the only thing standing between a
   layout regression and a release. Both-theme visual QA (§3) applies.

---

## 7. Versioning & Changelog

Semantic versioning, published to GitHub Packages via the release workflow
(push a `v*` tag). Consumers pin a semver range. Record every token/component
change here.

### Distribution — open follow-up: publish to npmjs.com

Consumers currently install from git (README). That works everywhere without a
token, but costs a build on install and requires `git` in the build image.
Publishing to the public npm registry would be strictly better for every
consumer. Not done yet because it needs an account action nobody has taken:

1. Create the `@ki4jlu` organisation/scope on npmjs.com.
2. Add an automation access token as the `NPM_TOKEN` repository secret.
3. Switch `publishConfig.registry` in `package.json` to
   `https://registry.npmjs.org`, and point `registry-url` +
   `NODE_AUTH_TOKEN` in `.github/workflows/publish.yml` at it.

Until then the git path carries us; keep the README's git section first.

### Changelog
- **0.33.0** — `SegmentedControl` options take an optional `icon`. With one, the
  segment is icon-only and square, and `label` is rendered `sr-only` rather than
  dropped — the accessible name is computed from the contents, so removing the
  text is how icon buttons end up announced as „button, button". Added for
  JustRAG's card/list view toggle. Additive; text segments are unchanged.

- **0.32.0** — Added `Grid`'s `cols="auto"`. The numbered variants are a
  breakpoint ladder, which is right for a designed column count and wrong for a
  card wall: `cols={3}` reaches three columns only at `xl`, so every width from
  768 to 1279px rendered two with room for three. JustRAG hit exactly that when
  its topic pages moved from a hand-written
  `repeat(auto-fill, minmax(280px, 1fr))` onto this component and lost a column.
  `auto` restores that behaviour as a variant, so no call site writes its own
  track list to get it. Additive — the numbered variants are unchanged.

- **0.32.0** — Added `FilterChips`: the single-select pill strip that sits above
  a list, with an optional trailing „+“ action chip. Built for JustRAG's topic
  filter bar („Alle · Favoriten · <Kategorie> · +“ across its four shell views),
  and shipped ahead of the backend that will feed it so the UI can be reviewed
  while the per-user favourites and categories are still being built.

  Neither existing component fitted. `FilterMenu` hides its options behind a
  dropdown — the opposite of a strip whose whole point is that the categories
  are visible — and `SegmentedControl` is one joined border, which reads as a
  single control with segments and suits a FIXED axis (Tag/Woche/Monat) rather
  than a list the user extends at runtime.

  It follows `SegmentedControl`'s ARIA rather than inventing its own: `role="group"`
  with `aria-pressed` per chip. Not `tablist`, because tabs switch panels and owe
  the reader roving focus while these chips filter one list in place; not
  `radiogroup`, because APG's roving focus there would make Tab skip the whole
  strip. One convention in the library, not two.

- **0.30.0** — **BREAKING: `AppShell` is two `SidePanel` columns, a
  three-region chrome bar and a `BottomTabBar` below `lg`.** KI-809 (and
  KI-808, below, which ships in the same version).

  The shell mounted a **fixed** sidebar column plus a Radix drawer for narrow
  screens, while `SidePanel` — the collapsible, left/right-aware column frame
  with the toggle the design asks for — was already in the package and already
  composed by `WorkspaceLayout`. The shell never adopted either. It does now:

  ```
  | left SidePanel            | main column                            | right SidePanel          |
  | header: logo + toggle     | bar h-16: pageLabel | search | actions | header: toggle + title   |
  | content (nav) … footer    | <main> scrolls on its own              | content … footer         |
  ```

  **What is new.**

  0. **`SidePanel` gains `footer`, and publishes its collapsed state.** Moving
     the shell's nav column onto `SidePanel` silently broke two things that had
     only ever worked because the column was a `Sidebar`. `SidebarCollapsedContext`
     had exactly one provider — `Sidebar` — so inside the 60px rail `NavItem`
     and `SidebarUserMenu` read the context default (`false`) and rendered their
     full-width form; and the shell pinned `footer` inside `SidePanel`'s
     `children`, i.e. inside the region a collapse hides, so the user menu (the
     only route to sign-out) was in the DOM but unreachable whenever the column
     was collapsed. `SidePanel` now owns both: a `footer` slot that moves into
     the rail rather than being hidden with the body, and a
     `SidebarCollapsedContext.Provider` around the whole pane. Together they are
     what makes a collapsed rail show the user avatar and nothing else.

     The footer *moves* between the rail and the body rather than being rendered
     in both — the body is hidden, never unmounted, so rendering it twice would
     duplicate any `id` a consumer put in it, the drawer failure mode this same
     release removed. The cost is that the footer loses component state across a
     collapse, like `header`; `children` stay mounted and keep theirs.

     The whole suite was green while both defects were live, so this ships with
     the six tests that fail without it (`side-panel.test.tsx`,
     `app-shell.test.tsx`) rather than on the strength of the fix alone.

  1. **Two columns, both `SidePanel`.** `AppShellProps.left` / `.right` take an
     `AppShellPanel` — `content`, optional `header` (the `h-16` row, inline
     with the toggle) and `footer` (pinned at the bottom), `label`, `isOpen`,
     `onOpenChange`, optional `width` (default **256** = `--width-sidebar`, so
     the expanded column does not move), `expandLabel`, `collapseLabel`,
     optional `collapsedPreview`. Controlled, no `defaultOpen`, exactly like
     `WorkspacePane`. Omitting a side renders no column and no rail.
  2. **Collapsed is the rail.** 60px (`SIDE_PANEL_RAIL_WIDTH`), not the 80px
     icon column `Sidebar` had — a consumer who wants icons there passes
     `collapsedPreview`. Developer decision, 2026-09-17: there is no
     icon-only-nav mode.
  3. **A three-region bar.** `AppShellLayout` gains `search?: ReactNode`
     between `pageLabel` and `headerActions`, clamped to `max-w-md` and centred
     on **the bar**, not on the space the label leaves. The two side regions
     are equal-width flex children; that is the mechanism. Measured in Chromium
     (1280px window, `WithCenteredSearch`): bar 256–1200 → centre 728, field
     504–952 → centre 728, while the label (125.4px) and the toggle (102px)
     beside it differ in width by 23px. The 0.29.0 recipe (`mx-auto` inside
     `headerActions`) could not do this: it centred in the space after the
     label. The bar stays `h-16` / 64px in every state.
  4. **Below `lg`: one area at a time plus a `BottomTabBar`** — the arrangement
     `WorkspaceLayout` already had, now shared. The consumer declares
     `mobileTabs` (each tab names the area it shows), `activeMobileTab`,
     `onMobileTabChange` and `mobileTabBarLabel`. The top bar stays (with the
     logo, and with `headerActions` so the app's chrome controls survive the
     breakpoint); the burger button is gone.
  5. **`useIsDesktop` and the pane/tab types moved to `lib/pane-layout.ts`**
     and are used by both frames — one `matchMedia` boundary in the package,
     not two. `PaneId` and `MobilePaneTab` are exported; `WorkspacePaneId` and
     `WorkspaceMobileTab` are now aliases of them, so no call site changes.

  **What is gone, and why it is not missing.** The drawer (`Dialog`), the
  burger button, `menuLabel`, `drawerLabel`, `AppShellProps.sidebar`, and the
  producer of `SidebarSurfaceContext` (now deprecated). The focus trap, the
  Escape handler and the scroll lock went with it — they exist *because a
  modal overlays the page*, and the tab-bar arrangement overlays nothing: the
  shown area **is** the page. Removing the dialog removes the requirement
  rather than leaving it unimplemented. It also removes the second mount: the
  drawer rendered the same nav node twice, so a consumer's `id` inside it
  existed twice while it was open (KI-797, documented in JustRAG's
  `AppChrome.tsx`). Every node is mounted once now, in every state — asserted
  per state in `app-shell.test.tsx`.

  **`Sidebar` is unchanged and still exported** for a standalone nav column.
  It is simply no longer what the shell renders.

  **Migration.**

  ```tsx
  // 0.29.x
  <AppShellLayout
    logo={logo} nav={nav} sidebarFooter={userMenu}
    navLabel={t("mainNavigation")}
    menuLabel={t("openNavigation")}     // REMOVED — no burger button
    drawerLabel={t("navigation")}       // REMOVED — no drawer
    headerActions={searchField}
    collapsed={collapsed}               // REMOVED
    onCollapsedChange={setCollapsed}    // REMOVED
    collapseLabel={t("collapseNav")} expandLabel={t("expandNav")}
  >

  // 0.30.0
  <AppShellLayout
    logo={logo} nav={nav} sidebarFooter={userMenu}
    navLabel={t("mainNavigation")}
    search={searchField}                // NEW: centred on the bar
    headerActions={<ThemeToggle />}
    leftOpen={leftOpen}                 // INVERTED: leftOpen === !collapsed
    onLeftOpenChange={setLeftOpen}      // required, controlled
    collapseLabel={t("collapseNav")} expandLabel={t("expandNav")}
    mobileTabs={TABS}                   // NEW, required: [{ id, icon, label, pane }]
    activeMobileTab={tab}               // NEW, required
    onMobileTabChange={setTab}          // NEW, required
    mobileTabBarLabel={t("switchArea")} // NEW, required
    rightPanel={sources}                // NEW, optional: an AppShellPanel
  >
  ```

  - `collapsed` → `leftOpen`, **with the opposite meaning**. A mechanical
    rename would invert the UI silently: `collapsed={true}` becomes
    `leftOpen={false}`. The name follows `SidePanel.isOpen` and
    `WorkspacePane.isOpen`, so the three frames spell one state one way.
  - Both are **required** now, as is the four-prop mobile group: below `lg`
    the shell shows one area at a time, and without tabs the nav column would
    be unreachable. A persisted preference (`localStorage`, URL, context) is
    the intended source — `useSidebarCollapse` in JustRAG only needs its
    boolean inverted.
  - `menuLabel` / `drawerLabel`: delete them. Nothing replaces them; the
    narrow-screen areas are named by `mobileTabs` and `mobileTabBarLabel`.
  - Using `AppShell` directly: `sidebar={<Sidebar …>}` → `left={{ content,
    header, footer, label, isOpen, onOpenChange, expandLabel, collapseLabel }}`
    plus the four mobile props.
  - Visual: the collapsed column is 60px, not 80px, and it shows no nav icons
    unless `collapsedPreview` is passed. The expanded width is unchanged.

  **Open, deliberately not decided here.** Whether `search` should have a
  place below `lg` (today it does not: a `max-w-md` field centred on a 360px
  bar has no room to be centred in), whether a shown column should render its
  `header` below `lg`, and whether `WorkspaceLayout` should become a thin case
  of `AppShell` now that both compose the same panes. All three are marked in
  code or in `COMPONENT_GUIDELINES.md` and need a card, not a guess.

  **Also in 0.30.0 — `SidePanel.header`, and the toggle moves to the
  content-facing edge.** KI-808, the prerequisite this card composes with.

  Additive: one new optional prop `header?: React.ReactNode`, rendered in the
  existing toggle row while expanded. No prop changed type, none was removed,
  `isOpen`/`width` semantics are untouched. It was the prerequisite for the
  AppShell rewrite above, which is why both land in 0.30.0.

  **What moves.** Three things, all inside that one row:

  1. `header` is rendered inline with the toggle, in a `min-w-0 flex-1`
     wrapper. A consumer's `truncate`d title therefore clips with an ellipsis
     instead of pushing the toggle off the row. The wrapper repeats the row's
     gap, so a multi-node header (logo + wordmark) keeps its spacing — the
     same shape as `Sidebar`'s brand slot.
  2. **The toggle sits on the edge that faces the main content**, both sides:
     a left pane reads `[header … toggle]` (unchanged), a right pane
     `[toggle … header]`. The right pane's toggle used to sit against the
     window edge; that is the one visible change for an existing call site,
     `WorkspaceLayout` included. It is carried by **DOM order**, not an
     `order-*` utility, so the tab sequence and a screen reader's reading
     order agree with what is on screen.
  3. The row is now `h-16 items-center` instead of `pt-stack-sm` + button
     height — the same chrome unit as `AppShellLayout`'s page-label bar and
     `Sidebar`'s header row, so a left pane's header, the main column's bar
     and a right pane's header land on one baseline.

  **`SIDE_PANEL_RAIL_WIDTH` is untouched at 60px.** The rail's *width* and the
  header row's *height* are different measurements; only the second one became
  64. The open TODO in `side-panel-variants.ts` about one shared chrome-unit
  token across `AppShell`, `SidePanel` and `BottomTabBar` still stands and
  still needs owner sign-off.

  **`header` is unmounted while collapsed, `children` are not** — deliberately
  opposite. A pane body holds scroll position and half-typed input, so it stays
  mounted behind the `hidden` attribute; a header is chrome with nothing to
  lose, and the collapsed rail must hold only the expand button and
  `collapsedPreview`. Same rule as `Sidebar.header`. A consumer putting
  stateful UI in `header` would lose that state across a collapse; put it in
  `children`.

  **No `footer` slot.** A composing shell pins its own footer inside
  `children` — which is exactly what `AppShell` does with
  `AppShellPanel.footer` above; the slot stayed out of `SidePanel`.

  *Consumer impact.* A call site that passes no `header` sees only the row
  height change (left pane) or the row height plus the toggle's side (right
  pane). No migration, no code change required.

  The release commit (`package.json` 0.30.0) belongs in its own
  `chore(release): 0.30.0` commit, as in 0.22.0–0.29.0.

- **0.29.0** — **`AppShellLayout.pageLabel` is optional.** KI-798.

  One prop changed type: `pageLabel: React.ReactNode` → `pageLabel?:
  React.ReactNode`. Omitted (or falsy), the page-label bar renders **no
  element** for it — not an empty `<p>`. Nothing else moved; no new prop.

  **The gap.** A consumer whose content template renders the page title
  itself (`SectionedGridLayout` → `PageHeader`) had no way to suppress the
  chrome label, so the same words appeared twice, stacked: JustRAG's
  `AppChrome` passes `pageLabel={t('myKBs')}` with `title={t('myKBs')}`
  directly beneath it, and asked for the bar to hold its search field instead.

  **No `centered` prop, because the existing escape hatch already does it —
  measured, not assumed.** `headerActions` gets `flex-1`, so with the label
  gone the slot region *is* the bar; the `w-full max-w-md mx-auto` the prop
  doc has recommended since 0.26.0 then centres on the bar's own centre.
  Measured in Chromium at 1200px: field centre 728.5 vs bar centre 728.5, to
  the pixel (`WithCenteredSearchOnly`, asserted from layout boxes rather than
  class names, with the labelled story as the falsifying counter-case). This
  is also why rendering an **empty** `<p>` was not an option: as a flex item
  it re-introduces half the row's `gap-4` on the left, and the same
  measurement comes out 736.5 — 8px off centre.

  **The classes must sit on the flex item, and one DS component makes that
  easy to get wrong.** `<Input leadingIcon={…} className="w-full max-w-md
  mx-auto" />` puts them on the inner `<input>`, which an icon field wraps in
  a full-width `<span>`; the input is inline-block there, so `margin: auto`
  computes to `0px` and the field lands 207.5px left of centre (measured).
  Wrap such a field in the call site's own `<div className="w-full max-w-md
  mx-auto">`. The `WithSearchAndEnglishToggle` story carried exactly that
  mistake since 0.26.0 while its prose claimed a centring that never happened;
  it is corrected in this release. Whether `Input` should forward layout
  classes to its icon wrapper (a `containerClassName`, say) is **not** decided
  here — no consumer has asked, and it would be a second component's API.

  **The bar keeps `h-16` / 64px in all four combinations** — label only,
  actions only, both, neither. That height is under contract outside this
  repo: JustRAG positions toasts beneath it with `top: 76px` (= 64 + 12,
  `web/src/components/Toast.css`) and measures the same 64 in its own Chromium
  story. A bar that collapsed when empty would therefore be a **breaking
  geometry change** for a call site that changed nothing, which is why it was
  not done silently. An explicit „no bar" prop remains available as a separate,
  migrated decision.

  **The chrome rule is unchanged.** The bar is still chrome with the label
  gone: `headerActions` may not hold a heading, and the label-less combination
  is asserted in `heading-owner.test.tsx` alongside the eight it already
  covers.

  *Known consumers, audited 2026-09-16 (read-only, at that moment).* Both pass
  `pageLabel` explicitly, so required → optional reaches neither of them:
  **JustRAG** — one call site, `web/src/components/AppChrome.tsx:402`, pinned
  `github:KI4JLU/JLU-Design-System#v0.28.0`; it is the consumer that asked, and
  its KI-787 will drop the prop and put a live, debounced catalog search in the
  slot. **CampusAgents** — one call site, `src/components/AppLayout.tsx:33`,
  pinned `^0.22.0`, so seven minors behind and unaffected until the pin moves.

  *Version.* Purely additive (a required prop became optional; no removal, no
  renamed export, no changed default), so a minor. The `package.json` bump
  belongs in its own `chore(release): 0.29.0` commit, as in 0.22.0–0.28.0.

- **0.28.0** — **`AppShellLayout` forwards the collapsible column.** KI-793.

  New on `AppShellLayoutProps`: `collapsed`, `onCollapsedChange`,
  `collapseLabel`, `expandLabel` — `Pick`ed from `SidebarProps` and handed to
  the `Sidebar` the template constructs internally, exactly as `menuLabel` /
  `drawerLabel` are `Pick`ed from `AppShellProps`. Nothing else changed.

  **The gap.** 0.27.0 gave `Sidebar` a controlled collapsed state, but
  `AppShellLayout` builds its own `Sidebar` and forwarded none of it, so the
  feature was reachable only by composing `AppShell` + `Sidebar` by hand —
  i.e. by rebuilding the page skeleton in the app, which §4 tells consumers
  not to do. A consumer (JustRAG) was blocked on exactly that.

  **Forwarded, not re-slotted — and that is not a contradiction of
  `headerActions`.** A template opens a slot when it would otherwise *decide*
  which control belongs in a chrome position it owns (0.26.0). The sidebar
  toggle is not such a decision: it belongs to `Sidebar` (0.27.0) because it
  must survive collapsing and it carries `aria-expanded` + `aria-controls`
  pointing at a `<nav>` id minted inside the component (`useId`, per mount).
  A template-level slot could not be held to that contract and could not reach
  that id — it would re-open the question 0.27.0 closed, one level higher. The
  four things the slot pattern protects hold anyway: the control is
  **suppressible** (omit `onCollapsedChange` → no toggle), **localizable**
  (both labels), its **position** is the column's contract rather than a
  template opinion (80px holds one element), and *adding a second control*
  beside it is not a use case — a second toggle would be a second truth.

  **Both label props forward, and here that is the only route.** 0.26.0 closed
  the equivalent `ThemeToggle` gap by *deletion* — the consumer constructs the
  component itself and passes its own labels. That option does not exist here:
  the template owns the `Sidebar` instance. Without forwarding, the German
  defaults „Navigation einklappen" / „Navigation ausklappen" would be
  unreachable from a bilingual app, which is precisely the complaint KI-784
  recorded.

  **Additive, deliberately.** Four optional props, no removed or renamed
  export, no changed default: `collapsed` defaults to `false` inside `Sidebar`
  and no `onCollapsedChange` means no toggle, so every call site written
  against 0.26.0/0.27.0 renders identically. `collapsed` alone stays
  presentational (for an app driving the state from elsewhere), as on
  `Sidebar`.

  *Known consumers, audited 2026-09-15 (read-only, at that moment).* Neither
  needs a change, and neither is dragged onto this release by an install:
  **JustRAG** — one call site, `web/src/components/AppChrome.tsx:336`, pinned
  `github:KI4JLU/JLU-Design-System#v0.26.0` (lock at `9bd9141`, the 0.26.0
  release commit); it is the consumer that asked for the toggle and is
  blocked on it, and it already passes `navLabel`/`menuLabel`/`drawerLabel`
  through its `t()` translations, so it will pass the two new labels the same
  way. **CampusAgents** — one call site, `src/components/AppLayout.tsx:31`,
  pinned `^0.22.0` and locked at 0.22.0, so six minors behind and unaffected
  until someone raises the pin.

  **The three facts from 0.27.0 are re-asserted through the template**, not
  trusted from the component suites — a prop that silently never arrives
  leaves every component test green: the drawer copy stays expanded and
  toggle-less, a `NavItem` without `label` does not collapse, and every row
  (including `SidebarUserMenu`) keeps the *same* accessible-name string in
  both states. `app-shell-layout.test.tsx`, plus a template-level story
  (`WithCollapsibleSidebar`) that measures both widths in Chromium against the
  tokens.

  *Not closed here:* `Sidebar` exposes no `id` for its toggle, so the
  „addressable" half of the 0.26.0 argument has no counterpart yet — no
  consumer has asked, and inventing one now would be API on speculation.
  Unrelated but adjacent: `AppShell` renders the sidebar node twice, so a
  consumer `id` inside the column duplicates while the drawer is open (own
  card `lgqqwyfn1imd`) — this release does not change that, since it adds no
  id-bearing node.

  *Version.* Purely additive, so a minor. The `package.json` bump belongs in
  its own `chore(release): 0.28.0` commit, as in 0.22.0–0.27.0.

- **0.27.0** — **`Sidebar` collapses to an icon column, controlled by the
  app.** KI-785.

  New: `collapsed` / `onCollapsedChange` on `Sidebar`, plus `collapseLabel` /
  `expandLabel` (German defaults, like `AppShell`'s `menuLabel`); `label` on
  `NavItem`; the exported hook `useSidebarCollapsed`; the tokens
  `--width-sidebar` (16rem — exactly what the previous `w-64` resolved to, so
  no expanded column moves) and `--width-sidebar-collapsed` (5rem).

  **Controlled, with no `defaultCollapsed`** — the same argument
  `SectionedGridSectionBase` and `SidePanel` already make: a component that
  remembered anything would be a second truth next to the app's, and sidebar
  width is exactly the sort of thing an app persists per user.

  **The toggle is the column's, not a slot's.** It is the only way back out of
  the collapsed state, so it has to survive collapsing, and it carries a
  contract an arbitrary slotted node could not be held to: `aria-expanded` plus
  `aria-controls` on the `<nav>`, and a label for each direction. Same reason
  `SidePanel` owns its expand control.

  **Not in the mobile drawer.** `AppShell` renders the *same* sidebar node
  twice, so the drawer copy cannot be told apart from props — `AppShell` now
  marks it with a context, and there the column renders expanded and without
  the toggle. A "minimise the column" control inside a modal drawer is
  meaningless, and a drawer that opened collapsed would show icon-only rows
  with no control to widen them. This is decided in JavaScript rather than with
  an `lg:` utility because it is not a question about the viewport but about
  *which of the two mounts* this is — and only `AppShell` knows that.

  **The a11y risk of the feature is the icon-only row**, so it is the thing
  under test: a collapsed row keeps its accessible name via `aria-label` from
  `label` and gets a `Tooltip` with the same text. A row given no `label` does
  not collapse — dropping its only text would be precisely the regression.

  Open, deliberately not decided here *(the first half closed in 0.28.0)*:
  `AppShellLayout` does **not** forward the new props yet (its file is the open PR #23's, and conflating them would
  make one review reason about both), and the mobile counterpart depends on the
  pending `BottomTabBar` decision card.

- **0.26.0** — **BREAKING: `AppShellLayout` no longer renders a `ThemeToggle`.
  The page-label bar has a `headerActions` slot, and `ThemeToggle` takes an
  `id`.** KI-784.

  *What broke, exactly.* Until 0.25.0 the page-label bar was
  `<p>{pageLabel}</p>` plus an unconditional `<ThemeToggle />`. From 0.26.0 the
  template renders **no** control there; `headerActions?: ReactNode` fills the
  position, and an omitted slot means an empty bar. **A consumer that does
  nothing loses its theme toggle, silently** — the slot is optional, so there
  is no type error. That is the whole breaking surface: no export was removed
  or renamed, no other prop changed, and `ThemeToggle` itself is untouched
  apart from the new optional `id`.

  *Migration — one line, and it restores 0.25.0 behaviour exactly:*

  ```tsx
  import { AppShellLayout, ThemeToggle } from "@ki4jlu/design-system";

  <AppShellLayout logo={logo} nav={nav} pageLabel={label}
                  headerActions={<ThemeToggle />}>   {/* was implicit */}
    {page}
  </AppShellLayout>
  ```

  *Known consumers, audited 2026-09-15 (read-only, at that moment).* Both use
  the template, both pin deliberately, so neither is dragged onto 0.26.0 by an
  install: **JustRAG** — one call site,
  `web/src/components/HomeView.tsx:746`, pinned
  `github:KI4JLU/JLU-Design-System#v0.25.0` (adopted at its Stage 7b); it is
  the consumer that asked for this and will use the empty slot, moving the
  toggle into its user menu. **CampusAgents** — one call site,
  `src/components/AppLayout.tsx:31`, pinned `^0.22.0` and locked at 0.22.0, so
  it is four minors behind and does not see this release at all until someone
  raises the pin; when they do, the one-line migration above is the whole
  change for them. No other consumer is known.

  *Why breaking rather than additive.* The additive form — keep rendering the
  toggle when no slot is passed — was on the table and was rejected by the
  developer on 2026-09-15. It would have left the one case the slot exists for
  unreachable: an app that wants the position **empty** because its toggle
  lives in the user menu could not say so, and would still ship two toggles.
  „Empty" has to be expressible, and a default that fills the slot cannot
  express it.

  *`ThemeToggle` gained `id`*, landing on the `role="group"` element — the
  only part of the component a consumer has reason to address from outside
  (`aria-controls`, a skip link, a scroll target). The option buttons stay
  unaddressable: they are internals. No default id is generated; a generated
  one would change between renders and could never be pointed at.

  *The label-forwarding gap is closed by deletion, not by forwarding.* The
  open item was that `AppShellLayoutProps` picks only `menuLabel | drawerLabel`
  from `AppShellProps`, so none of `ThemeToggle`'s four label props reached the
  toggle the template mounted — German-only labels in a bilingual app. With the
  template no longer mounting a toggle, the consumer constructs its own element
  and passes the labels (and the `id`) directly; four forwarding props would
  now be dead API. `AppShellLayoutProps` therefore gained exactly one prop and
  lost none.

  *Side effect worth having: the shell no longer needs a `ThemeProvider`.*
  Because it mounted a `ThemeToggle`, `AppShellLayout` used to require the
  provider, and an app that had never mounted one learned that from a runtime
  throw (`useTheme must be used within a ThemeProvider`) raised by a template
  whose props say nothing about theming — a complaint from JustRAG's adoption
  (KI-778). Nothing in the shell chain (`AppShell`, `Sidebar`, `Container`)
  calls `useTheme`, so from 0.26.0 the shell renders without a provider;
  asserted in `app-shell-layout.test.tsx`. The dependency did not disappear,
  it moved to where it is visible: the call site that puts a toggle in the
  slot still needs the provider around it.

  *Slot geometry.* The slot region takes the width the label leaves
  (`flex-1`) and aligns content to the right, so a single control sits exactly
  where the hardcoded toggle sat; several controls form a row (`gap-2`). A
  search field that should fill or centre the space says so on its own element
  (`w-full max-w-md mx-auto` — auto margins beat `justify-end`), which means
  „centred in the space after the label", not „centred in the viewport". The
  wrapper is rendered only when the slot is filled.

  *Version.* Breaking, but 0.x, so it is a minor — the same call this repo made
  in 0.25.0, where `size="narrow"` → `size="reading"` broke every call site
  that used it and shipped as a minor. The package.json bump belongs in its own
  `chore(release): 0.26.0` commit, as in 0.22.0–0.25.0.

- **0.25.0** — **`Container` names three page widths instead of two, and the
  sizes now name a role.** KI-751. The gap was that 1440px is a *page maximum*
  and 672px a *reading measure*, with nothing in between for the width most
  pages actually want — so a consumer aligning a page with its own content
  column had to write `className="max-w-[1000px]"` on a `Container`, which
  `layout-only-classname` **structurally cannot see**: the rule only checks
  `DS_CONTROLS` in `eslint-plugin/index.js` (ten controls, no composition
  components — KI-711). It passes lint silently, and the width scale becomes
  advisory.

  *The new width is 1000px, measured rather than picked.* The content columns
  the two consumers actually use today: JustRAG `.home-view__section` and
  `.home-view__grid--main` **1000px** (`web/src/components/HomeView.css:140`
  and `:247`), `GlobalKbSettings` 900px, `Profile` and `StudioWorkspace` 800px,
  `.admin-container` `min(1600px, 95vw)`; CampusAgents `EditorShell`,
  `AgentConfigPage` and `WidgetConfigPage` `max-w-container-max` (1440px),
  `WidgetEmbedPage`/`StandaloneWidgetPage` 672px. Between 672 and 1440 there
  are 800, 900 and 1000 twice — and 1000 is the column the next page to move
  (KI-750, JustRAG's legal pages) was asked to line up with. `max-w-5xl`
  (1024px) would have been the tidier number and would have missed that
  alignment by 12px a side, which is exactly the `max-w-[1000px]` this release
  exists to remove.

  *The sizes are `page` / `content` / `reading`, renamed from `default` /
  `narrow`.* Positional names gave no answer to "which one do I want", which is
  how the arbitrary value got written in the first place; a third positional
  name would have made it worse. **No width moved** — `page` is the unchanged
  1440px and `reading` the unchanged 672px, both pinned by the CSSOM tests.
  The migration is complete and verified: the only call site in this repo was
  `FormLayout` (`size="narrow"` → `size="reading"`), and **neither consumer
  imports `Container` at all** — both reach it through templates, and
  `grep -rn 'size="narrow"'` finds nothing in either. A consumer that did pass
  the old name breaks as a **type error**, not silently. Earlier entries in
  this changelog still say `size="narrow"`; that is the historical record of
  what shipped then, not a live API.

  *Three tokens, one pattern.* `--max-width-container-content: 1000px` and
  `--max-width-container-reading: 42rem` join `--max-width-container-max`, and
  all three variants reference them as `max-w-(--max-width-container-*)` — the
  file previously mixed a token (`default`) with a bare Tailwind step
  (`narrow`). Tailwind 4 *does* generate `max-w-container-max` from the same
  token (measured, tailwindcss 4.3.2 against this package's `tokens.css`; the
  old comment in `container-variants.ts` claiming there is no `--max-width-*`
  namespace was wrong), but the arbitrary-variable form is the one to use
  because of **tailwind-merge**, which `cn()` runs on every `Container`:
  measured with tailwind-merge 3.6.0,
  `max-w-(--max-width-container-content) max-w-3xl` collapses to `max-w-3xl`,
  while `max-w-container-content max-w-3xl` keeps **both** classes — a custom
  theme key is not in its `max-w` conflict group, so a call site's own width
  would stop winning and CSS source order would decide. That mechanism is now
  pinned by the `CallSiteWidthStillWins` story. `reading` is in `rem` on
  purpose: it is a *text* measure and should scale with the user's font size,
  while `page`/`content` bound device space (cards, grids, tables).
  `--max-width-container-max` keeps its name although its variant is called
  `page`, because CampusAgents writes `max-w-container-max` in its own source
  and a rename would fail there silently.

  *Measured line lengths, so the next page picks the right width.* In Chromium,
  Inter 16px, German legal prose: `page` 1360px text measure → ~181
  characters/line, `content` 920px → ~121, `reading` 592px → ~74. WCAG 1.4.8
  (AAA) caps a line at 80, so **`content` is a page width, not a prose
  measure** — running text belongs in `reading`. Both numbers and the rule are
  in the new `container.mdx`, together with the reason not to reach for
  `className`; `COMPONENT_GUIDELINES.md` carries the short form as an
  enforceable rule.

  3 new story tests (391 → 394: `AllSizes`, `AllSizesDark`,
  `CallSiteWidthStillWins`), all asserting the **computed** `max-width` through
  the CSSOM rather than a class string — a class assertion would stay green if
  the utility compiled to nothing, which is the actual failure mode here.
  Mutation-verified: 4 mutations, 4 killed. The tag is a separate step.
- **0.24.0** — **one rule for the page heading, and every element with a
  user-agent margin now pins it.** Two findings from a consumer's template
  adoption, both confirmed by independent reviewers (KI-693/KI-714), fixed
  together on KI-736.

  *Who owns the page heading.* Eight templates had **four** behaviours: a
  `div` title (`AuthLayout`), a forced unreachable `<h1>`
  (`DashboardLayout`, `FormLayout`, `TableLayout`), a forced `<h1>` **plus** a
  hardcoded `<h2>` per section (`SectionedGridLayout`), and no heading at all
  (`AppShellLayout`, `ChatLayout`, `WorkspaceLayout`). The cost was already
  shipped: two admin pages that correctly adopted `DashboardLayout` came out
  with **two `<h1>`s**, because they render inside a frame whose own `<h1>` is
  the page title — a fresh WCAG 1.3.1 failure caused by using the library as
  documented. The rule is now written down (COMPONENT_GUIDELINES.md →
  "Page headings: who owns them"): a template renders its `title` as a real
  heading, and the call site owns the **level** through one prop,
  `headingLevel: 1 | 2 | 3 | 4 | 5 | 6` (new exported type `HeadingLevel`), on
  `PageHeader`, `DashboardLayout`, `FormLayout`, `TableLayout`,
  `SectionedGridLayout` and `AuthLayout`. A number and not `as="h2"` so the
  prop can never render a non-heading, and so a template with two heading roles
  can *derive* the inner one: `SectionedGridLayout`'s sections are
  `headingLevel + 1` (clamped at 6) instead of a second hardcoded level — that
  double behaviour was the bug. `CardTitle` gains `asChild` (new
  `CardTitleProps`) so a card title can be a heading where the card really is a
  titled section, while staying a `div` by default.

  **Purely additive: every default is frozen at today's output, and none of the
  365 pre-existing tests changed.** `PageHeader` and the three templates that
  use it still render `<h1>`; `SectionedGridLayout` still renders `<h1>` +
  `<h2>`; `AppShellLayout.pageLabel` stays a `<p>` (it is chrome — a location
  label, not the page heading, and an `<h1>` there would sit next to the content
  template's). `AuthLayout` is the one template that still contributes **no**
  heading by default, and not out of caution: a shipping consumer passes its own
  `<h1>` *element* into the `title` slot precisely because the slot never was a
  heading, so a default heading would nest one inside the other. Whether that
  default should flip to `1` in a future major is an owner decision and is open
  on the card.

  *Upgrading does not close the double-`<h1>` by itself — the fix is opt-in.*
  Frozen defaults are the paragraph above; this is their consequence. A
  template nested in a frame that already owns the page `<h1>` keeps emitting a
  second one after the pin bump, so the WCAG 1.3.1 failure described above
  stays live until the **call site** passes `headingLevel={2}` on the nested
  template. That one prop per nested page is the entire required action, and
  nothing in this release performs it. Pages that legitimately own their `<h1>`
  need no change — that is the trade the frozen defaults buy. The consumer that
  reported the defect has not adopted the prop (verified at the time of
  writing: zero `headingLevel` occurrences in its source), so on this release
  its two nested admin pages still carry two `<h1>`s.

  *The missing margin utilities.* `PageHeader`'s `<h1>` and `<p>` carried size,
  weight and colour but **no margin**, so an app that reverts element margins in
  `@layer base` (any app keeping its own prose styling next to Tailwind
  Preflight) leaked the user-agent margin into the component — **16.08 px** on
  the heading, measured in production and reproduced here. This refutes a claim
  a consumer's own `index.css` makes, that the revert cannot reach DS components
  because every DS element carries an explicit utility: true for size and
  weight, false for margin. An audit of **every** element this package renders,
  against the user-agent margins measured in Chromium, found **ten** such
  elements in six files — `PageHeader`'s heading and description, `CodeBlock`'s
  `<pre>`, `FormDescription` and `FormMessage`, `DialogTitle` (Radix renders an
  `<h2>`) and `DialogDescription` (a `<p>`), `ToastViewport` (Radix renders an
  `<ol>`, whose margin offsets a `bottom-0` fixed bar by 16 px),
  `AppShellLayout`'s page label, and `SectionedGridLayout`'s section heading.
  All ten now carry `m-0`, which sits in the `utilities` layer: it changes
  nothing where Preflight is intact, and it wins against a consumer's revert
  **as long as that revert is layered**. Being layered is the condition, not
  the `base` name — an unlayered declaration outranks every layered one of
  equal importance, so a reset written outside any `@layer` still defeats `m-0`
  (measured; only an `!important` utility would win there, and this package
  ships none). `@layer base` is the shape the measured consumer has, and the
  shape this release fixes. Everything else was measured clean: `TableCaption`
  already carried `mt-4`, and
  `<table>`/`<thead>`/`<tbody>`/`<tr>`/`<th>`/`<td>`/`<li>` plus every
  `div`/`span`/`button`/`input`/`label`/landmark element have a user-agent
  margin of zero. The invariant is now pinned by a
  `Foundations/UA-Margin-Reset` story that installs the reset the way a
  consuming app does (an `@layer base` `margin: revert`) and measures the
  computed margins in Chromium, with two **control** elements that must move —
  so a green run cannot mean the reset never arrived. The consumer can drop its
  `[&>header_h1]:m-0` workaround once it bumps the pin.

  *What a consumer actually sees on upgrade.* Exactly one of the ten moves
  visibly today, and it is not the one the 16.08 px figure points at:
  **`FormDescription` and `FormMessage`**. Both are `<p>` at `text-sm`, the
  measured consumer's field row renders both with no local margin workaround,
  and its `@layer base` revert reaches them — so help and error text loses
  1 em (**14 px**, measured in Chromium) above and below and tightens toward
  its field: the gap between an input and its help text goes 18 px → 4 px, and
  because `FormItem` is a flex column those margins never collapsed, so a row
  carrying both help and error text loses about 56 px of height. A wanted
  correction, but a visible one — re-check field spacing after the bump.
  `PageHeader`'s heading and description, where the 16.08 px was measured, will
  **not** move there: all three `DashboardLayout` call sites already carry
  `[&>header_h1]:m-0 [&>header_p]:m-0`, so this only makes those workarounds
  redundant. And `CodeBlock`'s `<pre>`, `DialogTitle`/`DialogDescription`,
  `ToastViewport`, `AppShellLayout`'s page label and `SectionedGridLayout`'s
  section heading have **no consumer today that reverts element margins** —
  their fix is prospective, right for the next adopter and a no-op now, which
  includes the concern that `ToastViewport`'s `m-0` would shift a fixed
  `bottom-0` toast stack by 16 px. That asymmetry is why one pair is named here
  instead of a list of ten.

  Also fixed: this repo's own `DashboardLayout` story jumped from the
  template's `<h1>` straight to `<h4>` on its card titles, which axe-core
  reported as `heading-order` on that story **and** on the `AppShellLayout`
  story that composes it. Both were on the pre-existing-axe-failures list; both
  are gone (measured with axe-core 4.12.1, `heading-order` now returns zero
  violations on both stories). The `color-contrast` finding on the same story's
  `.opacity-70` line is deliberately untouched — that belongs to the axe card,
  and the a11y gate stays at `test: 'todo'`.

  26 new tests (365 → 391), all mutation-verified: 31 mutations, 31 killed.
  The version bump and tag are a separate step.
- **0.24.0** — `AuthLayout` gets a **`width` prop**, because its column
  width was unreachable from every call site: the `max-w-md` sat on the inner
  column while a consumer's `className` merges into the root element. A
  consumer's legal pages (terms of use, accessibility statement, privacy
  statement) silently went 720px → 448px on adopting the template, and the
  width was rejected at visual QA. Two named steps on `authLayoutVariants`
  (new export), both Tailwind steps rather than arbitrary values:
  `default` = `max-w-md` (448px, **unchanged** — no existing login page moves)
  and `prose` = `max-w-2xl` (672px) for long-form copy inside the card.
  `max-w-2xl` and not `max-w-3xl` for two independent reasons: it is the step
  this system already names for a reading column (`Container size="narrow"`
  *is* `max-w-2xl`, so a wide `AuthLayout` matches a `FormLayout` column
  instead of inventing a second reading width), and WCAG 1.4.8 (AAA) caps a
  line at 80 characters — minus the Card's `p-6` the text measure is 624px at
  `2xl` against 720px at `3xl`. So `prose` is deliberately 48px *narrower*
  than the 720px it replaces. Purely additive: no existing prop, class or
  export changes. Four new stories (both widths × both themes, the long-prose
  legal case included, plus the rejected 448px state kept for comparison)
  measure the **computed** `max-width` through the CSSOM in Chromium rather
  than asserting a class string. `AuthLayout` is the **only** template with
  this defect — the other five take their width from `Container`, where
  `className` reaches it. The version bump and tag are a separate step.
- **0.23.0** — *Skipped.* The tag was pushed at the commit before the release
  commit (the version bump had been rejected by the commit-msg hook), so
  `v0.23.0` points at a tree whose `package.json` still reads `0.22.1`. Tags
  that are already public are not moved; the release went out as 0.23.1
  instead. `v0.23.0` carries the same component code and is safe but
  mislabelled — do not pin it.
- **0.23.1** — The release JustRAG's adoption waits on: six new exports plus
  consumer-controllable theming. **New primitives:** `Tabs` (APG tabs pattern),
  `Table` (shadcn shape, deliberately no sticky header), `Tooltip` (APG tooltip
  pattern), and the three pane primitives `SidePanel`, `ResizeHandle`,
  `BottomTabBar` — the parts JustRAG hand-built as `SidebarShell`, two inline
  resize handles and `MobileTabBar`. `ResizeHandle` carries
  `role="separator"` + `aria-controls`, completing the APG Window Splitter
  pattern. **New templates:** `WorkspaceLayout` (3-pane workspace with mobile
  pane switching; **standalone by design** — never nested in `AppShellLayout`,
  where two chrome columns would collide) and `SectionedGridLayout` for grouped
  collapsible card grids. Consumer-controllable theming + overridable a11y
  labels (KI-562, unblocks the bilingual JustRAG). **ThemeProvider controlled
  mode:** new optional props `theme` + `onThemeChange` (consumer owns the state; the
  provider reads/writes no localStorage, still resolves "system" and stays the
  single writer of `<html data-theme>`) and `storageKey` (uncontrolled
  localStorage key, default `"theme"`). Uncontrolled behavior is unchanged.
  **Label props** (defaults = previous hardcoded German strings, zero breaking
  change, following the `navLabel` precedent): `AppShell` `menuLabel` /
  `drawerLabel` (forwarded by `AppShellLayout`), `DialogContent` `closeLabel`,
  `ThemeToggle` `themeLabel`/`lightLabel`/`systemLabel`/`darkLabel`, `Avatar`
  `onlineLabel`. Migration paths + recommendation for apps with their own
  theme context in Storybook „Theming".
- **0.22.1** — Tooling and docs round, opening the JustRAG adoption. **No
  change to the published surface:** `dist/` components and `src/tokens.css`
  are untouched, which is why this is a patch — `components.json` and the
  `@/*` alias are repo tooling and are not in `package.json`'s `files` list.
  **shadcn CLI wired** (`components.json` + the `@/*` path alias in
  `tsconfig.json`/`vite.config.ts`), so `npx shadcn@latest add <component>`
  works in this repo. **Canonical normalisation docs** in
  COMPONENT_GUIDELINES.md → „Generating a component with the shadcn CLI": a
  28-row shadcn→JLU token mapping table (every token grep-verified against
  `src/tokens.css`; `chart-5` and the whole `sidebar-*` family are recorded as
  *absent* rather than mapped to an invented name), the rule that the CLI's
  token injection into `src/tokens.css` is always reverted plus three guardrail
  greps, and the post-generation checklist as six ordered steps. §4 and §6 now
  reference that one copy instead of restating it (and a wrong „see §3"
  cross-reference is fixed). Two traps recorded while verifying: `rounded-md`
  and `rounded-sm` *compile* from Tailwind's default theme and are therefore
  silent non-tokens, and `--color-secondary` / `--color-on-secondary` exist but
  have no dark-block override and no component using them — the secondary
  action pair is `secondary-container` / `on-secondary-container`. Also
  app-neutral fixtures in the remaining stories and tests.
- **0.22.0** — *(backfilled: this release shipped without a changelog entry,
  contrary to the rule at the top of this section — reconstructed from
  `v0.21.0..v0.22.0`.)* App-chrome redesign round (PR #4). **Theming:**
  white/black chrome surfaces, dimmer dividers, filled fields. **`Card`:**
  `interactive` hover now highlights the border instead of moving the card (no
  layout shift). **`DashboardLayout`:** toolbar above the header, narrow-safe
  demo cards. **`AppShellLayout`:** new `pageLabel` bar with the `ThemeToggle`
  on the right. **New component `SidebarUserMenu`** (name, role, chevron).
  **Storybook:** generic demo copy instead of CampusAgents branding.
- **0.21.0** — Consumer-integration round, from the JustRAG token migration.
  **Install without a token:** added `prepare` to `package.json`, so
  `npm install github:KI4JLU/JLU-Design-System#v0.21.0` builds `dist/` on
  install. `npm.pkg.github.com` requires auth even for public packages; the
  git path needs no registry, no PAT, no `.npmrc` (see README). Note that
  `prepare` also runs on every local `npm install`/`npm ci` in this repo.
  **Visual delta (dark mode):** `--color-primary` now flips to a light accent
  in dark (`blue-200`) with `--color-on-primary` = `blue-900`, and
  `primary-hover`/`-active` move one step lighter (`blue-100`/new `blue-50`
  primitive). Previously `--color-primary` stayed `#0056b3` in both themes
  while hover/active already lightened — self-contradictory, and `text-primary`
  on a dark surface scored 1.4:1–2.6:1 depending on the container. Now 10.8:1
  as text on `surface` (worst case 6.6:1 on `surface-container-highest`) and
  9.8:1 as a filled surface. Affects Button, NavItem, ChatBubble, Checkbox, Switch,
  SegmentedControl in dark; all Chromatic dark baselines change.
  `--color-primary-container` is deliberately untouched.
  **Elevation:** fourth step `shadow-modal` (Dialog + AppShell drawer, which
  previously shared `shadow-overlay` with dropdowns), and all four steps now
  gain opacity in dark (0.05 → 0.4 on step 1). The values moved into an
  `--elevation-*` ramp because Tailwind *inlines* `@theme` shadow values
  instead of referencing them — a `--shadow-*` override in
  `[data-theme="dark"]` would have had no effect. Colors are unaffected
  (`bg-primary` does compile to `var(--color-primary)`).
  **Scrim:** new `--color-scrim` token; `Dialog` uses `bg-scrim/50` instead of
  `bg-black/50`, and `no-hardcoded-colors` now flags translucent
  `bg-black/<n>` (opaque `black`/`white` stay allowed).
  **No `--color-*-rgb` tokens:** documented `color-mix(in srgb, …)` and
  `bg-primary/10` as the way to build tints, since a mirrored RGB triplet
  would have to be hand-synced with the primitive and would go stale silently.
- **0.20.0** — Added `FilterMenu` (labeled filter/sort dropdown button,
  `src/components/filter-menu.tsx`) and `ListToolbar` (responsive
  search + filter/sort row, `src/components/list-toolbar.tsx`).
  `DashboardLayout` gained a `toolbar` slot (rendered through `PageHeader`'s
  existing children slot — the same contract `TableLayout.toolbar` already
  had). Replaces CampusAgents' hand-rolled `SearchToolbar`/`ToolbarDropdown`
  composition (Connector dashboard) with one documented pattern now shared by
  the Connector and Agent dashboards.
- **0.19.0** — Layout layer: primitives `Stack`, `Grid`, `Container`,
  `PageHeader`, `Sidebar`, `AppShell` (token-only layout values, responsive
  behavior built in — sidebar collapses into a Radix-Dialog drawer below lg)
  and page templates `AppShellLayout`, `AuthLayout`, `DashboardLayout`,
  `FormLayout`, `ChatLayout`, `TableLayout` under `src/templates/` (slot-based,
  layout-composition only). Storybook group `Templates/` with portable-story
  content + MDX docs per template; Chromatic workflow with a per-template mode
  matrix (light/dark × desktop/mobile); template contribution process in §6.
  `cn()` classGroups extended with the named spacing tokens (`gap-stack-md` vs
  `gap-gutter` now merge correctly). New `Logo` component formalizes the
  platform wordmark („JLU [CampusAgents]" / „JLU [API]" / „JLU [RAG]") — used
  in the AppShell/Auth logo slots. New **brand tokens** carry the brand
  template's exact values: primitives `--p-blue-700` (#0056b3) /
  `--p-blue-800` (#003366); semantic `--color-brand` + `--color-on-brand`
  (badge, deliberately theme-invariant like `code-surface`) and
  `--color-brand-wordmark` (#003366 light / `--p-gray-125` dark). The brand
  blue is also the new **primary base**: every semantic token that referenced
  `--p-blue-600` (#0052ff) — `primary`, `primary-container`, `surface-tint`,
  `focus-ring`, `chart-1`, dark `chart-2` — now points at `--p-blue-700`
  (#0056b3), so brand and primary action share one color. Visual delta:
  primary buttons/active nav shift from vivid blue to the deeper brand blue
  (white-on-primary contrast improves). `--p-blue-600` stays in the palette,
  currently unreferenced. AuthLayout's primary documented pattern is SSO
  (OIDC/Keycloak, single sign-in button); email/password is the local-account
  fallback. *(Entries 0.9.0–0.18.1 were tracked on the board and in
  Storybook; this file's changelog resumes here.)*
- **0.8.1** — `layout-only-classname` refinement: single-side paddings
  (`pl-9` icon insets) count as layout and are no longer flagged; only
  symmetric `p-/px-/py-` shrinking is skin.
- **0.8.0** — New lint rule `design-system/layout-only-classname` (warn):
  skin classes on design-system controls (paddings, font sizes/families,
  line-height, wrap/truncate) are flagged — className is layout-only, and
  controls are never shrunk to fit (guidelines rules 4+5, prompted by the
  squeezed three-button footer on the connector cards).
- **0.7.0** — Transferred former call-site exceptions into the system:
  Button `destructive-outline`, Input/Textarea `inline` variant (shared
  `fieldVariants` cva), `CodeBlock` (token-backed fixed-dark code viewer with
  copy), `SegmentedControl`. New `code-surface` tokens (deliberately
  theme-invariant — no dark-block override).
- **0.6.0** — Added `Badge`: the status chip. `tone` speaks the semantic
  status vocabulary, `appearance` covers both recurring shapes — filled
  container pill (status labels, KPI deltas) and inline tone-colored
  icon+text (health checks). Replaces hand-rolled chips in CampusAgents.
- **0.5.1** — Default `--radius-action` changed from `full` to `lg`: stock
  buttons keep their familiar rounding and the sidebar NavItems adopt it —
  the first real use of the one-dial radius token.
- **0.5.0** — Semantic control radii: new tokens `--radius-action`
  (Button + NavItem, default `full`) and `--radius-field` (Input/Textarea,
  default `lg`). One token edit now changes the radius of all action controls
  together. Visual delta: stock buttons are pill-shaped (previously
  `rounded-lg`), matching the sidebar and the app's dominant pattern.
- **0.4.0** — Added `MenuItem`: the standard row for dropdown menus,
  comboboxes, and popover menus (`selected`, keyboard `highlighted`,
  `destructive`, `asChild`). Replaces four almost-identical hand-rolled row
  styles in CampusAgents (filter/sort dropdowns, model combobox, sidebar user
  menu) with one documented look.
- **0.3.0** — Added `NavItem` (sidebar/menu navigation row): levels top/sub,
  active state with `aria-current="page"`, `asChild` for router links.
  Formalizes the CampusAgents sidebar pattern so apps carry no skin classes
  and Storybook matches the apps 1:1. New rule documented in
  COMPONENT_GUIDELINES: `className` on shared components is layout-only.
- **0.2.1** — Fix: `cn()` now uses `extendTailwindMerge` configured with our
  custom font-size scale (`text-body-base`, `text-label-sm`, …) and elevation
  shadows. Plain tailwind-merge lumped custom sizes and custom colors into one
  conflict group and silently dropped color classes (nav buttons lost their
  active `text-on-primary`, so currentColor icons didn't invert). Regression
  tests added. **Keep the classGroups lists in sync when adding scale tokens.**
- **0.2.0** — Added `Switch` (Radix) and `Textarea` components (+ stories,
  tests). New chart-series tokens `--color-chart-1..4` + `--color-chart-track`
  (light + dark; new primitive `--p-blue-300`) so SVG charts in consumers can
  drop hardcoded hex and become theme-aware.
- **0.1.0** — Extraction (Phase 5): moved tokens, the 7 components, theme
  runtime, and the ESLint plugin out of CampusAgents into this package.
  Replaced Ladle with Storybook (autodocs, a11y addon, MDX docs, theme
  toolbar). Added unit tests (Button, Form a11y wiring) and CI + publish
  workflows. No component/token changes — value-exact move.
- **Phase 4** (in CampusAgents) — Enforcement layer: ESLint plugin
  (`no-hardcoded-colors` = error, `no-raw-ui-elements` = warn) wired into CI
  lint; Ladle workbench; CODEOWNERS review gate.
- **Phase 3** — Theme switching (light/dark/system via `ThemeProvider` +
  `ThemeToggle`, `data-theme` on `<html>`, no-flash script). Migrated all
  CampusAgents screens to shared components + semantic tokens. Wrote
  [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md).
- **Phase 2** — Shared UI components on shadcn/ui patterns (Button, Card,
  Input, Label, Dialog, Form field primitives), styled with semantic tokens;
  Radix primitives installed. First screens migrated.
- **Phase 1** — Two-layer refactor completed: all light + dark semantic color
  tokens reference primitives (`var(--p-*)`); zero literal hex left in the
  semantic layer.
- **Phase 0** — Primitive/semantic token layering; status, interaction-state,
  and elevation tokens; shadcn/ui foundation (`cn()`, `components.json`);
  governance doc authored.

---

## Roadmap

| Phase | Scope |
|-------|-------|
| **0–4** *(done, in CampusAgents)* | Token layering, core components, full app migration, theming, governance + enforcement tooling. |
| **5 — Extraction** *(done: v0.1.0, this repo)* | Tokens + component lib + eslint plugin extracted to `@ki4jlu/design-system`, published via GitHub Packages, documented with Storybook. |
| 6 — Growth | Missing primitives (Switch, Textarea, Select/Combobox), chart-series tokens, consumer migrations (CampusAgents raw controls, widget.js token alignment). Style Dictionary only if non-Tailwind targets appear. |
