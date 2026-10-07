"use client";

import { useEffect, useState } from "react";
import type { TrackHit } from "@/lib/music";
import { fetchSongInfo, type SongInfo } from "@/lib/songinfo";

const setField = (name: string, value: string) => {
  const el = document.getElementById(`f-${name}`) as HTMLInputElement | null;
  if (el && !el.value) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
};

/** Busca el BPM y el tono de la canción y rellena los campos vacíos; la persona solo revisa. */
export function SongInfoFill({ track }: { track: Pick<TrackHit, "title" | "artist" | "id" | "source"> }) {
  const [state, setState] = useState<"loading" | "done" | "none">("loading");
  const [info, setInfo] = useState<SongInfo | null>(null);

  useEffect(() => {
    const c = new AbortController();
    void fetchSongInfo(track, c.signal).then((r) => {
      if (c.signal.aborted) return;
      if (r && (r.bpm || r.key)) {
        if (r.key) setField("key", r.key);
        if (r.bpm) setField("bpmTarget", String(r.bpm));
        setInfo(r);
        setState("done");
      } else setState("none");
    });
    return () => c.abort();
  }, [track]);

  return (
    <p className="info-fill" aria-live="polite">
      {state === "loading" && "Buscando BPM y tono…"}
      {state === "none" && "No encontré el BPM ni el tono. Puedes escribirlos si los conoces, o dejarlos vacíos."}
      {state === "done" && info && (
        <>
          Sugerido: {[info.bpm ? `${info.bpm} BPM` : "", info.key ?? ""].filter(Boolean).join(" · ")}. {info.approx ? "Es una estimación de la IA: compruébalo con la canción." : `Fuente: ${info.from.bpm ?? info.from.key}.`}
        </>
      )}
    </p>
  );
}
