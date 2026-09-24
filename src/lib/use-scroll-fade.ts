import * as React from "react";

/**
 * Fades a scroll container's content out at an edge instead of cropping it
 * hard — only where there is more to scroll to: at the very top there is no
 * top fade, at the end no bottom fade. Applied as a CSS mask on the element
 * itself (the mask is fixed to the box, content scrolls beneath it), so no
 * overlay element and no colour to match the background.
 *
 * Re-evaluated on scroll, on resize of the element or its children, and when
 * rows are added or removed.
 */
export function useScrollFade<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  { size = 24, enabled = true }: { size?: number; enabled?: boolean } = {},
): void {
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const apply = () => {
      const top = el.scrollTop > 1 ? size : 0;
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1 ? size : 0;
      const mask =
        top || bottom
          ? `linear-gradient(to bottom, transparent 0, #000 ${top}px, #000 calc(100% - ${bottom}px), transparent 100%)`
          : "";
      el.style.maskImage = mask;
      el.style.setProperty("-webkit-mask-image", mask);
      // The state as data too — for styling hooks and for tests (jsdom drops
      // `mask-image` from the style object).
      const edges = [top && "top", bottom && "bottom"].filter(Boolean).join(" ");
      if (edges) el.dataset.scrollFade = edges;
      else delete el.dataset.scrollFade;
    };
    apply();
    el.addEventListener("scroll", apply, { passive: true });
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    const observeChildren = () => {
      for (const child of Array.from(el.children)) ro.observe(child);
    };
    observeChildren();
    const mo = new MutationObserver(() => {
      observeChildren();
      apply();
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", apply);
      ro.disconnect();
      mo.disconnect();
      el.style.maskImage = "";
      el.style.removeProperty("-webkit-mask-image");
      delete el.dataset.scrollFade;
    };
  }, [ref, size, enabled]);
}
