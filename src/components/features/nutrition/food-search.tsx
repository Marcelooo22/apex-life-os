"use client";

import { SearchField } from "@/components/ui/search-field";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { searchFood, type FoodHit } from "@/lib/food";
import { foodEmoji } from "@/lib/food-emoji";

interface Props {
  onPick: (food: FoodHit) => void;
  onManual: () => void;
}

/** Busca alimentos en Open Food Facts (a partir de 2 caracteres, con 300 ms de espera). */
export function FoodSearch({ onPick, onManual }: Props) {
  const s = useDebouncedSearch<FoodHit>({ fetcher: searchFood, minChars: 2, delay: 300 });
  const busy = s.searchable && (s.status === "loading" || s.pending);

  return (
    <div className="t-search f-search">
      <SearchField value={s.query} onChange={s.setQuery} label="Buscar alimentos" placeholder="Busca un alimento, p. ej. pechuga de pollo" busy={busy} />
      {s.searchable && (
        <div className="t-res" aria-live="polite">
          {busy && s.results.length === 0 ? (
            [0, 1, 2].map((i) => <div key={i} className="f-row sk" aria-hidden="true" />)
          ) : s.status === "error" ? (
            <div className="t-msg">
              <p>{s.error}</p>
              <button type="button" className="btn ghost sm" onClick={s.retry}>
                Reintentar
              </button>
              <button type="button" className="btn quiet sm" onClick={onManual}>
                Añadir sin buscar
              </button>
            </div>
          ) : s.results.length === 0 ? (
            <div className="t-msg">
              <p>Sin resultados para «{s.term}».</p>
              <button type="button" className="btn ghost sm" onClick={onManual}>
                Añadir sin buscar
              </button>
            </div>
          ) : (
            <ul className={busy ? "stale" : undefined}>
              {s.results.map((f) => (
                <li key={f.id}>
                  <button type="button" className="f-row" onClick={() => onPick(f)}>
                    <span className="f-emoji" aria-hidden="true">{foodEmoji(f.name)}</span>
                    <span className="t-info">
                      <strong>{f.name}</strong>
                      <small>{f.brand || "Sin marca"} · por 100 g</small>
                    </span>
                    <span className="f-kcal">
                      <b>{f.per100.kcal}</b> kcal
                      <small>
                        P {f.per100.p} · C {f.per100.c} · G {f.per100.f}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!s.searchable && (
        <button type="button" className="lnk f-manual" onClick={onManual}>
          Añadir sin buscar
        </button>
      )}
    </div>
  );
}
