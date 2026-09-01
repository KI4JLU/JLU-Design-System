// Standalone vitest config for the harness's own test suites.
//
// DELIBERATELY not wired into `npm test`: the package's vite.config.ts projects glob only
// `src/**`, and keeping the harness suites out of them keeps the design-system suite counts
// stable — a harness change must not move the numbers the package's own gates report.
// Run the harness suites explicitly instead:
//
//   npx vitest run --config .claude/tools/vitest.config.mjs                       # both suites
//   npx vitest run --config .claude/tools/vitest.config.mjs .claude/hooks/pm-guard.test.mjs
//   npx vitest run --config .claude/tools/vitest.config.mjs .claude/tools/card-scope.test.mjs
//
// This file lives in .claude/tools/ on purpose: that directory is on the PM guard's list, so
// the config that decides what the harness tests cover is as tamper-protected as the tests.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(here, '..', '..'),
  test: {
    environment: 'node',
    include: ['.claude/hooks/*.test.mjs', '.claude/tools/*.test.mjs'],
  },
})
