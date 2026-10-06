"use client";

import { useEffect, useRef, useState } from "react";
import { onToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Dibuja los avisos breves lanzados con `toast("...")`. */
export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    const off = onToast((text) => {
      clear();
      setMessage(text);
      timers.current.push(
        setTimeout(() => setVisible(true), 30),
        setTimeout(() => setVisible(false), 2600),
        setTimeout(() => setMessage(null), 3100),
      );
    });
    return () => {
      off();
      clear();
    };
  }, []);

  return (
    <div className={cn("toast", visible && "on")} role="status" aria-live="polite" hidden={message === null}>
      {message}
    </div>
  );
}
