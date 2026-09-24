import * as React from "react";
import {
  DEFAULT_UI_SHAPE,
  UiShapeContext,
  type UiShape,
} from "./ui-shape-context";

export interface UiShapeProviderProps {
  children: React.ReactNode;
  /** Used when nothing is stored yet. Default `rounded`. */
  defaultShape?: UiShape;
  /** localStorage key the choice is kept under (per browser). Default `ui-shape`. */
  storageKey?: string;
}

const read = (key: string, fallback: UiShape): UiShape => {
  try {
    const v = localStorage.getItem(key);
    return v === "pill" || v === "rounded" ? v : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Holds the app-wide Style (see `useUiShape`), remembers it per browser like
 * the colour scheme, and mirrors it to `<html data-ui-shape>` so the
 * `--ui-radius-*` tokens — and with them a consumer's own CSS and portaled
 * content — follow it too. Mount once near the root, beside `ThemeProvider`.
 */
export function UiShapeProvider({
  children,
  defaultShape = DEFAULT_UI_SHAPE,
  storageKey = "ui-shape",
}: UiShapeProviderProps) {
  const [shape, setShapeState] = React.useState<UiShape>(() => read(storageKey, defaultShape));

  React.useEffect(() => {
    document.documentElement.dataset.uiShape = shape;
  }, [shape]);

  const setShape = React.useCallback(
    (next: UiShape) => {
      setShapeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* per-browser convenience only */
      }
    },
    [storageKey],
  );

  const value = React.useMemo(() => ({ shape, setShape }), [shape, setShape]);
  return <UiShapeContext.Provider value={value}>{children}</UiShapeContext.Provider>;
}
