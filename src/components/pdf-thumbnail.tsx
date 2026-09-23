import * as React from "react";
import { cn } from "../lib/utils";
import { loadPdfjs } from "../lib/pdf-render";

/**
 * First-page thumbnail of a PDF, rendered with pdf.js into a <canvas>.
 *
 * Why not an <iframe>: the browser's built-in viewer paints its own dark
 * canvas and scrollbars and ignores every styling hook, so a preview frame
 * could neither match the design system's surface nor stay still. Rendering
 * the page ourselves gives a plain bitmap that letterboxes like an <img>.
 *
 * pdf.js loading lives in `lib/pdf-render.ts`, together with
 * `renderPdfFirstPage` for consumers that want the bitmap ahead of time.
 */
export interface PdfThumbnailProps
  extends Omit<React.HTMLAttributes<HTMLCanvasElement>, "children"> {
  /** URL of the PDF (blob:, data: or http(s):). */
  src: string;
  /** Box the page is fitted into, in CSS px. */
  width: number;
  height: number;
  /** Called once the page is on the canvas, or on failure. */
  onLoad?: () => void;
  onError?: (err: unknown) => void;
}

const PdfThumbnail = React.forwardRef<HTMLCanvasElement, PdfThumbnailProps>(
  ({ src, width, height, onLoad, onError, className, ...props }, ref) => {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const [ready, setReady] = React.useState(false);

    React.useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    React.useEffect(() => {
      let cancelled = false;
      let renderTask: { cancel(): void } | null = null;
      let loadingTask: { destroy(): Promise<void> } | null = null;

      (async () => {
        try {
          const pdfjs = await loadPdfjs();
          const task = pdfjs.getDocument({ url: src });
          loadingTask = task;
          const loaded = await task.promise;
          if (cancelled) return;
          const page = await loaded.getPage(1);
          if (cancelled) return;

          const base = page.getViewport({ scale: 1 });
          const scale = Math.min(width / base.width, height / base.height);
          const dpr = window.devicePixelRatio || 1;
          const viewport = page.getViewport({ scale: scale * dpr });

          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
          canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
          const context = canvas.getContext("2d");
          if (!context) return;

          const render = page.render({ canvas, canvasContext: context, viewport });
          renderTask = render;
          await render.promise;
          if (cancelled) return;
          setReady(true);
          onLoad?.();
        } catch (err) {
          if (!cancelled) onError?.(err);
        }
      })();

      return () => {
        cancelled = true;
        renderTask?.cancel();
        void loadingTask?.destroy();
      };
      // onLoad/onError are callbacks, not inputs to the render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src, width, height]);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          "transition-opacity duration-200",
          ready ? "opacity-100" : "opacity-0",
          className,
        )}
        {...props}
      />
    );
  },
);
PdfThumbnail.displayName = "PdfThumbnail";

export { PdfThumbnail };
