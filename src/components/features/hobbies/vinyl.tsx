"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Cover } from "./track-search";

interface Props {
  songs: Song[];
  onOpen: (songId: string) => void;
  empty: string;
}

/** Notas que suben del disco: posición, tamaño, duración, retardo y color de cada una. */
const NOTES = [
  { g: "♪", x: -86, s: 20, d: 4.2, dl: 0, r: -14, c: "#c084fc" },
  { g: "♫", x: 62, s: 26, d: 4.8, dl: 0.9, r: 12, c: "#f472b6" },
  { g: "♬", x: -22, s: 18, d: 3.9, dl: 1.7, r: -8, c: "#fbbf24" },
  { g: "♩", x: 96, s: 22, d: 5.2, dl: 2.4, r: 18, c: "#60a5fa" },
  { g: "♪", x: -110, s: 16, d: 4.5, dl: 3.1, r: -20, c: "#34d399" },
  { g: "♫", x: 20, s: 22, d: 4.6, dl: 3.8, r: 6, c: "#e879f9" },
];

function Disc({ song, onOpen, phase }: { song: Song; onOpen?: () => void; phase: "in" | "out" }) {
  const inner = (
    <div className="vinyl" aria-hidden="true">
      <div className="vinyl-disc">
        <div className="vinyl-label">
          <Cover src={song.cover} size={86} />
        </div>
      </div>
    </div>
  );
  return phase === "out" ? (
    <div className="deck-disc d-out" aria-hidden="true">{inner}</div>
  ) : (
    <button type="button" className="deck-disc d-in" onClick={onOpen} aria-label={`Abrir la ficha de ${song.title}`}>
      {inner}
    </button>
  );
}

/** Vinilo que gira y, si hay varias canciones en la sección, va pasando de una a otra con un giro de disco. */
export function VinylDeck({ songs, onOpen, empty }: Props) {
  const n = songs.length;
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const cur = n ? Math.min(idx, n - 1) : 0;

  const go = (to: number) => {
    if (n < 2) return;
    const next = (to + n) % n;
    if (next === cur) return;
    setLeaving(cur);
    setIdx(next);
    window.setTimeout(() => setLeaving(null), 700);
  };

  useEffect(() => {
    if (n < 2 || paused || prefersReducedMotion()) return;
    const t = window.setTimeout(() => {
      setLeaving(cur);
      setIdx((cur + 1) % n);
      window.setTimeout(() => setLeaving(null), 700);
    }, 6000);
    return () => window.clearTimeout(t);
  }, [cur, n, paused]);

  const song = songs[cur];
  const out = leaving !== null ? songs[leaving] : undefined;

  return (
    <div className="np deck" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="deck-stage">
        {out && <Disc key={`o-${out.id}`} song={out} phase="out" />}
        {song ? (
          <Disc key={`i-${song.id}`} song={song} phase="in" onOpen={() => onOpen(song.id)} />
        ) : (
          <div className="vinyl" aria-hidden="true">
            <div className="vinyl-disc">
              <div className="vinyl-label">
                <Cover size={86} />
              </div>
            </div>
          </div>
        )}
      </div>
      {song && (
        <div className="notes" aria-hidden="true">
          {NOTES.map((n, i) => (
            <span key={`${song.id}-${i}`} style={{ "--x": `${n.x}px`, "--s": `${n.s}px`, "--d": `${n.d}s`, "--dl": `${n.dl}s`, "--r": `${n.r}deg`, "--c": n.c } as React.CSSProperties}>
              {n.g}
            </span>
          ))}
        </div>
      )}
      <div className="eq" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <i key={i} style={{ animationDelay: `${-((i * 37) % 13) / 10}s`, animationDuration: `${0.9 + ((i * 7) % 6) / 10}s` }} />
        ))}
      </div>
      {song ? (
        <p className="np-t" key={song.id} aria-live="polite">
          <strong>{song.title}</strong>
          <small>{[song.artist, song.key].filter(Boolean).join(" · ")}</small>
        </p>
      ) : (
        <p className="np-t">
          <strong>Nada por aquí todavía</strong>
          <small>{empty}</small>
        </p>
      )}
      {n > 1 && (
        <div className="deck-nav">
          <button type="button" className="icon-btn h-10 w-10 text-base" onClick={() => go(cur - 1)} aria-label="Canción anterior">
            <Icon name="left" />
          </button>
          <div className="deck-dots" role="tablist" aria-label="Canciones">
            {songs.map((s, i) => (
              <button key={s.id} type="button" role="tab" aria-selected={i === cur} aria-label={`${i + 1}. ${s.title}`} className={cn("deck-dot", i === cur && "on")} onClick={() => go(i)} />
            ))}
          </div>
          <button type="button" className="icon-btn h-10 w-10 text-base" onClick={() => go(cur + 1)} aria-label="Canción siguiente">
            <Icon name="right" />
          </button>
        </div>
      )}
    </div>
  );
}
