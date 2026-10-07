"use client";

import { useSheet } from "@/components/ui/sheet-provider";
import { findTerm } from "@/lib/glossary";

/** Botoncito "i" que explica un término en lenguaje sencillo. */
export function InfoTip({ term, label }: { term: string; label?: string }) {
  const { openSheet } = useSheet();
  const t = findTerm(term);
  if (!t) return null;
  return (
    <button
      type="button"
      className="info-tip"
      aria-label={label ?? `¿Qué es ${t.title}?`}
      onClick={(e) => {
        e.stopPropagation();
        openSheet({
          title: t.title,
          text: t.short,
          focus: false,
          children: t.points ? (
            <ul className="tip-list">
              {t.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : undefined,
        });
      }}
    >
      i
    </button>
  );
}
