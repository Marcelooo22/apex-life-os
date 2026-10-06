"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { useNavigation } from "@/hooks/use-navigation";

interface ViewShellProps {
  title: string;
  subtitle?: ReactNode;
  /** Botón de ajustes arriba a la derecha. */
  action?: { label: string; onClick: () => void };
  /** Botón flotante "+" abajo a la derecha. */
  fab?: { label: string; onClick: () => void };
  children: ReactNode;
}

/** Estructura común de todas las secciones: barra superior, título, contenido y botón flotante. */
export function ViewShell({ title, subtitle, action, fab, children }: ViewShellProps) {
  const { back } = useNavigation();
  return (
    <>
      <div className="scroll">
        <div className="v-top">
          <div className="wrap bar">
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
        <div className="wrap">
          <header className="v-head">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </header>
          {children}
        </div>
      </div>
      {fab && (
        <button type="button" className="fab" onClick={fab.onClick}>
          <Icon name="plus" />
          {fab.label}
        </button>
      )}
    </>
  );
}
