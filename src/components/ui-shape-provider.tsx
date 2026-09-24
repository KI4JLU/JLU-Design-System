import * as React from "react";
import { DEFAULT_UI_SHAPE, UiShapeContext, type UiShape } from "./ui-shape-context";
import {
  ACCENT_COLORS,
  AccentContext,
  ContrastContext,
  type AccentColor,
  type ContrastChoice,
  type ResolvedContrast,
} from "./appearance-context";

export interface AppearanceProviderProps {
  children: React.ReactNode;
  /** Used when nothing is stored yet. Default `rounded`. */
  defaultShape?: UiShape;
  /** Default `system`. */
  defaultContrast?: ContrastChoice;
  /** Default `standard`. */
  defaultAccent?: AccentColor;
  /**
   * localStorage key of the Style; contrast and accent use `<key>-contrast` /
   * `<key>-accent`. Default `ui-shape`.
   */
  storageKey?: string;
}

const read = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* per-browser convenience only */
  }
};

const HIGH_CONTRAST_QUERY = "(prefers-contrast: more), (forced-colors: active)";
const systemWantsMore = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(HIGH_CONTRAST_QUERY).matches
    : false;

/**
 * Holds the app-wide appearance preferences — Style (`useUiShape`), contrast
 * (`useContrast`) and accent colour (`useAccent`) — remembers each per
 * browser and mirrors them to `<html data-ui-shape data-contrast data-accent>`,
 * where the tokens pick them up. Mount once near the root, beside ThemeProvider.
 */
export function AppearanceProvider({
  children,
  defaultShape = DEFAULT_UI_SHAPE,
  defaultContrast = "system",
  defaultAccent = "standard",
  storageKey = "ui-shape",
}: AppearanceProviderProps) {
  const contrastKey = `${storageKey}-contrast`;
  const accentKey = `${storageKey}-accent`;
  const [shape, setShapeState] = React.useState<UiShape>(() => read(storageKey, ["rounded", "pill"] as const, defaultShape));
  const [contrast, setContrastState] = React.useState<ContrastChoice>(() =>
    read(contrastKey, ["system", "normal", "more"] as const, defaultContrast),
  );
  const [accent, setAccentState] = React.useState<AccentColor>(() => read(accentKey, ACCENT_COLORS, defaultAccent));
  const [systemMore, setSystemMore] = React.useState(systemWantsMore);

  // Follow the OS setting live while the choice is `system`.
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(HIGH_CONTRAST_QUERY);
    const onChange = () => setSystemMore(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const resolvedContrast: ResolvedContrast = contrast === "system" ? (systemMore ? "more" : "normal") : contrast;

  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.uiShape = shape;
    root.dataset.contrast = resolvedContrast;
    root.dataset.accent = accent;
  }, [shape, resolvedContrast, accent]);

  const setShape = React.useCallback((v: UiShape) => { setShapeState(v); write(storageKey, v); }, [storageKey]);
  const setContrast = React.useCallback((v: ContrastChoice) => { setContrastState(v); write(contrastKey, v); }, [contrastKey]);
  const setAccent = React.useCallback((v: AccentColor) => { setAccentState(v); write(accentKey, v); }, [accentKey]);

  const shapeValue = React.useMemo(() => ({ shape, setShape }), [shape, setShape]);
  const contrastValue = React.useMemo(
    () => ({ contrast, resolvedContrast, setContrast }),
    [contrast, resolvedContrast, setContrast],
  );
  const accentValue = React.useMemo(() => ({ accent, setAccent }), [accent, setAccent]);

  return (
    <UiShapeContext.Provider value={shapeValue}>
      <ContrastContext.Provider value={contrastValue}>
        <AccentContext.Provider value={accentValue}>{children}</AccentContext.Provider>
      </ContrastContext.Provider>
    </UiShapeContext.Provider>
  );
}

/** The Style-only name this provider had first; same component. */
export const UiShapeProvider = AppearanceProvider;
export type UiShapeProviderProps = AppearanceProviderProps;
