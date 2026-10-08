"use client";

import { useEffect, useState } from "react";
import type { TrackHit } from "@/lib/music";
import { fetchSongInfo, type SongInfo } from "@/lib/songinfo";

/** Lo que se encontró de cada canción mientras se abre la hoja de añadir (se usa al guardarla). */
export const foundInfo = new Map<string, SongInfo>();

const setField = (name: string, value: string) => {
  const el = document.getElementById(`f-${name}`) as HTMLInputElement | null;
  if (el && !el.value) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
};

/** Busca BPM, tono, compás, año y géneros de la canción; rellena el BPM y muestra lo encontrado. */
export function SongInfoFill({ track }: { track: Pick<TrackHit, "title" | "artist" | "id" | "source"> }) {
  const [state, setState] = useState<"loading" | "done" | "none">("loading");
  const [info, setInfo] = useState<SongInfo | null>(null);

  useEffect(() => {
    const c = new AbortController();
    void fetchSongInfo(track, c.signal).then((r) => {
      if (c.signal.aborted) return;
      if (r && (r.bpm || r.key)) {
        foundInfo.set(track.id, r);
        if (r.bpm) setField("bpmTarget", String(r.bpm));
        setInfo(r);
        setState("done");
      } else setState("none");
    });
    return () => c.abort();
  }, [track]);

  if (state === "loading") return <p className="info-fill" aria-live="polite">Buscando BPM, tono y datos de la canción…</p>;
  if (state === "none" || !info) return <p className="info-fill" aria-live="polite">No encontré datos de esta canción. Puedes escribir el BPM si lo conoces, o dejarlo vacío.</p>;
  const chips = [info.bpm ? `${info.bpm} BPM` : "", info.key ?? "", info.timeSig ? `Compás ${info.timeSig}` : "", info.year ? String(info.year) : "", ...(info.genres ?? [])].filter(Boolean);
  return (
    <div className="info-found" aria-live="polite">
      <div className="chips">
        {chips.map((c) => (
          <span key={c} className="badge key">{c}</span>
        ))}
      </div>
      <p className="info-fill">{info.approx ? "Estimación de la IA: compruébala con la canción." : `Datos de ${info.from.bpm ?? info.from.key}. Se guardan con la canción.`}</p>
    </div>
  );
}
