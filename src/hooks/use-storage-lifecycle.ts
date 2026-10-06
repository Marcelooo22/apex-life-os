"use client";

import { useEffect } from "react";
import { flush } from "@/lib/store";

/** Guarda al cerrar/ocultar la app y pide al navegador que no borre los datos. */
export function useStorageLifecycle() {
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    try {
      void navigator.storage?.persist?.();
    } catch {
      /* no soportado */
    }
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);
}
