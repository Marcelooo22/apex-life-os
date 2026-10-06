import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/** Caché del service worker anterior (HTML estático): se elimina al actualizar. */
const LEGACY_CACHES = ["apex-v2.0.0"];

const serwist = new Serwist({
  // Todo lo que genera el build (JS, CSS, iconos y la página "/") queda precacheado:
  // la app abre al instante y funciona sin conexión.
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all(LEGACY_CACHES.map((name) => caches.delete(name))));
});

serwist.addEventListeners();
