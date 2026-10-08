"use client";

import type { KeyboardEvent } from "react";
import { formatDuration } from "@/lib/music";
import type { Song } from "@/lib/types";
import { Cover } from "./track-search";

interface Props {
  song: Song;
  onOpen: (songId: string) => void;
}

/** Tarjeta compacta del repertorio: flota al pasar el cursor y abre la ficha grande al tocarla. */
export function SongCard({ song, onOpen }: Props) {
  const bpm = song.bpmCurrent && song.bpmTarget ? `${song.bpmCurrent}/${song.bpmTarget} BPM` : song.bpmTarget ? `${song.bpmTarget} BPM` : song.bpmCurrent ? `${song.bpmCurrent} BPM` : "";
  const open = () => onOpen(song.id);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };
  return (
    <article className="song-card" role="button" tabIndex={0} onClick={open} onKeyDown={onKey} aria-label={`Abrir la ficha de ${song.title}, de ${song.artist}`}>
      <div className="sc-top">
        <div className="sc-art">
          <span className="sc-disc" aria-hidden="true" />
          <Cover src={song.cover} size={64} />
        </div>
        <div className="sc-info">
          <strong>{song.title}</strong>
          <div className="song-meta">
            {song.artist && <span>{song.artist}</span>}
            {song.durationSec ? <span>• {formatDuration(song.durationSec)}</span> : null}
          </div>
        </div>
        <span className="badge" data-st={song.status}>
          {song.status}
        </span>
      </div>
      {(bpm || song.key || song.timeSig) && (
        <div className="song-tags">
          {bpm && <span className="badge bpm">{bpm}</span>}
          {song.key && <span className="badge key">{song.key}</span>}
          {song.timeSig && <span className="badge tun">{song.timeSig}</span>}
        </div>
      )}
    </article>
  );
}
