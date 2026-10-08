"use client";

import { useState } from "react";
import { ViewShell } from "@/components/layout/view-shell";
import { Icon } from "@/components/ui/icon";
import { Rings } from "@/components/ui/rings";
import { Segmented } from "@/components/ui/segmented";
import { useSheet } from "@/components/ui/sheet-provider";
import { useAppState } from "@/hooks/use-app-state";
import { SONG_STATUS } from "@/lib/constants";
import { updateState } from "@/lib/store";
import { PLATFORMS } from "@/lib/songinfo";
import { toast } from "@/lib/toast";
import type { SongStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SongCard } from "./song-card";
import { SongDetail } from "./song-detail";
import { TrackSearch } from "./track-search";
import { useHobbySheets } from "./use-hobby-sheets";
import { VinylDeck } from "./vinyl";

type StatusFilter = "all" | SongStatus;

/** Sección "Repertorio": biblioteca musical con buscador, estados de estudio y vinilo. */
export function HobbiesView() {
  const { hobbies, prefs } = useAppState();
  const sheets = useHobbySheets();
  const { openSheet, closeSheet } = useSheet();
  const [openId, setOpenId] = useState<string | null>(null);
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
  const practicing = songs.filter((s) => s.status === "En práctica");
  // El disco recorre las canciones de la sección que estás mirando (o las que practicas ahora).
  const deck = status !== "all" ? filtered : practicing.length ? practicing : songs;
  const deckTitle = status !== "all" ? status : practicing.length ? "Ahora practicando" : "Tu repertorio";
  const platform = PLATFORMS.find((p) => p.id === prefs.musicPlatform) ?? PLATFORMS[0]!;
  const pickPlatform = (id: (typeof PLATFORMS)[number]["id"]) =>
    updateState((d) => {
      d.prefs.musicPlatform = id;
      d.prefs.platformSet = true;
    });
  const changePlatform = () =>
    openSheet({
      title: "¿Dónde escuchas música?",
      text: "Todos los botones «Escuchar» te llevarán a esta plataforma.",
      focus: false,
      children: (
        <div className="prog-list">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn("prog", prefs.musicPlatform === p.id && "on")}
              onClick={() => {
                pickPlatform(p.id);
                closeSheet();
                toast(`Plataforma: ${p.label}`);
              }}
            >
              <span className="prog-h">
                <strong>{p.label}{prefs.musicPlatform === p.id ? " · actual" : ""}</strong>
              </span>
            </button>
          ))}
        </div>
      ),
    });
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
          <h3>{deckTitle}</h3>
          {deck.length > 1 && <span className="muted text-[12.5px]">{deck.length} canciones</span>}
        </div>
        <VinylDeck key={`${deckTitle}-${deck.map((d) => d.id).join(",")}`} songs={deck} onOpen={setOpenId} empty={status !== "all" ? "No hay canciones con este estado." : "Pasa una canción a «En práctica» y aparecerá aquí."} />
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
      assistant="hobbies"
      title="Repertorio"
      subtitle="Práctica deliberada, piezas y sobrecarga musical."
      action={{ label: "Gestionar hobbies e instrumentos", onClick: () => sheets.instrument(current.id) }}
      columns={{ left, right, labels: ["Instrumentos", "Biblioteca", "Práctica"] }}
    >
      {prefs.platformSet ? (
        <div className="plat">
          <span className="muted">
            Escuchas en <b className="text-[var(--text)]">{platform.label}</b>
          </span>
          <button type="button" className="lnk text-[13px]" onClick={changePlatform}>
            Cambiar
          </button>
        </div>
      ) : (
        <div className="plat" role="radiogroup" aria-label="Plataforma para escuchar">
          <span className="muted">¿Dónde escuchas música?</span>
          {PLATFORMS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={prefs.musicPlatform === p.id} className={cn("chip", prefs.musicPlatform === p.id && "on")} onClick={() => pickPlatform(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      )}
      <TrackSearch onPick={(t) => sheets.fromTrack(current.id, t)} onManual={() => sheets.song(current.id)} />
      <Segmented label="Filtrar por estado" options={statusOptions} value={status} onChange={setStatus} tight className="my-3.5" />
      {filtered.length === 0 ? (
        <div className="empty">
          {songs.length ? "No hay canciones con este estado." : "Tu biblioteca está vacía."}
          <br />
          Busca arriba una canción o <button type="button" className="lnk" onClick={() => sheets.song(current.id)}>añádela a mano</button>.
        </div>
      ) : (
        filtered.map((song) => <SongCard key={song.id} song={song} onOpen={setOpenId} />)
      )}
      <p className="muted attrib">
        BPM y tono con datos de{" "}
        <a href="https://getsongbpm.com" target="_blank" rel="noopener noreferrer">
          GetSongBPM.com
        </a>
        {" · "}
        <a href="/creditos" target="_blank" rel="noopener noreferrer">
          Créditos
        </a>
      </p>
      {openId && <SongDetail songId={openId} instrumentId={current.id} onClose={() => setOpenId(null)} onEdit={(id) => sheets.song(current.id, id)} />}
    </ViewShell>
  );
}