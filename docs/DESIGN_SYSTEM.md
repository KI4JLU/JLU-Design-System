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
  **light / dark / system** — persists it to `localStorage` ("theme"), and
  tracks the OS setting while on "system". Consumers add the no-flash inline
  script to their `index.html` **before first paint** (see Storybook
  „Theming"; keep it in sync with the provider). Users switch via
  [`ThemeToggle`](../src/components/theme-toggle.tsx).
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
| `Dialog` (+ parts) | `dialog.tsx` | Radix — focus trap, Esc-to-close, ARIA, scroll lock |
| Form field primitives | `form.tsx` | `FormItem/FormLabel/FormControl/FormDescription/FormMessage`; a11y label + `aria-describedby`/`aria-invalid` wiring; **no** react-hook-form (add later if forms need schema validation) |
| `MenuItem` (+ `menuItemVariants`) | `menu-item.tsx` / `menu-item-variants.ts` | dropdown/listbox/popover row: `selected`, `highlighted` (keyboard), `destructive`; ARIA roles stay at call sites |
| `NavItem` (+ `navItemVariants`) | `nav-item.tsx` / `nav-item-variants.ts` | sidebar/menu row: `level` top/sub, `active` sets `aria-current="page"`; `asChild` for router links |
| `SegmentedControl` | `segmented-control.tsx` | single-select segment row (e.g. Tag/Woche/Monat chart-range switch): controlled `value`/`onValueChange`, `role="group"`, active segment via `aria-pressed` |
| `Switch` | `switch.tsx` | Radix Switch — role="switch", keyboard toggle; pair with `Label`/`FormControl` |
| `Textarea` (+ shared `fieldVariants`) | `textarea.tsx` / `field-variants.ts` | mirrors `Input` (tokens, focus ring, `aria-invalid`); `variant`: default / inline (composer in a Card); `min-h-24`/`resize-y` only in default |
| `ThemeToggle` | `theme-toggle.tsx` | segmented light/system/dark switch on the theme runtime |

*(Inventory above predates v0.9.0; Avatar, Badge dot, ChatBubble, Checkbox,
DropdownMenu, Popover, Select, Spinner are documented in Storybook and the
Changelog cards on the board.)*

### Layout primitives (`src/components/`)
Layout values come **only** from tokens (spacing `stack-*`/`gutter`/
`margin-page`, `container-max`, radius, colors) — no raw pixel values.

| Component | File | Notes |
|-----------|------|-------|
| `Stack` (+ `stackVariants`) | `stack.tsx` / `stack-variants.ts` | 1-D flex: `direction` column/row, `gap` = spacing tokens, align/justify/wrap; `asChild` for semantic elements |
| `Grid` (+ `gridVariants`) | `grid.tsx` / `grid-variants.ts` | responsive grid: `cols` 1–4 is the **desktop** count, the mobile collapse (→1) is built in |
| `Container` (+ `containerVariants`) | `container.tsx` / `container-variants.ts` | centered page column: `px-gutter md:px-margin-page`, max `container-max`; `size="narrow"` for forms |
| `PageHeader` | `page-header.tsx` | `<h1>` (headline tokens, mobile size below md) + description + right-aligned `actions`; `children` = toolbar row below |
| `Sidebar` | `sidebar.tsx` | structural nav column: `header`/`footer` slots, scrollable `<nav aria-label>` for NavItems; positioning/drawer live in AppShell |
| `AppShell` | `app-shell.tsx` | responsive frame: sticky sidebar ≥ lg, below lg top bar + left drawer (Radix Dialog — focus trap, Escape); link click closes the drawer |
| `SidePanel` | `side-panel.tsx` / `side-panel-variants.ts` | controlled collapsible pane frame: `side` left/right, `isOpen`, `width`, collapsed rail (`SIDE_PANEL_RAIL_WIDTH` = 60px) with an `collapsedPreview` slot. The collapse/expand control belongs to the frame — it is the only control that exists while collapsed. Children stay mounted but leave the accessibility tree, so scroll position and half-typed input survive a collapse. No viewport awareness: which pane is rendered is the template's job |
| `ResizeHandle` | `resize-handle.tsx` / `resize-handle-variants.ts` | accessible pane resizer: focusable `role="separator"` (WAI-ARIA APG „Window Splitter") with `aria-valuemin/max/now`, clamped, and `aria-orientation="vertical"` for the bar itself (not the role's default). Arrow keys move by `step` (default 10) **mirrored per side** — a left pane grows on `→`/`↑`, a right pane on `←`/`↓`; Home/End are min/max values and are deliberately *not* mirrored. Owns its pointer-drag loop and reports through one `onValueChange`. See „Entschieden: `separator` statt `slider`" in the MDX — role **and** vertical mirroring were one decision and are both settled (owner, 08/2026); `aria-controls` is the one *required* APG piece still missing (`Enter` is optional in the pattern) |
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
- **Visual regression** — Chromatic
  ([`.github/workflows/chromatic.yml`](../.github/workflows/chromatic.yml)):
  snapshots every story on each PR; template stories additionally in a mode
  matrix (light/dark × desktop/mobile, `src/templates/chromatic-modes.ts`), so
  layout regressions are caught at the **composition** level, not only per
  component. Changed snapshots fail the check until the owner accepts them in
  the Chromatic UI. One-time setup: add the repo secret
  `CHROMATIC_PROJECT_TOKEN` (job skips while it's missing).

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
   MDX page (slots/props, responsive behavior, do's/don'ts). Set
   `chromatic: { modes: templateChromaticModes }` so the template is
   snapshotted in both themes and at mobile width.
4. **No template is used in an app before its PR is reviewed** (CODEOWNERS
   requests the owner) **and its Chromatic snapshots are accepted.** Both-theme
   visual QA (§3) applies.

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
