"use client";

import { Icon } from "./icon";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  busy?: boolean;
  className?: string;
}

/** Barra de búsqueda estilo Spotlight: cerrada y limpia, sin sugerencias hasta que escribes. */
export function SearchField({ value, onChange, label, placeholder, busy, className }: Props) {
  return (
    <div className={cn("spot", busy && "busy", className)} role="search">
      <Icon name="search" className="spot-i" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
      />
      {busy && <span className="spot-spin" aria-hidden="true" />}
      {value && (
        <button type="button" className="spot-x" onClick={() => onChange("")} aria-label="Borrar búsqueda">
          <Icon name="x" />
        </button>
      )}
    </div>
  );
}
