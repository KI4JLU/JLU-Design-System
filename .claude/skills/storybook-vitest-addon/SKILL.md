---
name: storybook-vitest-addon
description: Install, configure, or troubleshoot @storybook/addon-vitest (runs stories as Vitest browser tests). Use when adding the addon to a Storybook+Vite project, when story tests fail with "does not provide an export named" errors, when sidebar test statuses look wrong/stuck, when a11y warnings need to be inspected, or when the vitest projects config in vite.config.ts needs adjusting.
---

# Storybook Vitest Addon (install & troubleshoot)

The addon runs every story as a Vitest browser-mode test (headless Chromium via
Playwright), including a11y checks when `@storybook/addon-a11y` is present.
In this repo it is already installed — use this skill to troubleshoot or to
replicate the setup in another project.

## Install

1. Prerequisites: Storybook ≥ 9 with a Vite-based framework (here:
   `@storybook/react-vite`) and Vitest ≥ 3.
2. Run the official installer — do NOT wire it up by hand:
   ```sh
   npx storybook add @storybook/addon-vitest --yes
   ```
   It installs `@vitest/browser-playwright`, `@vitest/coverage-v8`,
   `playwright` (+ Chromium binaries), registers the addon in
   `.storybook/main.ts`, and rewrites the vitest config into a
   `test.projects` array.
3. Review the merged `vite.config.ts`: any pre-existing `test` config must
   survive as its own project entry (`extends: true`), with the new
   `storybook` project alongside it. The installer does this correctly, but
   verify it didn't drop custom fields (setupFiles, include globs).
4. Verify: `npm test` must pass BOTH projects — the unit tests and one test
   per story. Don't stop at "the addon loads".

## Known pitfall: CJS deps in browser mode

Symptom: every `*.stories.tsx` file fails with
`SyntaxError: The requested module '.../aria-query/...' does not provide an
export named 'elementRoles'` (or similar named-export errors from other
packages).

Cause: Vitest browser mode serves modules through Vite's dev server. CJS-only
packages (e.g. `aria-query`, imported by `@testing-library/dom`) can't expose
named exports unless Vite pre-bundles them.

Fix: add the offending package and its importers to `optimizeDeps.include`
**inside the storybook project entry** in `vite.config.ts`:

```ts
{
  extends: true,
  plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
  optimizeDeps: {
    include: ["aria-query", "@testing-library/dom", "@testing-library/user-event"]
  },
  test: { name: 'storybook', browser: { /* ... */ } }
}
```

For new named-export errors, identify the CJS package from the error message
and append it (plus the package that imports it) to the same list.

## Running

- Everything: `npm test`
- Story tests only: `npx vitest --project=storybook`
- Interactively: start Storybook (`npm run storybook`) and use the test
  widget at the bottom of the sidebar; each story shows pass/fail.

## Sidebar statuses are snapshots, not live

The pass/fail/warning markers in the sidebar reflect the LAST widget test
run — they do not update on file changes. Before believing a red/amber
marker (or its absence), trigger a fresh run from the test widget. A story
edited mid-development often shows failures that a re-run clears.

## Stuck "Running…" state

If story files are edited while a widget run is in flight, the embedded
vitest child can crash and the widget wedges permanently in "Running…"
(the run button stays disabled; there is NO cancel UI). Only fix: restart
the Storybook dev server (`kill $(lsof -t -iTCP:6006 -sTCP:LISTEN)`, then
`npm run storybook`). Browsers reconnect automatically.

Related flake: the first widget/CLI run after adding new dependencies may
fail all stories in a file with "Re-optimizing dependencies" noise — just
re-run before diagnosing.

## a11y warnings are invisible in the CLI

With `parameters.a11y.test: 'todo'` (this repo's setting in
`.storybook/preview.tsx`), axe violations surface ONLY as amber markers in
the Storybook UI — CLI runs stay green and even `--reporter=verbose` shows
nothing. To get the concrete violations, either:
- temporarily set `a11y: { test: 'error' }` and run the storybook project, or
- run axe directly against the story iframes with Playwright: load
  `node_modules/axe-core/axe.min.js` into
  `http://localhost:6006/iframe.html?id=<story-id>&viewMode=story` and call
  `axe.run(document.getElementById('storybook-root'))` (story ids come from
  `http://localhost:6006/index.json`).

Recurring real findings this caught: `aria-label` on a plain `<span>`
(prohibited — needs `role="img"`), insufficient text color contrast
(status-tone text on surface), and an unlabeled Radix Select trigger
(`FormControl` must wrap `SelectTrigger`, not the DOM-less `Select` root).
