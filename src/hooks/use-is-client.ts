"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false en el servidor (y durante la hidratación), true en el navegador. */
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
