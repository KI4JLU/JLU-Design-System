import * as React from "react";
import { renderPdfFirstPage } from "./pdf-render";

/**
 * Pre-renders a PDF's first page to a bitmap as soon as `url` is known —
 * not when a preview opens — so the hover card shows a plain <img> that is
 * already in memory, in sync with the card. Returns `undefined` for anything
 * that is not a PDF with a URL, and `null` while rendering or on failure.
 */
export function usePdfPreviewImage(
  url: string | undefined,
  mediaType: string | undefined,
  width = 160,
  height = 192,
): string | null | undefined {
  const isPdf = Boolean(url) && mediaType === "application/pdf";
  const [image, setImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isPdf || !url) return;
    let cancelled = false;
    renderPdfFirstPage(url, width, height)
      .then((dataUrl) => {
        if (!cancelled) setImage(dataUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isPdf, url, width, height]);

  return isPdf ? image : undefined;
}
