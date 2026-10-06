"use client";

import { Icon } from "@/components/ui/icon";
import { SONG_STATUS } from "@/lib/constants";
import { updateState } from "@/lib/store";
import type { Song } from "@/lib/types";
import { haptic, num, safeUrl } from "@/lib/utils";

interface Props {
  song: Song;
  instrumentId: string;
  onEdit: (songId: string) => void;
}

/** Tarjeta de una canción del repertorio. */
export function SongCard({ song, instrumentId, onEdit }: Props) {
  const bpm = song.bpmTarget
    ? `${song.bpmCurrent || "—"}/${song.bpmTarget} BPM`
    : song.bpmCurrent
      ? `${song.bpmCurrent} BPM`
      : "";
  const link = song.link ? safeUrl(song.link) : "";

  const edit = (recipe: (s: Song) => void) =>
    updateState((d) => {
      const target = d.hobbies.instruments.find((i) => i.id === instrumentId)?.songs.find((s) => s.id === song.id);
      if (target) recipe(target);
    });

  const cycleStatus = () => {
    haptic(12);
    edit((s) => {
      s.status = SONG_STATUS[(SONG_STATUS.indexOf(s.status) + 1) % SONG_STATUS.length] ?? "Por aprender";
    });
  };

  const stepBpm = (delta: number) => {
    haptic(8);
    edit((s) => {
      const base = num(s.bpmCurrent) || num(s.bpmTarget) || 100;
      s.bpmCurrent = Math.max(30, Math.min(300, base + delta));
    });
  };

  return (
    <article className="song-card">
      <div className="song-head">
        <div>
          <strong>{song.title}</strong>
          <div className="song-meta">
            {song.artist && <span>{song.artist}</span>}
            {song.genre && <span>• {song.genre}</span>}
          </div>
        </div>
        <button type="button" className="badge" data-st={song.status} onClick={cycleStatus} aria-label={`Estado: ${song.status}. Toca para avanzar`}>
          {song.status}
        </button>
      </div>
      <div className="song-tags">
        {song.key && <span className="badge key">{song.key}</span>}
        {bpm && <span className="badge bpm">{bpm}</span>}
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="badge text-[#c084fc]">
            Audio <Icon name="link" />
          </a>
        )}
      </div>
      {song.notes && <p className="muted text-[12.5px] leading-[1.4]">{song.notes}</p>}
      <div className="song-actions">
        <div className="row2 gap-1">
          <button type="button" className="btn quiet sm px-2" onClick={() => stepBpm(-5)} title="Bajar 5 BPM">
            −5
          </button>
          <button type="button" className="btn quiet sm px-2" onClick={() => stepBpm(5)} title="Subir 5 BPM">
            +5
          </button>
        </div>
        <button type="button" className="btn quiet sm" onClick={() => onEdit(song.id)}>
          Editar
        </button>
      </div>
    </article>
  );
}
