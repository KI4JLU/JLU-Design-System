import * as React from "react";
import { FileIcon, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";
import { PdfThumbnail } from "./pdf-thumbnail";

export interface FilePreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Object/data/http URL of the file. Without one only the glyph + badge show. */
  url?: string;
  /** MIME type, e.g. `image/png`, `application/pdf`. */
  mediaType?: string;
  /** Used for the filetype badge (extension) and the image alt text. */
  filename?: string;
  /** The file is still being fetched: a spinner instead of the glyph. */
  loading?: boolean;
}

/**
 * Fixed-size (160×192) preview of a file: the picture, the first PDF page
 * (`PdfThumbnail`), or a file glyph — with a filetype badge bottom-left.
 * Nothing else, so a long filename never resizes it. Shared by the composer's
 * attachment chips (hover) and the sources list (hover); wrap it in whatever
 * surface fits (HoverCard, Popover, inline).
 */
const FilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ url, mediaType, filename = "", loading = false, className, ...props }, ref) => {
    const isImage = Boolean(url) && Boolean(mediaType?.startsWith("image/"));
    const isPdf = Boolean(url) && mediaType === "application/pdf";
    // Filetype badge: the extension when the name has one, else the MIME subtype.
    const extension = filename.includes(".") ? filename.split(".").pop() : undefined;
    const typeLabel = (extension || mediaType?.split("/").pop() || "file")
      .replace(/^x-/, "")
      .toUpperCase();

    return (
      <div
        ref={ref}
        data-slot="file-preview"
        className={cn(
          "relative flex h-48 w-40 items-center justify-center overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest",
          className,
        )}
        {...props}
      >
        {isImage ? (
          <img
            alt={filename}
            className="max-h-full max-w-full object-contain"
            height={192}
            src={url}
            width={160}
          />
        ) : isPdf ? (
          <PdfThumbnail height={192} src={url!} width={160} />
        ) : loading ? (
          <Loader2
            aria-hidden="true"
            className="size-6 animate-spin text-on-surface-variant"
          />
        ) : (
          <FileIcon
            aria-hidden="true"
            className="size-12 text-on-surface-variant"
            strokeWidth={1.25}
          />
        )}
        <Badge
          appearance="filled"
          tone="neutral"
          className="absolute bottom-2 left-2 shadow-card"
        >
          {typeLabel}
        </Badge>
      </div>
    );
  },
);
FilePreview.displayName = "FilePreview";

export { FilePreview };
