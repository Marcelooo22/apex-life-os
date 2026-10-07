"use client";

import { Icon } from "@/components/ui/icon";
import { SearchField } from "@/components/ui/search-field";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { formatDuration, searchTracks, type TrackHit } from "@/lib/music";

/** Carátula cuadrada redondeada (con marcador si el tema no tiene imagen). */
export function Cover({ src, size = 56 }: { src?: string; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="cover" src={src} alt="" width={size} height={size} loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ width: size, height: size }} />
  ) : (
    <span className="cover ph" style={{ width: size, height: size }} aria-hidden="true">
      <Icon name="music" />
    </span>
  );
}

interface Props {
  onPick: (track: TrackHit) => void;
  onManual: () => void;
}

/** Buscador de canciones: no muestra nada hasta que escribes al menos 2 caracteres. */
export function TrackSearch({ onPick, onManual }: Props) {
  const s = useDebouncedSearch<TrackHit>({ fetcher: searchTracks, minChars: 2, delay: 300 });
  const busy = s.searchable && (s.status === "loading" || s.pending);

  return (
    <div className="t-search">
      <SearchField value={s.query} onChange={s.setQuery} label="Buscar canciones" placeholder="Busca una canción o artista" busy={busy} />
      {s.searchable && (
        <div className="t-res" aria-live="polite">
          {busy && s.results.length === 0 ? (
            [0, 1, 2].map((i) => <div key={i} className="t-row sk" aria-hidden="true" />)
          ) : s.status === "error" ? (
            <div className="t-msg">
              <p>{s.error}</p>
              <button type="button" className="btn ghost sm" onClick={s.retry}>
                Reintentar
              </button>
              <button type="button" className="btn quiet sm" onClick={onManual}>
                Añadir manualmente
              </button>
            </div>
          ) : s.results.length === 0 ? (
            <div className="t-msg">
              <p>Sin resultados para «{s.term}».</p>
              <button type="button" className="btn ghost sm" onClick={onManual}>
                Añadir manualmente
              </button>
            </div>
          ) : (
            <ul className={busy ? "stale" : undefined}>
              {s.results.map((t) => (
                <li key={t.id}>
                  <button type="button" className="t-row" onClick={() => onPick(t)} aria-label={`Añadir ${t.title}, de ${t.artist}`}>
                    <Cover src={t.cover} />
                    <span className="t-info">
                      <strong>{t.title}</strong>
                      <small>
                        {t.artist}
                        {t.album ? ` · ${t.album}` : ""}
                      </small>
                    </span>
                    <span className="t-dur">{t.durationSec ? formatDuration(t.durationSec) : ""}</span>
                    <span className="t-add" aria-hidden="true">
                      <Icon name="plus" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
