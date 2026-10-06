"use client";

import { useState } from "react";
import { ViewShell } from "@/components/layout/view-shell";
import { Icon } from "@/components/ui/icon";
import { Rings } from "@/components/ui/rings";
import { Segmented } from "@/components/ui/segmented";
import { useAppState } from "@/hooks/use-app-state";
import { SONG_STATUS } from "@/lib/constants";
import type { SongStatus } from "@/lib/types";
import { SongCard } from "./song-card";
import { useHobbySheets } from "./use-hobby-sheets";

type StatusFilter = "all" | SongStatus;

/** Sección "Repertorio": instrumentos, canciones y progreso de estudio. */
export function HobbiesView() {
  const { hobbies } = useAppState();
  const sheets = useHobbySheets();
  const instruments = hobbies.instruments;
  const [instrumentId, setInstrumentId] = useState(instruments[0]?.id ?? "");
  const [status, setStatus] = useState<StatusFilter>("all");

  const current = instruments.find((i) => i.id === instrumentId) ?? instruments[0];

  if (!current) {
    return (
      <ViewShell
        title="Repertorio"
        subtitle="Práctica deliberada, piezas y sobrecarga musical."
        action={{ label: "Gestionar hobbies e instrumentos", onClick: () => sheets.instrument(undefined, setInstrumentId) }}
      >
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
  const completed = songs.filter((s) => s.status === "Completada").length;
  const percent = songs.length ? Math.round((completed / songs.length) * 100) : 0;
  const filtered = songs.filter((s) => status === "all" || s.status === status);
  const statusOptions = [{ value: "all" as StatusFilter, label: `Todas ${songs.length}` }].concat(
    SONG_STATUS.map((s) => ({ value: s as StatusFilter, label: `${s} ${songs.filter((x) => x.status === s).length}` })),
  );

  return (
    <ViewShell
      title="Repertorio"
      subtitle="Práctica deliberada, piezas y sobrecarga musical."
      action={{ label: "Gestionar hobbies e instrumentos", onClick: () => sheets.instrument(current.id) }}
      fab={{ label: "Canción", onClick: () => sheets.song(current.id) }}
    >
      <section className="card sum">
        <div className="rings">
          <Rings items={[{ r: 80, s: 18, c: "#c084fc", p: songs.length ? completed / songs.length : 0 }]} label={`${completed} de ${songs.length} completadas`} />
          <div className="rings-c">
            <b>{percent}%</b>
          </div>
        </div>
        <div>
          <h3>{current.name}</h3>
          <p className="muted">{current.detail || "Sin especificación"}</p>
          <p className="mt-1">
            <b>{completed}</b> de <b>{songs.length}</b> en repertorio
          </p>
        </div>
      </section>

      <div className="card-h mb-1.5">
        <h3>Instrumento</h3>
        <button type="button" className="btn quiet sm" onClick={() => sheets.instrument(current.id)}>
          Ajustes
        </button>
      </div>
      <Segmented
        label="Instrumento o hobby"
        options={instruments.map((i) => ({ value: i.id, label: i.name }))}
        value={current.id}
        onChange={setInstrumentId}
        className="mb-3.5"
        trailing={
          <button type="button" className="seg-b" aria-label="Añadir instrumento" onClick={() => sheets.instrument(undefined, setInstrumentId)}>
            <Icon name="plus" />
          </button>
        }
      />

      <div className="card-h mb-1.5">
        <h3>Estado de estudio</h3>
      </div>
      <Segmented label="Filtrar por estado" options={statusOptions} value={status} onChange={setStatus} tight className="mb-3.5" />

      {filtered.length === 0 ? (
        <div className="empty">
          {songs.length ? "No hay canciones con este estado." : "Tu repertorio está vacío."}
          <br />
          Toca + para añadir tu primera canción.
        </div>
      ) : (
        filtered.map((song) => <SongCard key={song.id} song={song} instrumentId={current.id} onEdit={(id) => sheets.song(current.id, id)} />)
      )}
    </ViewShell>
  );
}
