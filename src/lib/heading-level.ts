/**
 * The one dial for „who owns the page heading" — see
 * `docs/COMPONENT_GUIDELINES.md` → „Page headings: who owns them".
 *
 * The rule this type exists for: a template renders the `title` it is given as
 * a **real heading element**, and the **call site** decides its level in the
 * document outline. A level is a number and not a tag name (`as="h2"`) for
 * three reasons:
 *
 * 1. A number cannot express „render this as a `div`", so the level prop can
 *    never re-open the defect it was added to fix (`AuthLayout`'s title
 *    landing in a non-heading).
 * 2. The concept the rule is about is the **outline level**, which is also the
 *    oracle every test uses (`getAllByRole("heading", { level })`) — not the
 *    element name, which is only how HTML spells the level.
 * 3. A level composes arithmetically: a template with a title *and* section
 *    headings derives the inner level (`nextHeadingLevel`) instead of
 *    hardcoding a second one, which is exactly the defect
 *    `SectionedGridLayout` had (an `<h1>` from `PageHeader` next to a
 *    hardcoded `<h2>` per section, the two unable to move together).
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * The intrinsic element name for a level. The return type is derived by the
 * template-literal type, so a new level would be a type error rather than a
 * string built at runtime.
 */
export function headingTag(level: HeadingLevel): `h${HeadingLevel}` {
  return `h${level}`;
}

/**
 * The level one step *inside* `level`, for a template that renders both a page
 * heading and headings below it. Clamped at 6, because HTML has no `h7`: a
 * template asked to sit at level 6 puts its inner headings at 6 as well —
 * a repeated level is a flat outline, while an `h7` would be no heading at all.
 */
export function nextHeadingLevel(level: HeadingLevel): HeadingLevel {
  // The cast is the clamp: TypeScript cannot narrow `level + 1` back into the
  // union, and `6` is the only value the addition could push out of it.
  return level < 6 ? ((level + 1) as HeadingLevel) : 6;
}
