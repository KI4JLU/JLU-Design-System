# Component Usage Guidelines

How to build UI in this app. These are enforceable rules — PRs that violate them
should be sent back. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for tokens and
governance.

## The three rules

1. **Use shared components.** Reach for `@ki4jlu/design-system` (Button, Card, Input,
   Label, Dialog, Form field primitives) instead of raw `<button>` / `<input>` /
   ad-hoc card `<div>`s. A raw control needs a one-line justification in the PR.
2. **No hardcoded colors.** Every color goes through a semantic token
   (`bg-primary`, `text-on-surface`, `border-outline-variant`, `bg-success`, …).
   Never `bg-blue-500`, `text-gray-700`, `#0052ff`, `green-600`, etc.
3. **No manual `dark:` color variants.** Tokens switch with the theme
   automatically. `dark:` is only for the rare non-color tweak.
4. **`className` on shared components is layout-only** (width, margins, grid
   placement, `ml-auto`). Never re-skin a component at the call site (colors,
   padding, typography) — that makes the app diverge from Storybook. If a
   component doesn't look right, add/change a variant in the design system;
   Storybook and every app then stay 1:1. Enforced by
   `design-system/layout-only-classname` (warn).
5. **Controls are never shrunk to fit.** A button's label must fit at its
   stock size — no `leading-tight`, `break-words`, `truncate`, or crushed
   paddings to squeeze it in. If the space can't hold the actions, reduce the
   number of actions or switch to icon buttons with `aria-label`. (Origin:
   three squeezed footer buttons on the connector cards.)

## Colors → tokens cheat sheet

| Need | Token utility |
|------|---------------|
| Page / app background | `bg-surface` (text `text-on-surface`) |
| Card / raised panel | `bg-surface-container-lowest` + `border-outline-variant` (use `<Card>`) |
| Muted/secondary text | `text-on-surface-variant` |
| Primary action | `bg-primary text-on-primary` (use `<Button>`) |
| Secondary action | `bg-secondary-container text-on-secondary-container` |
| Borders / dividers | `border-outline-variant` (stronger: `border-outline`) |
| Focus ring | `ring-focus-ring` (shared components already do this) |
| Success / online | `bg-success` / `text-success`; soft badge: `bg-success-container text-on-success-container` |
| Info / pending | `text-info` / `bg-info-container text-on-info-container` |
| Warning | `text-warning` / `bg-warning-container text-on-warning-container` |
| Error / destructive | `text-error`; button: `<Button variant="destructive">` |
| Brand wordmark (use `<Logo>`) | `text-brand-wordmark` (prefix) + `bg-brand text-on-brand` (badge); badge is theme-invariant |
| Elevation | `shadow-card`, `hover:shadow-card-hover`, `shadow-overlay` |

If you need a color with no matching token, **don't invent a hex** — propose a new
token via the process in DESIGN_SYSTEM.md §6.

## Button

```tsx
import { Button } from "@ki4jlu/design-system";

<Button onClick={save}>Speichern</Button>                 // primary
<Button variant="secondary">Abbrechen</Button>
<Button variant="outline" size="sm">Filter</Button>
<Button variant="ghost" size="icon" aria-label="Menü"><Icon name="menu" /></Button>
<Button variant="destructive">Löschen</Button>

// Render a router Link with button styling:
<Button asChild variant="outline">
  <Link to="/widgets/1">Öffnen</Link>
</Button>
```
- Variants: `default` (primary) · `secondary` · `outline` · `ghost` · `destructive` · `link`.
- Sizes: `default` · `sm` · `lg` · `icon`.
- Icon-only buttons **must** have an `aria-label`.
- To style variants elsewhere, import `buttonVariants` from
  `@ki4jlu/design-system-variants` (not from `button.tsx`).

## Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@ki4jlu/design-system";

<Card>
  <CardHeader>
    <CardTitle>Titel</CardTitle>
    <CardDescription>Untertitel</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>…</CardFooter>
</Card>
```
`Card` has **no padding** by default — use the sub-parts (each `p-6`) or add
`className="p-6"`. It defaults to `rounded-xl`; override with `className="rounded-2xl"`.

## Forms (Input + Label + Form field primitives)

```tsx
import { Input } from "@ki4jlu/design-system";
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@ki4jlu/design-system";

<FormItem error={errors.email}>
  <FormLabel>E-Mail</FormLabel>
  <FormControl>
    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
  </FormControl>
  <FormDescription>Wir teilen sie nicht.</FormDescription>
  <FormMessage />           {/* renders errors.email when set */}
</FormItem>
```
- `FormItem` generates the id and lays out the field (`flex flex-col gap-1`).
- `FormLabel` binds `htmlFor` automatically; `FormControl` injects `id`,
  `aria-invalid`, and `aria-describedby` onto its single child control.
- Pass the current error string to `FormItem error=` — it drives `aria-invalid`,
  the label/error color, and `FormMessage`.
- This is intentionally **not** react-hook-form. If a form needs schema
  validation, adopt RHF + zod behind these same call sites.
- A standalone label (no field wrapper) → `<Label htmlFor="…">`.

## Dialog

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@ki4jlu/design-system";

<Dialog>
  <DialogTrigger asChild><Button>Öffnen</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Titel</DialogTitle>
      <DialogDescription>Beschreibung</DialogDescription>
    </DialogHeader>
    …
    <DialogFooter>
      <Button variant="secondary">Abbrechen</Button>
      <Button>Bestätigen</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```
Radix gives focus trap, Escape-to-close, scroll lock, and ARIA roles for free —
**always** use this instead of a hand-rolled modal. Every dialog needs a
`DialogTitle` (screen-reader requirement); a close "X" is included automatically.

## Layout & Templates

Pages are **assembled, not laid out by hand**:

```tsx
import { AppShellLayout, DashboardLayout, Grid, Stack } from "@ki4jlu/design-system";

<AppShellLayout logo={<Brand />} nav={<NavItems />} sidebarFooter={<UserMenu />}>
  <DashboardLayout title="Statistiken" actions={<RangeSwitch />} stats={<KpiCards />}>
    <Grid cols={2}>…</Grid>
  </DashboardLayout>
</AppShellLayout>
```

- **Use the templates** (`AppShellLayout`, `AuthLayout`, `DashboardLayout`,
  `FormLayout`, `ChatLayout`, `TableLayout`) for their page category — never
  rebuild a page skeleton in the app. Missing slot/variant? Extend the template
  in the design system (owner review), don't fork the layout.
- **Spacing through primitives**: gaps/rhythm via `Stack`/`Grid` `gap`
  (`sm|md|lg|gutter` = spacing tokens), page margins via `Container` — no
  ad-hoc `gap-[13px]` or hand-rolled breakpoint ladders; `Grid cols` already
  collapses responsively.
- Templates carry **no business logic**: routing lives in the injected
  `NavItem`s, form state in the app (`FormLayout` renders no `<form>` — wrap
  your own around it), chat state in the widget.
- Storybook group `Templates/` documents each template's slots, responsive
  behavior, and do's/don'ts.

## Theming

- The active theme is on `<html data-theme="light|dark">`, set by
  [`ThemeProvider`](../src/theme/ThemeContext.tsx) and a no-flash script in
  `index.html`. Users switch it with [`ThemeToggle`](../src/components/theme-toggle.tsx).
- Because tokens carry the theme, **components need no theme awareness** — style
  with tokens and both themes work. Verify new screens in **both** themes.
- Read the current theme with `useTheme()` only when logic truly depends on it
  (e.g. a third-party embed that needs an explicit color) — not for styling.

## Accessibility checklist (every interactive UI)

- Icon-only controls have `aria-label`.
- Inputs have a real label (via `FormLabel`/`Label`), and errors are linked
  (`FormItem error=` → `aria-describedby`/`aria-invalid`).
- Visible focus (shared components ship `focus-visible:ring-focus-ring`).
- Dialogs/menus: keyboard operable, Escape closes, focus is trapped/restored.
- Contrast passes in both themes.
