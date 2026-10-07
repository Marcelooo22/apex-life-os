"use client";

import { useState } from "react";
import { ViewShell } from "@/components/layout/view-shell";
import { Icon } from "@/components/ui/icon";
import { Rings } from "@/components/ui/rings";
import { Segmented } from "@/components/ui/segmented";
import { useAppState } from "@/hooks/use-app-state";
import { SONG_STATUS } from "@/lib/constants";
import type { SongStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SongCard } from "./song-card";
import { TrackSearch } from "./track-search";
import { useHobbySheets } from "./use-hobby-sheets";
import { NowPlaying } from "./vinyl";

type StatusFilter = "all" | SongStatus;

/** Sección "Repertorio": biblioteca musical con buscador, estados de estudio y vinilo. */
export function HobbiesView() {
  const { hobbies } = useAppState();
  const sheets = useHobbySheets();
  const instruments = hobbies.instruments;
  const [instrumentId, setInstrumentId] = useState(instruments[0]?.id ?? "");
  const [status, setStatus] = useState<StatusFilter>("all");
  const current = instruments.find((i) => i.id === instrumentId) ?? instruments[0];

  if (!current) {
    return (
      <ViewShell title="Repertorio" subtitle="Práctica deliberada, piezas y sobrecarga musical." action={{ label: "Gestionar hobbies e instrumentos", onClick: () => sheets.instrument(undefined, setInstrumentId) }}>
        <div className="empty">
          No tienes ningún hobby o instrumento configurado.
          <br />
          <br />
          <button type="button" className="btn primary" onClick={() => sheets.instrument(undefined, setInstrumentId)}>
            Crear instrumento o hobby
          </button>
        </div>
      </ViewShell>
    );
  }

  const songs = current.songs;
  const mastered = songs.filter((s) => s.status === "Dominada").length;
  const percent = songs.length ? Math.round((mastered / songs.length) * 100) : 0;
  const filtered = songs.filter((s) => status === "all" || s.status === status);
  const practicing = songs.find((s) => s.status === "En práctica");
  const statusOptions = [{ value: "all" as StatusFilter, label: `Todas ${songs.length}` }, ...SONG_STATUS.map((s) => ({ value: s as StatusFilter, label: `${s} ${songs.filter((x) => x.status === s).length}` }))];

  const left = (
    <>
      <section className="card">
        <div className="card-h">
          <h3>Instrumentos</h3>
          <button type="button" className="icon-btn h-10 w-10 text-base" onClick={() => sheets.instrument(undefined, setInstrumentId)} aria-label="Añadir instrumento">
            <Icon name="plus" />
          </button>
        </div>
        <ul className="inst-list">
          {instruments.map((i) => (
            <li key={i.id}>
              <button type="button" className={cn("inst", i.id === current.id && "on")} aria-pressed={i.id === current.id} onClick={() => { setInstrumentId(i.id); setStatus("all"); }}>
                <span>
                  <strong>{i.name}</strong>
                  <small>{i.detail || "Sin detalle"}</small>
                </span>
                <b>{i.songs.length}</b>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn quiet sm mt-2" onClick={() => sheets.instrument(current.id)}>
          Ajustes de {current.name}
        </button>
      </section>
      <section className="card">
        <div className="card-h">
          <h3>Biblioteca</h3>
        </div>
        <dl className="kv">
          {SONG_STATUS.map((s) => (
            <div key={s}>
              <dt>{s}</dt>
              <dd>{songs.filter((x) => x.status === s).length}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );

  const right = (
    <>
      <section className="card">
        <div className="card-h">
          <h3>Ahora practicando</h3>
        </div>
        <NowPlaying song={practicing} />
      </section>
      <section className="card sum">
        <div className="rings">
          <Rings items={[{ r: 80, s: 18, c: "#c084fc", p: songs.length ? mastered / songs.length : 0 }]} label={`${mastered} de ${songs.length} dominadas`} />
          <div className="rings-c">
            <b>{percent}%</b>
          </div>
        </div>
        <div>
          <h3>{current.name}</h3>
          <p>
            <b>{mastered}</b> de <b>{songs.length}</b> dominadas
          </p>
        </div>
      </section>
    </>
  );

  return (
    <ViewShell
      title="Repertorio"
      subtitle="Práctica deliberada, piezas y sobrecarga musical."
      action={{ label: "Gestionar hobbies e instrumentos", onClick: () => sheets.instrument(current.id) }}
      columns={{ left, right, labels: ["Instrumentos", "Biblioteca", "Práctica"] }}
    >
      <TrackSearch onPick={(t) => sheets.fromTrack(current.id, t)} onManual={() => sheets.song(current.id)} />
      <Segmented label="Filtrar por estado" options={statusOptions} value={status} onChange={setStatus} tight className="my-3.5" />
      {filtered.length === 0 ? (
        <div className="empty">
          {songs.length ? "No hay canciones con este estado." : "Tu biblioteca está vacía."}
          <br />
          Busca arriba una canción o <button type="button" className="lnk" onClick={() => sheets.song(current.id)}>añádela a mano</button>.
        </div>
      ) : (
        filtered.map((song) => <SongCard key={song.id} song={song} instrumentId={current.id} onEdit={(id) => sheets.song(current.id, id)} />)
      )}
    </ViewShell>
  );
}
