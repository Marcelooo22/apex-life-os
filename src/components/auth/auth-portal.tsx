"use client";

import { useState, type FormEvent } from "react";
import { googleEnabled, supabase } from "@/lib/cloud/client";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup" | "forgot";

/** Traduce los errores habituales de la autenticación a frases claras. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "El correo o la contraseña no son correctos.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ese correo ya tiene una cuenta. Prueba a iniciar sesión.";
  if (m.includes("email not confirmed")) return "Aún no has confirmado tu correo. Revisa tu bandeja de entrada (y el spam).";
  if (m.includes("password") && m.includes("least")) return "La contraseña es muy corta (mínimo 8 caracteres).";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera unos minutos.";
  if (m.includes("network") || m.includes("fetch")) return "No hay conexión. Revisa tu internet e inténtalo de nuevo.";
  if (m.includes("valid email") || m.includes("invalid email")) return "Ese correo no parece válido.";
  return "No se pudo completar. Inténtalo de nuevo.";
}

interface Props {
  recovery: boolean;
  onGuest: () => void;
}

/** Pantalla de acceso: iniciar sesión, crear cuenta, recuperar contraseña o entrar sin cuenta. */
export function AuthPortal({ recovery, onGuest }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const run = async (fn: () => Promise<string | void>) => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const msg = await fn();
      if (msg) setInfo(msg);
    } catch (e) {
      setError(friendly(e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const sb = supabase();
    if (recovery) {
      if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
      return void run(async () => {
        const { error: err } = await sb.auth.updateUser({ password });
        if (err) throw err;
        window.location.replace(window.location.pathname);
      });
    }
    if (mode === "forgot") {
      return void run(async () => {
        const { error: err } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
        if (err) throw err;
        return "Si ese correo tiene cuenta, te enviamos un enlace para crear una contraseña nueva.";
      });
    }
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (mode === "signup") {
      return void run(async () => {
        const { data, error: err } = await sb.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim().slice(0, 40) }, emailRedirectTo: window.location.origin } });
        if (err) throw err;
        if (!data.session) return "Cuenta creada. Te enviamos un correo para confirmarla; ábrelo y vuelve aquí para entrar.";
      });
    }
    void run(async () => {
      const { error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
    });
  };

  const google = () =>
    void run(async () => {
      const { error: err } = await supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
      if (err) throw err;
    });

  const title = recovery ? "Nueva contraseña" : mode === "signup" ? "Crea tu espacio" : mode === "forgot" ? "Recuperar contraseña" : "Bienvenido de vuelta";

  return (
    <main className="portal" data-theme="none">
      <div className="portal-card">
        <div className="portal-logo" aria-hidden="true" />
        <h1>{title}</h1>
        <p className="muted">
          {recovery ? "Escribe la contraseña que quieres usar." : mode === "forgot" ? "Te enviaremos un enlace al correo." : "Tus hábitos, entrenos y notas, solo para ti y en cualquier dispositivo."}
        </p>

        {!recovery && mode !== "forgot" && (
          <div className="seg" role="radiogroup" aria-label="Acceso">
            {([["login", "Iniciar sesión"], ["signup", "Crear cuenta"]] as const).map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={mode === v} className={cn("seg-b", mode === v && "on")} onClick={() => { setMode(v); setError(""); setInfo(""); }}>
                {l}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="portal-form" noValidate>
          {mode === "signup" && !recovery && (
            <label className="fld">
              <span className="fl">Tu nombre</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={40} placeholder="Para saludarte" />
            </label>
          )}
          {!recovery && (
            <label className="fld">
              <span className="fl">Correo</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" required placeholder="tu@correo.com" />
            </label>
          )}
          {mode !== "forgot" && (
            <label className="fld">
              <span className="fl">{recovery ? "Contraseña nueva" : "Contraseña"}</span>
              <span className="pw">
                <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" && !recovery ? "current-password" : "new-password"} required minLength={8} placeholder="Mínimo 8 caracteres" />
                <button type="button" className="btn quiet sm" onClick={() => setShow((s) => !s)} aria-pressed={show}>
                  {show ? "Ocultar" : "Mostrar"}
                </button>
              </span>
            </label>
          )}

          <p className="portal-msg err" role="alert" hidden={!error}>{error}</p>
          <p className="portal-msg ok" role="status" hidden={!info}>{info}</p>

          <button type="submit" className="btn primary big" disabled={busy}>
            {busy ? "Un momento…" : recovery ? "Guardar contraseña" : mode === "signup" ? "Crear cuenta" : mode === "forgot" ? "Enviar enlace" : "Entrar"}
          </button>
        </form>

        {!recovery && mode !== "forgot" && googleEnabled() && (
          <button type="button" className="btn ghost big gap" onClick={google} disabled={busy}>
            Continuar con Google
          </button>
        )}
        {mode === "login" && !recovery && (
          <button type="button" className="lnk portal-l" onClick={() => { setMode("forgot"); setError(""); setInfo(""); }}>
            Olvidé mi contraseña
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" className="lnk portal-l" onClick={() => { setMode("login"); setError(""); setInfo(""); }}>
            Volver a iniciar sesión
          </button>
        )}
        {!recovery && (
          <div className="portal-guest">
            <button type="button" className="btn quiet" onClick={onGuest}>
              Continuar sin cuenta
            </button>
            <small className="muted">Tus datos se quedarán solo en este dispositivo.</small>
          </div>
        )}
      </div>
    </main>
  );
}
