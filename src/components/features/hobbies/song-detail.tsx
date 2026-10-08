"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useAppState } from "@/hooks/use-app-state";
import { startMetronome } from "@/lib/audio";
import { SONG_STATUS } from "@/lib/constants";
import { formatDuration } from "@/lib/music";
import { updateState } from "@/lib/store";
import { fetchSongInfo, listenLink, PLATFORMS } from "@/lib/songinfo";
import { songStatusFx } from "@/lib/status-fx";
import { toast } from "@/lib/toast";
import type { Song } from "@/lib/types";
import { cn, haptic, num, safeUrl } from "@/lib/utils";
import { Cover } from "./track-search";

interface Props {
  songId: string;
  instrumentId: string;
  onClose: () => void;
  onEdit: (songId: string) => void;
}

/** Ficha grande de una canción: carátula con el disco saliendo, datos clave, enlace directo y metrónomo. */
export function SongDetail({ songId, instrumentId, onClose, onEdit }: Props) {
  const { hobbies, prefs } = useAppState();
  const song = hobbies.instruments.find((i) => i.id === instrumentId)?.songs.find((s) => s.id === songId);
  const [closing, setClosing] = useState(false);
  const [metro, setMetro] = useState(false);
  const [looking, setLooking] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const bpm = num(song?.bpmCurrent) || num(song?.bpmTarget) || 0;

  const close = () => {
    setClosing(true);
    setMetro(false);
    setTimeout(onClose, 240);
  };

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!metro || !bpm) return;
    return startMetronome(bpm);
  }, [metro, bpm]);

  if (!song) return null;
  const platform = PLATFORMS.find((p) => p.id === prefs.musicPlatform) ?? PLATFORMS[0]!;
  const material = song.link && !/deezer\.com/.test(song.link) ? safeUrl(song.link) : "";
  const missing = !song.bpmTarget || !song.key;

  const edit = (recipe: (s: Song) => void) =>
    updateState((d) => {
      const target = d.hobbies.instruments.find((i) => i.id === instrumentId)?.songs.find((s) => s.id === song.id);
      if (target) recipe(target);
    });

  const step = (delta: number) => {
    haptic(8);
    edit((s) => {
      s.bpmCurrent = Math.max(30, Math.min(300, (num(s.bpmCurrent) || num(s.bpmTarget) || 100) + delta));
    });
  };

  const autofill = async () => {
    setLooking(true);
    const info = await fetchSongInfo({ title: song.title, artist: song.artist });
    setLooking(false);
    if (!info || (!info.bpm && !info.key)) return toast("No encontré datos de esta canción");
    edit((s) => {
      if (info.bpm && !s.bpmTarget) s.bpmTarget = info.bpm;
      if (info.key && !s.key) s.key = info.key;
      if (info.timeSig && !s.timeSig) s.timeSig = info.timeSig;
      if (info.year && !s.year) s.year = info.year;
      if (info.genres?.length && !s.genres?.length) s.genres = info.genres;
    });
    toast(`${[info.bpm ? `${info.bpm} BPM` : "", info.key ?? ""].filter(Boolean).join(" · ")}${info.approx ? " (estimado por IA)" : ""}`);
  };

  const facts: [string, string][] = [
    ["BPM original", song.bpmTarget ? String(song.bpmTarget) : ""],
    ["Tono", song.key],
    ["Compás", song.timeSig ?? ""],
    ["Año", song.year ? String(song.year) : ""],
    ["Duración", song.durationSec ? formatDuration(song.durationSec) : ""],
    ["Álbum", song.album ?? ""],
    ["Género", song.genres?.join(", ") || song.genre],
  ];

  return (
    <div className={cn("sd-back", closing && "sd-out")} onClick={close}>
      <div className="sd" role="dialog" aria-modal="true" aria-label={`Ficha de ${song.title}`} onClick={(e) => e.stopPropagation()}>
        <button ref={closeBtn} type="button" className="icon-btn sd-x" onClick={close} aria-label="Cerrar">
          <Icon name="x" />
        </button>

        <div className="sd-art">
          <span className="sd-disc" aria-hidden="true">
            <i />
          </span>
          <div className="sd-cover">
            <Cover src={song.cover} size={220} />
          </div>
        </div>

        <div className="sd-body">
          <h2>{song.title}</h2>
          <p className="muted">{song.artist}</p>

          <div className="sd-status" role="radiogroup" aria-label="Estado de estudio">
            {SONG_STATUS.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={song.status === s} className={cn("chip", song.status === s && "on")} onClick={() => {
                  songStatusFx(song.status, s);
                  edit((x) => void (x.status = s));
                }}>
                {s}
              </button>
            ))}
          </div>

          <a className="btn primary big sd-listen" href={listenLink(prefs.musicPlatform, song.title, song.artist)} target="_blank" rel="noopener noreferrer">
            Escuchar en {platform.label} <Icon name="link" />
          </a>

          <dl className="sd-facts">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {missing && (
            <button type="button" className="btn ghost sm" onClick={autofill} disabled={looking}>
              {looking ? "Buscando…" : "Buscar BPM y datos de la canción"}
            </button>
          )}

          <div className="sd-metro">
            <div className="sd-m-h">
              <b>Tu práctica</b>
              <div className="row2 gap-1">
                <button type="button" className="btn quiet sm px-2" onClick={() => step(-5)} aria-label="Bajar 5 BPM">
                  −5
                </button>
                <span className="sd-bpm">{bpm ? `${bpm} BPM` : "— BPM"}</span>
                <button type="button" className="btn quiet sm px-2" onClick={() => step(5)} aria-label="Subir 5 BPM">
                  +5
                </button>
              </div>
            </div>
            <div className="sd-m-b">
              <span className={cn("sd-pulse", metro && bpm > 0 && "on")} style={bpm ? { animationDuration: `${60 / bpm}s` } : undefined} aria-hidden="true" />
              <button type="button" className={cn("btn", metro ? "primary" : "ghost")} disabled={!bpm} onClick={() => setMetro((m) => !m)} aria-pressed={metro}>
                <Icon name={metro ? "pause" : "play"} /> {metro ? "Parar metrónomo" : "Metrónomo"}
              </button>
            </div>
            <p className="muted sd-tip">Empieza unos 10-20 BPM por debajo del original y sube de 5 en 5 cuando salga limpia.</p>
          </div>

          {song.notes && <p className="sd-notes">{song.notes}</p>}

          <div className="row gap">
            {material && (
              <a className="btn ghost" href={material} target="_blank" rel="noopener noreferrer">
                Material <Icon name="link" />
              </a>
            )}
            <button
              type="button"
              className="btn quiet"
              onClick={() => {
                close();
                setTimeout(() => onEdit(song.id), 250);
              }}
            >
              Editar
            </button>
          </div>
          <p className="muted sd-credit">
            Datos de <a href="https://getsongbpm.com" target="_blank" rel="noopener noreferrer">GetSongBPM.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
