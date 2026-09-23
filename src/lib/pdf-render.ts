/**
 * pdf.js access shared by `PdfThumbnail` (canvas in the tree) and consumers
 * that want a first-page bitmap ahead of time (`renderPdfFirstPage`).
 *
 * pdf.js is loaded lazily on first use, so consumers that never touch a PDF
 * do not pay for it. The worker is referenced by URL (`?url`), which Vite
 * resolves in dev and emits as an asset in the library build.
 */
let workerConfigured = false;

export async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerConfigured) {
    const { default: workerUrl } = await import(
      "pdfjs-dist/build/pdf.worker.min.mjs?url"
    );
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    workerConfigured = true;
  }
  return pdfjs;
}

/** Kick off the pdf.js import (and worker fetch) ahead of first use. */
export function preloadPdfjs(): void {
  void loadPdfjs().catch(() => undefined);
}

export interface RenderPdfFirstPageOptions {
  /** Device pixel ratio to render at; defaults to the window's. */
  dpr?: number;
  /** `image/png` (default) or `image/jpeg`. */
  type?: "image/png" | "image/jpeg";
}

/**
 * Renders page 1 of a PDF, fitted into `width`×`height` CSS px, to a data URL.
 * Off-screen — nothing is mounted — so a list can pre-render its thumbnails
 * and show them as plain <img>s the instant a preview opens, instead of
 * decoding the PDF while the user waits.
 */
export async function renderPdfFirstPage(
  src: string,
  width: number,
  height: number,
  { dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, type = "image/png" }: RenderPdfFirstPageOptions = {},
): Promise<string> {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument({ url: src });
  try {
    const loaded = await task.promise;
    const page = await loaded.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(width / base.width, height / base.height);
    const viewport = page.getViewport({ scale: scale * dpr });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("renderPdfFirstPage: no 2d context");
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    return canvas.toDataURL(type);
  } finally {
    void task.destroy();
  }
}
