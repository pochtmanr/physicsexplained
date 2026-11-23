"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * The hover link between a figure and its guide (docs/figure-full-view.md).
 *
 * Both sides name the same thing with the same key: the `key` of a guide
 * entry in `lib/content/figure-guides.ts`. Pointing at a curve, a readout or
 * a slider marks its guide entry; pointing at a guide entry marks the curve,
 * readout or slider. `<SceneCard>` provides the link while a figure is shown
 * in full view with a guide; everywhere else it is switched off and costs
 * nothing.
 */
export type FigureLinkSource = "scene" | "guide";

export interface FigureLinkActive {
  key: string;
  /** Which side the reader is pointing at. */
  from: FigureLinkSource;
}

export interface FigureLink {
  /** False inline and for figures without a guide: nothing reacts. */
  enabled: boolean;
  active: FigureLinkActive | null;
  /** Mark `key` (or nothing, with null) as pointed at from `from`. */
  setActive: (key: string | null, from: FigureLinkSource) => void;
}

const OFF: FigureLink = { enabled: false, active: null, setActive: () => {} };

const FigureLinkContext = createContext<FigureLink>(OFF);

export function FigureLinkProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [active, setActiveState] = useState<FigureLinkActive | null>(null);

  const setActive = useCallback((key: string | null, from: FigureLinkSource) => {
    setActiveState((prev) => {
      if (key === null) {
        // Only the side that set it may clear it, so leaving one target does
        // not wipe a mark the other side has just made.
        return prev && prev.from === from ? null : prev;
      }
      return prev && prev.key === key && prev.from === from ? prev : { key, from };
    });
  }, []);

  const value = useMemo<FigureLink>(
    () => (enabled ? { enabled, active, setActive } : OFF),
    [enabled, active, setActive],
  );
  return <FigureLinkContext.Provider value={value}>{children}</FigureLinkContext.Provider>;
}

export function useFigureLink(): FigureLink {
  return useContext(FigureLinkContext);
}

/**
 * For an HTML element that stands for one guide key (a readout, a slider, a
 * guide entry). Spread `props` on the element and give it the `figure-link`
 * class; it is then marked while its key is active on either side.
 */
export function useFigureLinkTarget(key: string | undefined, from: FigureLinkSource) {
  const link = useFigureLink();
  const on = link.enabled && key !== undefined;
  const isActive = on && link.active?.key === key;
  const { setActive } = link;
  const props = useMemo(
    () =>
      on
        ? {
            "data-link-active": isActive ? ("true" as const) : undefined,
            onPointerEnter: () => setActive(key, from),
            onPointerLeave: () => setActive(null, from),
            onFocus: () => setActive(key, from),
            onBlur: () => setActive(null, from),
          }
        : {},
    [on, isActive, key, from, setActive],
  );
  return {
    /** True while this key is the active one. */
    isActive,
    /** True when the mark came from the other side. */
    fromOtherSide: isActive && link.active?.from !== from,
    props,
  };
}
