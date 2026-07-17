/**
 * Chromatic snapshot matrix for template stories. Layout regressions must be
 * caught at the composition level, not only per component — so every template
 * story is snapshotted in both themes and at the mobile width where the
 * sidebar collapses into the drawer. `theme` drives the preview global (see
 * .storybook/preview.tsx), `viewport` is the browser width in px.
 */
export const templateChromaticModes = {
  "light desktop": { theme: "light", viewport: 1280 },
  "dark desktop": { theme: "dark", viewport: 1280 },
  "light mobile": { theme: "light", viewport: 390 },
} as const;
