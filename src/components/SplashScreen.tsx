"use client";

import { useEffect, useState } from "react";

/**
 * Pantalla de carga de Apex.
 * Se muestra una vez cada vez que abres la app (sesión nueva).
 * Cambia SOLO_UNA_VEZ_POR_SESION a false si quieres que salga en cada recarga.
 */
const SOLO_UNA_VEZ_POR_SESION = true;
const STORAGE_KEY = "apex-splash-visto";
const DURACION_MS = 3600; // cuánto dura antes de empezar a irse
const SALIDA_MS = 900; // duración del desvanecimiento final

// Chispas que salen del orbe (valores fijos para que no cambien entre cargas)
const CHISPAS = Array.from({ length: 22 }, (_, i) => {
  const angulo = (i / 22) * Math.PI * 2 + (i % 3) * 0.35;
  const distancia = 110 + ((i * 41) % 120);
  return {
    x: Math.round(Math.cos(angulo) * distancia),
    y: Math.round(Math.sin(angulo) * distancia),
    size: 2 + (i % 3),
    delay: 1.0 + (i % 7) * 0.07,
  };
});

const LETRAS = ["a", "p", "e", "x"];

export default function SplashScreen() {
  const [fase, setFase] = useState<"oculto" | "visible" | "saliendo">("visible");

  useEffect(() => {
    if (SOLO_UNA_VEZ_POR_SESION) {
      try {
        if (sessionStorage.getItem(STORAGE_KEY)) {
          setFase("oculto");
          return;
        }
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* si el navegador bloquea el storage, simplemente se muestra */
      }
    }

    const reducido = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const espera = reducido ? 900 : DURACION_MS;

    const t1 = setTimeout(() => setFase("saliendo"), espera);
    const t2 = setTimeout(() => setFase("oculto"), espera + SALIDA_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (fase === "oculto") return null;

  return (
    <div
      className={`apex-splash ${fase === "saliendo" ? "apex-splash--salida" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Cargando Apex"
    >
      <style>{CSS}</style>

      <div className="apex-escena">
        {/* resplandor de fondo que respira */}
        <div className="apex-halo" />

        {/* ondas de choque */}
        <span className="apex-onda" style={{ animationDelay: "0.8s" }} />
        <span className="apex-onda" style={{ animationDelay: "1.35s" }} />
        <span className="apex-onda" style={{ animationDelay: "1.9s" }} />

        {/* chispas */}
        {CHISPAS.map((c, i) => (
          <span
            key={i}
            className="apex-chispa"
            style={
              {
                "--x": `${c.x}px`,
                "--y": `${c.y}px`,
                width: c.size,
                height: c.size,
                animationDelay: `${c.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}

        {/* el orbe */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-512.png"
          alt=""
          className="apex-orbe"
          width={512}
          height={512}
          draggable={false}
        />
      </div>

      <div className="apex-marca" aria-hidden="true">
        {LETRAS.map((l, i) => (
          <span key={i} style={{ animationDelay: `${1.5 + i * 0.12}s` }}>
            {l}
          </span>
        ))}
      </div>

      <div className="apex-barra" aria-hidden="true">
        <i />
      </div>
    </div>
  );
}

const CSS = `
.apex-splash {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  overflow: hidden;
  transition: opacity ${SALIDA_MS}ms ease, transform ${SALIDA_MS}ms cubic-bezier(.7,0,.3,1), filter ${SALIDA_MS}ms ease;
}
.apex-splash--salida {
  opacity: 0;
  transform: scale(1.25);
  filter: brightness(2.2) blur(6px);
  pointer-events: none;
}

.apex-escena {
  position: relative;
  width: min(62vw, 260px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
}

/* Orbe: nace como un punto de luz y se enciende */
.apex-orbe {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  mix-blend-mode: screen;
  user-select: none;
  animation:
    apex-ignicion 1.5s cubic-bezier(.16,1,.3,1) both,
    apex-flotar 3.4s ease-in-out 1.5s infinite;
}
@keyframes apex-ignicion {
  0%   { opacity: 0; transform: scale(.02); filter: blur(24px) brightness(3); }
  35%  { opacity: 1; transform: scale(.35); filter: blur(10px) brightness(2.4); }
  70%  { transform: scale(1.08); filter: blur(0) brightness(1.5); }
  100% { opacity: 1; transform: scale(1); filter: blur(0) brightness(1); }
}
@keyframes apex-flotar {
  0%, 100% { transform: translateY(0) scale(1); filter: brightness(1); }
  50%      { transform: translateY(-7px) scale(1.035); filter: brightness(1.18); }
}

/* Halo que respira detrás */
.apex-halo {
  position: absolute;
  inset: -45%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,110,30,.38) 0%, rgba(255,80,10,.14) 38%, transparent 68%);
  opacity: 0;
  animation: apex-halo-in 1.2s ease-out .35s forwards, apex-respirar 3.4s ease-in-out 1.6s infinite;
}
@keyframes apex-halo-in { to { opacity: 1; } }
@keyframes apex-respirar {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.14); opacity: .75; }
}

/* Ondas que se expanden */
.apex-onda {
  position: absolute;
  inset: 14%;
  border-radius: 50%;
  border: 1.5px solid rgba(255,140,60,.75);
  box-shadow: 0 0 22px rgba(255,100,20,.45), inset 0 0 22px rgba(255,100,20,.25);
  opacity: 0;
  animation: apex-onda 2.1s cubic-bezier(.2,.6,.3,1) infinite;
}
@keyframes apex-onda {
  0%   { transform: scale(.9); opacity: 0; }
  12%  { opacity: .85; }
  100% { transform: scale(3.2); opacity: 0; }
}

/* Chispas */
.apex-chispa {
  position: absolute;
  left: 50%;
  top: 50%;
  margin: -1px 0 0 -1px;
  border-radius: 50%;
  background: #ffb066;
  box-shadow: 0 0 8px 2px rgba(255,120,30,.8);
  opacity: 0;
  z-index: 1;
  animation: apex-chispa 2.4s cubic-bezier(.15,.7,.3,1) forwards;
}
@keyframes apex-chispa {
  0%   { transform: translate(0,0) scale(.4); opacity: 0; }
  15%  { opacity: 1; }
  100% { transform: translate(var(--x), var(--y)) scale(1); opacity: 0; }
}

/* Marca */
.apex-marca {
  display: flex;
  gap: .16em;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-weight: 200;
  font-size: clamp(40px, 11vw, 60px);
  line-height: 1;
  letter-spacing: .08em;
  color: #ffe9d6;
  text-shadow: 0 0 28px rgba(255,120,40,.55);
}
.apex-marca span {
  display: inline-block;
  opacity: 0;
  transform: translateY(18px);
  filter: blur(10px);
  animation: apex-letra .9s cubic-bezier(.16,1,.3,1) forwards;
}
@keyframes apex-letra {
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}

/* Barra de carga fina */
.apex-barra {
  width: 120px;
  height: 2px;
  border-radius: 2px;
  background: rgba(255,255,255,.08);
  overflow: hidden;
  opacity: 0;
  animation: apex-halo-in .6s ease 1.9s forwards;
}
.apex-barra i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #ff6a1a, #ffc27a);
  box-shadow: 0 0 10px rgba(255,120,30,.9);
  transform: scaleX(0);
  transform-origin: left;
  animation: apex-carga ${DURACION_MS - 1900}ms cubic-bezier(.4,0,.2,1) 1.9s forwards;
}
@keyframes apex-carga { to { transform: scaleX(1); } }

/* Accesibilidad: sin movimiento fuerte si el sistema lo pide */
@media (prefers-reduced-motion: reduce) {
  .apex-splash * { animation-duration: .01ms !important; animation-delay: 0s !important; animation-iteration-count: 1 !important; }
  .apex-marca span, .apex-barra, .apex-halo, .apex-orbe { opacity: 1 !important; transform: none !important; filter: none !important; }
  .apex-onda, .apex-chispa { display: none; }
}
`;
