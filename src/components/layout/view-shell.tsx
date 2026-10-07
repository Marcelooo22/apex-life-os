"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { useNavigation } from "@/hooks/use-navigation";
import { cn } from "@/lib/utils";

type Pane = "left" | "main" | "right";

export interface ShellColumns {
  /** Columna izquierda (contexto). */
  left: ReactNode;
  /** Columna derecha (métricas, agenda…). */
  right: ReactNode;
  /** Nombres de los tres paneles para el selector inferior del móvil: [izquierda, centro, derecha]. */
  labels: readonly [string, string, string];
}

interface ViewShellProps {
  title: string;
  subtitle?: ReactNode;
  /** Botón de ajustes arriba a la derecha. */
  action?: { label: string; onClick: () => void };
  /** Botón flotante "+" abajo a la derecha. */
  fab?: { label: string; onClick: () => void };
  /** Sustituye el encabezado estándar (título + subtítulo). */
  header?: ReactNode;
  /** Bloque a todo lo ancho entre el encabezado y las columnas. */
  top?: ReactNode;
  /** Diseño de tres columnas: en móvil las laterales pasan a un selector inferior. */
  columns?: ShellColumns;
  children: ReactNode;
}

/**
 * Estructura común de todas las secciones: barra superior, encabezado, contenido y botón flotante.
 * - ≥1100 px: tres columnas (contexto 22 % · trabajo 52 % · métricas 26 %).
 * - 760–1099 px: columna principal y las laterales apiladas a su derecha.
 * - <760 px: un panel a la vez, con selector segmentado abajo.
 */
export function ViewShell({ title, subtitle, action, fab, header, top, columns, children }: ViewShellProps) {
  const { back } = useNavigation();
  const [pane, setPane] = useState<Pane>("main");
  const dock = columns
    ? ([
        ["left", columns.labels[0]],
        ["main", columns.labels[1]],
        ["right", columns.labels[2]],
      ] as const)
    : null;

  return (
    <>
      <div className={cn("scroll", columns && "has-cols")}>
        <div className="v-top">
          <div className={cn("wrap bar", columns && "wide")}>
            <button type="button" className="pill" onClick={back}>
              <Icon name="back" />
              Inicio
            </button>
            {action && (
              <button type="button" className="icon-btn" onClick={action.onClick} aria-label={action.label}>
                <Icon name="sliders" />
              </button>
            )}
          </div>
        </div>
        <div className={cn("wrap", columns && "wide")}>
          {header ?? (
            <header className="v-head">
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </header>
          )}
          {top}
          {columns ? (
            <div className="cols" data-pane={pane}>
              <aside className="col col-left col-side" aria-label={columns.labels[0]}>
                {columns.left}
              </aside>
              <div className="col col-main">{children}</div>
              <aside className="col col-right col-side" aria-label={columns.labels[2]}>
                {columns.right}
              </aside>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
      {dock && (
        <nav className="dock" aria-label="Paneles de la sección">
          {dock.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={cn("dock-b", pane === id && "on")}
              aria-current={pane === id ? "page" : undefined}
              onClick={() => setPane(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {fab && (
        <button type="button" className={cn("fab", columns && "has-dock")} onClick={fab.onClick}>
          <Icon name="plus" />
          {fab.label}
        </button>
      )}
    </>
  );
}
