"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { EXERCISES, searchExercises, ZONE_LABEL, type Muscle } from "@/lib/exercises";
import { cn } from "@/lib/utils";

const FILTERS: readonly (Muscle | "all")[] = ["all", "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Piernas", "Core"];
const normal = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

interface Props {
  /** Ejercicios ya elegidos (por nombre) al abrir. */
  initial: readonly string[];
  /** Nombre del campo del formulario (guarda la lista como JSON). */
  name: string;
}

/** Selector con todos los ejercicios del catálogo: busca, filtra por músculo y marca varios de una vez. */
export function ExercisePicker({ initial, name }: Props) {
  const [selected, setSelected] = useState<string[]>([...initial]);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<Muscle | "all">("all");
  const results = useMemo(() => searchExercises(query, muscle), [query, muscle]);
  const typed = query.trim();
  const exact = typed ? EXERCISES.some((e) => normal(e.name) === normal(typed)) || selected.some((s) => normal(s) === normal(typed)) : true;

  const toggle = (n: string) => setSelected((cur) => (cur.some((c) => normal(c) === normal(n)) ? cur.filter((c) => normal(c) !== normal(n)) : [...cur, n]));
  const has = (n: string) => selected.some((c) => normal(c) === normal(n));

  return (
    <div className="xp">
      <input type="hidden" name={name} value={JSON.stringify(selected)} />
      {selected.length > 0 && (
        <div className="xp-sel" aria-label="Ejercicios elegidos">
          {selected.map((n) => (
            <button key={n} type="button" className="chip on" onClick={() => toggle(n)} aria-label={`Quitar ${n}`}>
              {n} <Icon name="x" />
            </button>
          ))}
        </div>
      )}
      <div className="spot xp-search">
        <Icon name="search" className="spot-i" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          placeholder="Busca: press banca, sentadilla…"
          aria-label="Buscar ejercicio"
          autoComplete="off"
        />
      </div>
      <div className="xp-filters" role="group" aria-label="Filtrar por músculo">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={cn("chip", muscle === f && "on")} onClick={() => setMuscle(f)} aria-pressed={muscle === f}>
            {f === "all" ? "Todos" : f}
          </button>
        ))}
      </div>
      <ul className="xp-list">
        {typed && !exact && (
          <li>
            <button type="button" className="xp-row custom" onClick={() => { toggle(typed); setQuery(""); }}>
              <span className="xp-chk"><Icon name="plus" /></span>
              <span className="t-info"><strong>Añadir «{typed}»</strong><small>Ejercicio propio</small></span>
            </button>
          </li>
        )}
        {results.map((ex) => (
          <li key={ex.id}>
            <button type="button" className={cn("xp-row", has(ex.name) && "on")} onClick={() => toggle(ex.name)} aria-pressed={has(ex.name)}>
              <span className="xp-chk"><Icon name="check" /></span>
              <span className="t-info">
                <strong>{ex.name}</strong>
                <small>
                  {ex.equip} · {ex.zones.slice(0, 2).map((z) => ZONE_LABEL[z]).join(", ")}
                </small>
              </span>
            </button>
          </li>
        ))}
        {!results.length && (!typed || exact) && <li className="muted xp-empty">Sin resultados. Prueba con otra palabra.</li>}
      </ul>
    </div>
  );
}

/** Lee el valor que guarda ExercisePicker. */
export function parsePicks(value: string | undefined): string[] {
  try {
    const list: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(list) ? list.map((x) => String(x).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

