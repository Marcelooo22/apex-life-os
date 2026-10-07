"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cloudEnabled, supabase } from "@/lib/cloud/client";
import { clearDevice, flushForSignOut, getSyncSnapshot, pullIfNewer, startSync, subscribeSync, syncNow, type Choice, type ConflictInfo, type SyncStatus } from "@/lib/cloud/sync";
import { getState, updateState } from "@/lib/store";
import { AuthPortal } from "./auth-portal";

type Status = "disabled" | "loading" | "out" | "in" | "guest" | "recovery";
const GUEST_KEY = "apex.guest";

interface AuthApi {
  status: Status;
  email: string | null;
  sync: { status: SyncStatus; lastOk: number | null };
  /** Abre el portal de acceso (para quien entró sin cuenta). */
  openPortal: () => void;
  /** Cierra sesión. Devuelve un mensaje de error si no es seguro hacerlo. */
  signOut: () => Promise<string | null>;
  syncNow: () => void;
}

const Ctx = createContext<AuthApi>({ status: "disabled", email: null, sync: { status: "idle", lastOk: null }, openPortal: () => {}, signOut: async () => null, syncNow: () => {} });
export const useAuth = () => useContext(Ctx);

/**
 * Cuentas. Si no hay Supabase configurado la app funciona igual que siempre (solo en el dispositivo).
 * Si lo hay, se pide iniciar sesión (o entrar sin cuenta) y los datos se guardan en la cuenta.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = cloudEnabled();
  const [status, setStatus] = useState<Status>(enabled ? "loading" : "disabled");
  const [session, setSession] = useState<Session | null>(null);
  const [conflict, setConflict] = useState<{ info: ConflictInfo; done: (c: Choice) => void } | null>(null);
  const syncing = useRef<string | null>(null);
  const sync = useSyncExternalStore(subscribeSync, getSyncSnapshot, getSyncSnapshot);

  const askConflict = useCallback((info: ConflictInfo) => new Promise<Choice>((resolve) => setConflict({ info, done: (c) => (setConflict(null), resolve(c)) })), []);

  const begin = useCallback(
    (s: Session) => {
      setSession(s);
      setStatus("in");
      if (syncing.current === s.user.id) return;
      syncing.current = s.user.id;
      const meta = s.user.user_metadata as { name?: string } | undefined;
      void startSync(s.user.id, askConflict).then(() => {
        if (meta?.name && !getState().name) updateState((d) => void (d.name = String(meta.name).slice(0, 40)));
      });
    },
    [askConflict],
  );

  useEffect(() => {
    if (!enabled) return;
    const sb = supabase();
    void sb.auth.getSession().then(({ data }) => {
      if (data.session) begin(data.session);
      else setStatus(localStorage.getItem(GUEST_KEY) === "1" ? "guest" : "out");
    });
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") return setStatus("recovery");
      if (event === "SIGNED_OUT") {
        syncing.current = null;
        setSession(null);
        return setStatus(localStorage.getItem(GUEST_KEY) === "1" ? "guest" : "out");
      }
      if (s && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED")) begin(s);
    });
    const onVisible = () => {
      if (!document.hidden) void pullIfNewer();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [enabled, begin]);

  const api = useMemo<AuthApi>(
    () => ({
      status,
      email: session?.user.email ?? null,
      sync,
      openPortal: () => {
        localStorage.removeItem(GUEST_KEY);
        setStatus("out");
      },
      signOut: async () => {
        const safe = await flushForSignOut();
        if (!safe) return "No se pudieron enviar tus últimos cambios a la nube. Revisa tu conexión e inténtalo de nuevo, o exporta una copia desde Ajustes.";
        await supabase().auth.signOut();
        clearDevice();
        syncing.current = null;
        return null;
      },
      syncNow: () => void syncNow(),
    }),
    [status, session, sync],
  );

  if (status === "loading") return <div className="min-h-dvh bg-black" aria-hidden="true" />;
  if (status === "out" || status === "recovery") {
    return (
      <Ctx.Provider value={api}>
        <AuthPortal
          recovery={status === "recovery"}
          onGuest={() => {
            localStorage.setItem(GUEST_KEY, "1");
            setStatus("guest");
          }}
        />
      </Ctx.Provider>
    );
  }

  return (
    <Ctx.Provider value={api}>
      {children}
      {conflict && (
        <div className="portal-back" role="alertdialog" aria-modal="true" aria-labelledby="cf-t">
          <div className="portal-card cf">
            <h2 id="cf-t">Tienes datos en dos sitios</h2>
            <p className="muted">
              Este dispositivo y tu cuenta (guardada el {new Date(conflict.info.cloudAt).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}) tienen información distinta. Elige cuál conservar. De la otra se guarda una copia de seguridad en este dispositivo.
            </p>
            <button type="button" className="btn primary big" onClick={() => conflict.done("cloud")}>
              Usar los datos de mi cuenta
            </button>
            <button type="button" className="btn ghost big gap" onClick={() => conflict.done("device")}>
              Usar los de este dispositivo
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
