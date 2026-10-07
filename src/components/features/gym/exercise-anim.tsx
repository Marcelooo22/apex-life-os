"use client";

import { useState } from "react";

/** Dos fotos del ejercicio (inicio y final) que se alternan suavemente, como una animación. */
export function ExerciseAnim({ frames }: { frames: [string, string] }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className="ex-anim">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frames[0]} alt="Posición inicial del ejercicio" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="b" src={frames[1]} alt="Posición final del ejercicio" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      <figcaption>Posición inicial y final</figcaption>
    </figure>
  );
}
