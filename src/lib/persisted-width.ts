import * as React from "react";

/**
 * Options of {@link usePersistedWidth}.
 *
 * The bounds are here for one reason: a **stored** value is clamped into them
 * on read. They are normally the same two numbers the column's
 * `AppShellPanelResize` carries — pass them twice rather than deriving one
 * from the other, because the hook has no way to reach the panel object and a
 * hidden coupling between the two would be worse than the repetition.
 */
export interface PersistedWidthOptions {
  /** Width when nothing is stored, the stored value is unusable, or storage is unavailable. */
  defaultWidth: number;
  /** Lower bound a stored width is clamped to on read. */
  minWidth: number;
  /** Upper bound a stored width is clamped to on read. */
  maxWidth: number;
  /**
   * Where the width is kept. Default `window.localStorage` (per device, which
   * is what „the user's size" means here — `sessionStorage` would forget it on
   * every tab). Injectable so tests and stories can hand in an in-memory
   * `Storage` instead of writing into the runner's real one.
   */
  storage?: Storage;
}

/**
 * A pane width that survives a reload, per device.
 *
 * ```tsx
 * const [leftWidth, setLeftWidth] = usePersistedWidth("myapp.kb.leftWidth", {
 *   defaultWidth: 300, minWidth: 200, maxWidth: 560,
 * });
 *
 * <AppShellLayout
 *   leftWidth={leftWidth}
 *   leftResize={{ minWidth: 200, maxWidth: 560, onWidthChange: setLeftWidth, label: … }}
 * />
 * ```
 *
 * **The components stay controlled.** This hook is not a default inside
 * `AppShellPanel`: it is the piece a consumer plugs into `width` and
 * `resize.onWidthChange`, so there is still exactly one place the width lives
 * and an app that persists it elsewhere (URL, profile, its own store) simply
 * does not call this.
 *
 * **The consumer passes the full key.** This package mints no namespace and
 * prefixes nothing — one library-chosen prefix would collide across the apps
 * that share a device and origin, and an app already knows how it names its
 * storage (JustRAG prefixes `justrag.`). The key is therefore data, not a
 * derivation.
 *
 * **Every storage access is wrapped.** Reading `window.localStorage` at all
 * throws in Safari's private mode and under blocked-cookie policies, and
 * `setItem` throws when the quota is full. A width is a preference: losing it
 * must never cost the view, so each access degrades to „no stored value" and
 * the hook keeps working as plain state.
 *
 * **A stored width is clamped on read**, because the value can be older than
 * the current bounds (a release that narrowed `maxWidth`, a hand-edited entry,
 * another build of the same app). Unclamped, the column would render a width
 * the handle can never drag back into range — the handle clamps its own
 * output, so it could only move the value further inside the range it already
 * is outside of. `defaultWidth` is **not** clamped: it is the consumer's own
 * literal from this render, not a value from somewhere else, and silently
 * changing it would hide the consumer's bug rather than the storage's.
 *
 * TODO: the stored width is read in the `useState` initialiser, i.e. during
 * the first client render. Under SSR + hydration that differs from the width
 * the server rendered (which has no storage and gets `defaultWidth`), so React
 * takes the client value and warns. Reading in an effect instead would hydrate
 * cleanly at the price of a visible jump on every load. Which of the two this
 * package wants is **not confirmed** with the design-system owner; the card
 * (KI-816) specifies the initialiser, and no consumer here renders on a
 * server.
 */
export function usePersistedWidth(
  key: string,
  options: PersistedWidthOptions,
): [width: number, setWidth: (px: number) => void] {
  const { defaultWidth, minWidth, maxWidth, storage } = options;

  // Resolved per render but only ever *used* inside a try/catch: reaching for
  // `window.localStorage` is itself the access that throws when cookies are
  // blocked, so it happens in `readStorage`/`writeStorage`, not here.
  const explicitStorage = storage;

  // Read ONCE per mount. A `useEffect` read would render the default first and
  // then jump; a read on every render would hit storage on every keystroke of
  // a drag.
  const [width, setWidthState] = React.useState<number>(() => {
    const raw = readStorage(explicitStorage, key);
    if (raw === null) return defaultWidth;
    const parsed = parseWidth(raw);
    if (parsed === null) return defaultWidth;
    return Math.min(maxWidth, Math.max(minWidth, parsed));
  });

  // Write-through: the state and the stored value change together, so a reload
  // cannot resurrect a width the user already dragged away from. The value is
  // stored as given — `ResizeHandle` has already clamped everything it emits,
  // and the read path clamps anything else.
  const setWidth = React.useCallback(
    (px: number) => {
      setWidthState(px);
      writeStorage(explicitStorage, key, px);
    },
    [explicitStorage, key],
  );

  return [width, setWidth];
}

/** The storage to use, or `undefined` where there is none to be had. */
function resolveStorage(explicit: Storage | undefined): Storage | undefined {
  if (explicit) return explicit;
  // No `window` at all: a server render, or a non-DOM renderer.
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

/** The raw stored string, or `null` — never a throw. */
function readStorage(explicit: Storage | undefined, key: string): string | null {
  try {
    return resolveStorage(explicit)?.getItem(key) ?? null;
  } catch {
    // Safari private mode, blocked cookies, a locked-down embedding.
    return null;
  }
}

/** Best-effort write. A failure loses the preference and nothing else. */
function writeStorage(explicit: Storage | undefined, key: string, px: number): void {
  try {
    resolveStorage(explicit)?.setItem(key, String(px));
  } catch {
    // Quota exceeded, or storage unavailable — see the doc comment.
  }
}

/**
 * A finite number, or `null` for everything else.
 *
 * `Number("")` is `0` and `Number(" ")` is `0` too, so an empty entry would
 * otherwise clamp to `minWidth` and look like a deliberate setting; a partly
 * numeric string (`"320px"`) is `NaN` here on purpose, because guessing what a
 * foreign format meant is how a wrong width becomes sticky.
 */
function parseWidth(raw: string): number | null {
  if (raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
