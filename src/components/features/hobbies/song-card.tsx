"use client";

import { Icon } from "@/components/ui/icon";
import { SONG_STATUS } from "@/lib/constants";
import { formatDuration } from "@/lib/music";
import { useAppState } from "@/hooks/use-app-state";
import { fetchSongInfo, listenLink, PLATFORMS } from "@/lib/songinfo";
import { toast } from "@/lib/toast";
import { useState } from "react";
import { updateState } from "@/lib/store";
import type { Song } from "@/lib/types";
import { haptic, num, safeUrl } from "@/lib/utils";
import { Cover } from "./track-search";

interface Props {
  song: Song;
  instrumentId: string;
  onEdit: (songId: string) => void;
}

/** Tarjeta de una canción del repertorio, con su carátula oficial. */
export function SongCard({ song, instrumentId, onEdit }: Props) {
  const { prefs } = useAppState();
  const [looking, setLooking] = useState(false);
  const platform = PLATFORMS.find((p) => p.id === prefs.musicPlatform) ?? PLATFORMS[0]!;
  const bpm = song.bpmTarget ? `${song.bpmCurrent || "—"}/${song.bpmTarget} BPM` : song.bpmCurrent ? `${song.bpmCurrent} BPM` : "";
  // Un enlace propio (tablatura, video) se conserva; los de Deezer antiguos se sustituyen por la plataforma preferida.
  const material = song.link && !/deezer\.com/.test(song.link) ? safeUrl(song.link) : "";
  const missing = !song.key || !song.bpmTarget;

  const autofill = async () => {
    setLooking(true);
    const info = await fetchSongInfo({ title: song.title, artist: song.artist });
    setLooking(false);
    if (!info || (!info.bpm && !info.key)) return toast("No encontré datos de esta canción");
    edit((s) => {
      if (info.bpm && !s.bpmTarget) s.bpmTarget = info.bpm;
      if (info.key && !s.key) s.key = info.key;
    });
    toast(`${[info.bpm ? `${info.bpm} BPM` : "", info.key ?? ""].filter(Boolean).join(" · ")}${info.approx ? " (estimado por IA)" : ""}`);
  };

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
      <div className="sc-top">
        <Cover src={song.cover} size={64} />
        <div className="sc-info">
          <strong>{song.title}</strong>
          <div className="song-meta">
            {song.artist && <span>{song.artist}</span>}
            {song.album && <span>• {song.album}</span>}
            {song.durationSec ? <span>• {formatDuration(song.durationSec)}</span> : null}
            {!song.album && song.genre && <span>• {song.genre}</span>}
          </div>
        </div>
        <button type="button" className="badge" data-st={song.status} onClick={cycleStatus} aria-label={`Estado: ${song.status}. Toca para avanzar`}>
          {song.status}
        </button>
      </div>
      <div className="song-tags">
        {song.key && <span className="badge key">{song.key}</span>}
        {song.tuning && <span className="badge tun">{song.tuning}</span>}
        {bpm && <span className="badge bpm">{bpm}</span>}
        <a href={listenLink(prefs.musicPlatform, song.title, song.artist)} target="_blank" rel="noopener noreferrer" className="badge listen">
          Escuchar en {platform.label} <Icon name="link" />
        </a>
        {material && (
          <a href={material} target="_blank" rel="noopener noreferrer" className="badge text-[#c084fc]">
            Material <Icon name="link" />
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
        <div className="row2 gap-1">
          {missing && (
            <button type="button" className="btn ghost sm" onClick={autofill} disabled={looking}>
              {looking ? "Buscando…" : "Buscar BPM y tono"}
            </button>
          )}
          <button type="button" className="btn quiet sm" onClick={() => onEdit(song.id)}>
            Editar
          </button>
        </div>
      </div>
    </article>
  );
}
