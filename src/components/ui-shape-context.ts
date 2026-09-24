import * as React from "react";

/**
 * The app-wide Style: `rounded` (rounded squares) or `pill`. One switch for
 * every component with a shape variant — `PromptInput`, `SidebarCard`,
 * `SidebarRailItem`, `SidebarSelectionBar` — and, through the
 * `--ui-radius-*` tokens (tokens.css), for a consumer's own CSS.
 *
 * Components read it with `useUiShape()`; an explicit `shape` prop on a
 * component still wins. Outside a `UiShapeProvider` the shape is `rounded`.
 */
export type UiShape = "rounded" | "pill";

export interface UiShapeContextValue {
  shape: UiShape;
  setShape: (shape: UiShape) => void;
}

export const DEFAULT_UI_SHAPE: UiShape = "rounded";

export const UiShapeContext = React.createContext<UiShapeContextValue | null>(null);

export function useUiShape(): UiShapeContextValue {
  return (
    React.useContext(UiShapeContext) ?? { shape: DEFAULT_UI_SHAPE, setShape: () => {} }
  );
}
