"use client";

import { useEffect, useState } from "react";

/**
 * Anima anillos y barras: empieza en 0 y, tras pintar, pasa al valor real
 * (la transición la hace el CSS). Los cambios posteriores también se animan.
 */
export function useRingProgress(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setValue(target));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [target]);
  return value;
}
