import * as React from "react";

/**
 * Keeps a scroll container's content at full width when a classic scrollbar
 * appears: the scrollbar is moved into the right gutter instead of being
 * taken out of the content box. The element's right padding becomes
 * `gutter − scrollbar width` (0 for overlay scrollbars, ~15px for classic
 * ones), measured — it differs per OS and browser — and re-measured whenever
 * the element or its children resize (content growing past the fold is what
 * makes the bar appear).
 *
 * Give the element `gutter` px of room on the right to spend (its own padding
 * or a negative margin into the parent's), and don't set a right padding of
 * your own: this hook owns it.
 */
export function useScrollbarGutter<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  gutter = 16,
): void {
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const bar = el.offsetWidth - el.clientWidth;
      el.style.paddingRight = `${Math.max(0, gutter - bar)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    const observeChildren = () => {
      for (const child of Array.from(el.children)) ro.observe(child);
    };
    observeChildren();
    // New rows (a chat added, a source uploaded) must be observed too.
    const mo = new MutationObserver(() => {
      observeChildren();
      fit();
    });
    mo.observe(el, { childList: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [ref, gutter]);
}
