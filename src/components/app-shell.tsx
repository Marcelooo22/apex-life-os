"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { Landing } from "@/components/landing/landing";
import { ViewHost } from "@/components/layout/view-host";
import { RestTimer } from "@/components/ui/rest-timer";
import { SheetProvider } from "@/components/ui/sheet-provider";
import { FxHost } from "@/components/ui/fx-host";
import { ToastHost } from "@/components/ui/toast-host";
import { useAppState } from "@/hooks/use-app-state";
import { useIsClient } from "@/hooks/use-is-client";
import { NavigationProvider } from "@/hooks/use-navigation";
import { useHabitReminders } from "@/hooks/use-habit-reminders";
import { useStorageLifecycle } from "@/hooks/use-storage-lifecycle";
import { useWakeLock } from "@/hooks/use-wake-lock";

/** Degradados reutilizados por los iconos de carpeta de Universidad. */
function SvgDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <linearGradient id="fgA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e40af" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="fgB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7db3ff" />
          <stop offset="1" stopColor="#2f6df0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AppContent() {
  const { gym } = useAppState();
  useStorageLifecycle();
  useHabitReminders();
  // La pantalla no se apaga mientras haya un entreno en curso.
  useWakeLock(gym.active !== null);

  return (
    <>
      <SvgDefs />
      <Landing />
      <ViewHost />
      <RestTimer />
      <ToastHost />
      <FxHost />
    </>
  );
}

/**
 * Raíz de la app. Todo el contenido depende de datos locales del dispositivo
 * (localStorage, fecha y hora), así que se dibuja solo en el navegador; el
 * servidor entrega únicamente el fondo negro, igual que el arranque original.
 */
export function AppShell() {
  const isClient = useIsClient();
  if (!isClient) return <div className="min-h-dvh bg-black" aria-hidden="true" />;

  return (
    <AuthProvider>
      <NavigationProvider>
        <SheetProvider>
          <AppContent />
        </SheetProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}
