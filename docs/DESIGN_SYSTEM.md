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
  `disabled`, `on-disabled`.
- **Elevation** — `shadow-card`, `shadow-card-hover`, `shadow-overlay`.
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
- New components follow shadcn/ui patterns (Radix primitives + cva + tokens).
  Components generated with `npx shadcn@latest add <component>` ship with
  shadcn's own token names (`bg-background`, `text-primary-foreground`, …) —
  **re-point them to our semantic tokens** (`bg-surface`, `text-on-primary`, …)
  before merge, so there is one vocabulary.
- `cva` variant maps live in a sibling `*-variants.ts` file (see
  [`button-variants.ts`](../src/components/button-variants.ts)), not in the
  component file, to satisfy react-refresh's "only export components" rule.

### Shared component inventory (`src/components/`)
| Component | File | Notes |
|-----------|------|-------|
| `Badge` (+ `badgeVariants`) | `badge.tsx` / `badge-variants.ts` | status chip: `tone` = neutral/primary/secondary/success/warning/error/info; `appearance` = filled pill or inline text |
| `Button` (+ `buttonVariants`) | `button.tsx` / `button-variants.ts` | variants: default/secondary/outline/ghost/destructive/link; sizes: default/sm/lg/icon; `asChild` via Radix Slot |
| `Card` (+ Header/Title/Description/Content/Footer) | `card.tsx` | surface + border + `shadow-card` |
| `Input` | `input.tsx` | honors `aria-invalid` styling |
| `Label` | `label.tsx` | Radix Label |
| `Dialog` (+ parts) | `dialog.tsx` | Radix — focus trap, Esc-to-close, ARIA, scroll lock |
| Form field primitives | `form.tsx` | `FormItem/FormLabel/FormControl/FormDescription/FormMessage`; a11y label + `aria-describedby`/`aria-invalid` wiring; **no** react-hook-form (add later if forms need schema validation) |
| `MenuItem` (+ `menuItemVariants`) | `menu-item.tsx` / `menu-item-variants.ts` | dropdown/listbox/popover row: `selected`, `highlighted` (keyboard), `destructive`; ARIA roles stay at call sites |
| `NavItem` (+ `navItemVariants`) | `nav-item.tsx` / `nav-item-variants.ts` | sidebar/menu row: `level` top/sub, `active` sets `aria-current="page"`; `asChild` for router links |
| `Switch` | `switch.tsx` | Radix Switch — role="switch", keyboard toggle; pair with `Label`/`FormControl` |
| `Textarea` | `textarea.tsx` | mirrors `Input` (tokens, focus ring, `aria-invalid`) |
| `ThemeToggle` | `theme-toggle.tsx` | segmented light/system/dark switch on the theme runtime |

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
- **Component workbench & docs** — Storybook (`npm run storybook`): autodocs
  props tables, a11y addon, MDX pages (Einführung / Tokens / Theming), theme
  toolbar switching light/dark/system live via the real ThemeProvider.
- **Review gate** — [`.github/CODEOWNERS`](../.github/CODEOWNERS).

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
1. Prefer `npx shadcn@latest add <component>`; style with tokens only.
2. Meet the accessibility bar (§5). Add a test where behaviour is non-trivial.
3. Add a `*.stories.tsx` next to the component (Storybook is the documentation).
4. New variants need explicit owner review.

---

## 7. Versioning & Changelog

Semantic versioning, published to GitHub Packages via the release workflow
(push a `v*` tag). Consumers pin a semver range. Record every token/component
change here.

### Changelog
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
