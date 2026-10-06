"use client";

import { useSyncExternalStore } from "react";

/** Evento no estándar de Chromium para instalar la PWA. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Se registra al cargar el módulo (no al montar la UI) para no perder un evento temprano.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Devuelve una función para instalar la app, o null si el navegador no la ofrece ahora. */
export function useInstallPrompt() {
  const available = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  return available
    ? async () => {
        const event = deferred;
        deferred = null;
        emit();
        await event?.prompt();
      }
    : null;
}

/** true si la app ya está instalada / abierta como app. */
export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
