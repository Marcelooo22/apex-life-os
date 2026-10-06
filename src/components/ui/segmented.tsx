import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Versión compacta para muchas opciones. */
  tight?: boolean;
  /** Botón extra al final (p. ej. "+" para añadir). */
  trailing?: ReactNode;
  className?: string;
}

/** Selector segmentado accesible (grupo de radios). */
export function Segmented<T extends string>({ label, options, value, onChange, tight, trailing, className }: SegmentedProps<T>) {
  return (
    <div className={cn("seg", tight && "tight", className)} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={cn("seg-b", o.value === value && "on")}
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
      {trailing}
    </div>
  );
}
