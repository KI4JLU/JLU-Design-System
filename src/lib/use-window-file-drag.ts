import * as React from "react";

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

/**
 * True while files from the OS are dragged anywhere over the window — so a
 * drop target elsewhere (a side panel's dropzone) can appear before the
 * pointer reaches it. Text or element drags inside the page do not count.
 *
 * While active it also cancels the browser default of opening a file dropped
 * outside any drop target, which would navigate away from the app. Targets
 * that handle their own drops (composer attachments) are unaffected: the
 * window sees the event after them and only calls `preventDefault`.
 */
export function useWindowFileDrag(enabled = true): boolean {
  const [dragging, setDragging] = React.useState(false);
  React.useEffect(() => {
    if (!enabled) return;
    // dragenter/dragleave fire per element crossed; a depth counter tells the
    // pointer leaving the window from moving between children.
    let depth = 0;
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth += 1;
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const end = (e: DragEvent) => {
      if (e.type === "drop" && hasFiles(e)) e.preventDefault();
      depth = 0;
      setDragging(false);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", end);
    window.addEventListener("dragend", end);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", end);
      window.removeEventListener("dragend", end);
    };
  }, [enabled]);
  return enabled && dragging;
}
