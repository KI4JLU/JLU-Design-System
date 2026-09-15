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
| `NavItem` (+ `navItemVariants`) | `nav-item.tsx` / `nav-item-variants.ts` | sidebar/menu row: `level` top/sub, `active` sets `aria-current="page"`; `asChild` for router links |
| `SegmentedControl` | `segmented-control.tsx` | single-select segment row (e.g. Tag/Woche/Monat chart-range switch): controlled `value`/`onValueChange`, `role="group"`, active segment via `aria-pressed` |
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
| `Grid` (+ `gridVariants`) | `grid.tsx` / `grid-variants.ts` | responsive grid: `cols` 1–4 is the **desktop** count, the mobile collapse (→1) is built in |
| `Container` (+ `containerVariants`) | `container.tsx` / `container-variants.ts` | centered page column: `px-gutter md:px-margin-page`; `size` names the page's role — `page` (1440px, default), `content` (1000px), `reading` (672px), all three from `--max-width-container-*`. Never a `max-w-*` at the call site |
| `PageHeader` | `page-header.tsx` | `<h1>` (headline tokens, mobile size below md) + description + right-aligned `actions`; `children` = toolbar row below |
| `Sidebar` | `sidebar.tsx` | structural nav column: `header`/`footer` slots, scrollable `<nav aria-label>` for NavItems; positioning/drawer live in AppShell |
| `AppShell` | `app-shell.tsx` | responsive frame: sticky sidebar ≥ lg, below lg top bar + left drawer (Radix Dialog — focus trap, Escape); link click closes the drawer; a11y labels overridable (`menuLabel` default „Navigation öffnen", `drawerLabel` default „Navigation") — `AppShellLayout` forwards both |
| `SidePanel` | `side-panel.tsx` / `side-panel-variants.ts` | controlled collapsible pane frame: `side` left/right, `isOpen`, `width`, collapsed rail (`SIDE_PANEL_RAIL_WIDTH` = 60px) with an `collapsedPreview` slot. The collapse/expand control belongs to the frame — it is the only control that exists while collapsed. Children stay mounted but leave the accessibility tree, so scroll position and half-typed input survive a collapse. No viewport awareness: which pane is rendered is the template's job |
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
  its text slots (`AppShellLayout.pageLabel`) are chrome, not the page heading.
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
  390 px is below the `lg` breakpoint where sidebars collapse into the drawer.

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
