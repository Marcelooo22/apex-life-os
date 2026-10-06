"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { isViewId, type ViewId } from "@/lib/types";

export interface Point {
  x: number;
  y: number;
}

interface NavState {
  view: ViewId | null;
  /** true cuando no debe haber animación (carga con #hash, botón atrás entre secciones). */
  instant: boolean;
}

interface NavigationContextValue extends NavState {
  originRef: RefObject<Point | null>;
  open: (id: ViewId, origin?: Point) => void;
  back: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

const viewFromHash = (): ViewId | null => {
  const id = window.location.hash.slice(1);
  return isViewId(id) ? id : null;
};

/**
 * Navegación entre la pantalla de inicio y las secciones.
 * Mantiene el comportamiento original: la sección va en el #hash de la URL,
 * el botón "atrás" del móvil vuelve al inicio y los accesos directos
 * del manifest (/#gym, /#habits…) abren la sección directamente.
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<NavState>(() => ({ view: viewFromHash(), instant: true }));
  const originRef = useRef<Point | null>(null);
  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      const id = viewFromHash();
      window.history.replaceState({ v: null }, "", window.location.pathname + window.location.search);
      if (id) window.history.pushState({ v: id }, "", "#" + id);
    }

    const onPopState = (event: PopStateEvent) => {
      const v = (event.state as { v?: unknown } | null)?.v;
      setNav((prev) => {
        if (!isViewId(v)) return prev.view ? { view: null, instant: false } : prev;
        return v === prev.view ? prev : { view: v, instant: true };
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const open = useCallback((id: ViewId, origin?: Point) => {
    originRef.current = origin ?? null;
    window.history.pushState({ v: id }, "", "#" + id);
    setNav({ view: id, instant: false });
  }, []);

  const back = useCallback(() => {
    const state = window.history.state as { v?: unknown } | null;
    if (state && state.v) window.history.back();
    else setNav({ view: null, instant: false });
  }, []);

  const value = useMemo(() => ({ ...nav, originRef, open, back }), [nav, open, back]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation debe usarse dentro de <NavigationProvider>");
  return ctx;
}
