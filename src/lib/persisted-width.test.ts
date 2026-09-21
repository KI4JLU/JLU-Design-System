import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePersistedWidth } from "./persisted-width";

/**
 * `usePersistedWidth` (0.36.0): a column width that survives a reload.
 *
 * **The oracle is an injected in-memory `Storage` this file owns.** Every
 * assertion either puts a value into that object before the hook runs and
 * checks what the hook made of it, or reads the object afterwards and checks
 * what the hook put there — so what is compared is the storage contract
 * (`getItem`/`setItem` on a `Storage`, as the Web Storage spec defines it)
 * against this file's own numbers, never the hook's output against itself.
 *
 * It is also the only workable oracle here: `window.localStorage` is not
 * dependable under this runner (jsdom's implementation is not guaranteed to be
 * present or functional in the configured environment), and a test that
 * silently passed because both sides were absent would prove nothing. The
 * injection point exists for exactly this, and the story uses it too.
 *
 * „A remount" is a fresh `renderHook` against the same storage object — which
 * is what a reload is from the hook's point of view: new mount, same origin,
 * same stored string.
 */

/** A `Storage` with nothing but a Map behind it — the spec's surface, no I/O. */
function memoryStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, String(value)),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
  } satisfies Storage;
}

/** A `Storage` whose every access throws — Safari private mode, blocked cookies. */
function hostileStorage(): Storage {
  const boom = () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  };
  return {
    get length(): number {
      return boom();
    },
    key: boom,
    getItem: boom,
    setItem: boom,
    removeItem: boom,
    clear: boom,
  } as unknown as Storage;
}

const KEY = "jlu-ds.test.leftWidth";
// This file's numbers, so a passing assertion cannot have come from the hook.
const OPTIONS = { defaultWidth: 300, minWidth: 200, maxWidth: 560 };

describe("usePersistedWidth", () => {
  it("returns the default when nothing is stored", () => {
    const storage = memoryStorage();
    const { result } = renderHook(() => usePersistedWidth(KEY, { ...OPTIONS, storage }));
    expect(result.current[0]).toBe(OPTIONS.defaultWidth);
    // …and reading does not write: an untouched app leaves no entry behind.
    expect(storage.getItem(KEY)).toBeNull();
  });

  it("writes through on set and reads the value back on the next mount", () => {
    const storage = memoryStorage();
    const first = renderHook(() => usePersistedWidth(KEY, { ...OPTIONS, storage }));

    act(() => first.result.current[1](412));

    // Half one: the state moved.
    expect(first.result.current[0]).toBe(412);
    // Half two, the one that matters: the storage object itself carries it,
    // read directly through the `Storage` surface rather than through the hook.
    expect(storage.getItem(KEY)).toBe("412");

    // The reload: a fresh mount against the same storage.
    first.unmount();
    const second = renderHook(() => usePersistedWidth(KEY, { ...OPTIONS, storage }));
    expect(second.result.current[0]).toBe(412);
  });

  it("does not re-read storage while it is mounted", () => {
    // Read once per mount is the stated contract — a drag calls the setter
    // dozens of times, and a per-render read would hit storage each time.
    const storage = memoryStorage({ [KEY]: "412" });
    const getItem = vi.spyOn(storage, "getItem");
    const { result, rerender } = renderHook(() =>
      usePersistedWidth(KEY, { ...OPTIONS, storage }),
    );
    rerender();
    act(() => result.current[1](420));
    rerender();
    expect(getItem).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["above the maximum", "9999", OPTIONS.maxWidth],
    ["below the minimum", "12", OPTIONS.minWidth],
    ["exactly at a bound", "560", 560],
    ["inside the range", "345", 345],
  ])("clamps a stored width %s", (_name, stored, expected) => {
    // Why clamping is the read path's job: the stored value can outlive the
    // bounds (a release that narrowed them, a hand-edited entry). Unclamped,
    // the column would render a width the handle can never drag back in —
    // the handle clamps its own output, so it could only move the value
    // further inside a range it already sits outside of.
    const storage = memoryStorage({ [KEY]: stored });
    const { result } = renderHook(() => usePersistedWidth(KEY, { ...OPTIONS, storage }));
    expect(result.current[0]).toBe(expected);
  });

  it.each([
    ["a word", "wide"],
    ["a CSS length", "320px"],
    ["an empty string", ""],
    ["whitespace", "   "],
    ["JSON", '{"width":320}'],
  ])("falls back to the default for %s", (_name, stored) => {
    // `Number("")` and `Number(" ")` are 0, which would otherwise clamp to
    // `minWidth` and look like a deliberate setting rather than a broken entry.
    const storage = memoryStorage({ [KEY]: stored });
    const { result } = renderHook(() => usePersistedWidth(KEY, { ...OPTIONS, storage }));
    expect(result.current[0]).toBe(OPTIONS.defaultWidth);
  });

  it("survives a storage that throws on every access", () => {
    const storage = hostileStorage();
    const { result } = renderHook(() => usePersistedWidth(KEY, { ...OPTIONS, storage }));

    // Mounting did not throw, and the width is the default.
    expect(result.current[0]).toBe(OPTIONS.defaultWidth);

    // Setting does not throw either, and the hook keeps working as plain
    // state: a lost preference must never cost the view.
    act(() => result.current[1](480));
    expect(result.current[0]).toBe(480);
  });

  it("keeps the two keys of one app apart", () => {
    // The consumer passes the whole key; the hook mints no namespace and
    // prefixes nothing, so two columns of one app are two independent entries.
    const storage = memoryStorage();
    const left = renderHook(() => usePersistedWidth("app.left", { ...OPTIONS, storage }));
    const right = renderHook(() => usePersistedWidth("app.right", { ...OPTIONS, storage }));

    act(() => left.result.current[1](250));
    act(() => right.result.current[1](500));

    expect(storage.getItem("app.left")).toBe("250");
    expect(storage.getItem("app.right")).toBe("500");
    expect(left.result.current[0]).toBe(250);
    expect(right.result.current[0]).toBe(500);
  });
});
