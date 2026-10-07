"use client";

import { useEffect } from "react";
import { dkey } from "@/lib/dates";
import { isScheduled, timeToMinutes } from "@/lib/habits";
import { getState } from "@/lib/store";
import { toast } from "@/lib/toast";

const fired = new Set<string>();

async function notify(title: string, body: string) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: "/icons/icon-192.png", tag: title });
    else new Notification(title, { body, icon: "/icons/icon-192.png" });
  } catch {
    /* sin notificaciones */
  }
}

/**
 * Avisa a la hora del recordatorio de cada hábito pendiente. Solo funciona mientras la app está abierta
 * (sin un servidor de notificaciones, el navegador no deja avisar con la app cerrada).
 */
export function useHabitReminders() {
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const key = dkey(now);
      for (const h of getState().habits.list) {
        const at = timeToMinutes(h.reminder);
        if (at === null || h.log[key] || !isScheduled(h, now)) continue;
        // Ventana de 10 minutos, por si la app estaba en segundo plano a la hora exacta.
        if (minutes < at || minutes > at + 10) continue;
        const id = `${h.id}-${key}`;
        if (fired.has(id)) continue;
        fired.add(id);
        toast(`Es hora de: ${h.name}`);
        void notify("Apex", `Es hora de: ${h.name}`);
      }
    };
    check();
    const timer = setInterval(check, 20_000);
    return () => clearInterval(timer);
  }, []);
}
