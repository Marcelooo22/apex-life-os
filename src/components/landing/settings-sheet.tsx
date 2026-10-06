"use client";

import { useCallback } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { useBackup } from "@/hooks/use-backup";
import { isIOS, isStandalone, useInstallPrompt } from "@/hooks/use-install-prompt";
import { defaults } from "@/lib/defaults";
import { hideRest } from "@/lib/rest-timer";
import { getState, replaceState, updateState } from "@/lib/store";
import { toast } from "@/lib/toast";

/** Devuelve la función que abre la hoja de Ajustes (nombre, copia de seguridad, instalar, borrar). */
export function useSettingsSheet() {
  const { openSheet, closeSheet, confirm } = useSheet();
  const { exportData, pickImport } = useBackup();
  const install = useInstallPrompt();

  return useCallback(() => {
    const resetAll = () => {
      closeSheet(true);
      setTimeout(
        () =>
          confirm(
            "¿Borrar todo?",
            "Esta acción elimina gym, hábitos, nutrición, hobbies y universidad de este dispositivo.",
            "Borrar todo",
            () => {
              replaceState(defaults());
              hideRest();
              toast("Datos borrados");
            },
          ),
        60,
      );
    };

    openSheet({
      title: "Ajustes",
      theme: "none",
      submit: "Guardar",
      focus: false,
      fields: [{ name: "name", label: "Tu nombre (para el saludo)", type: "text", value: getState().name, placeholder: "Opcional" }],
      onSubmit: (v) => {
        const name = (v.name ?? "").trim();
        updateState((d) => {
          d.name = name;
        });
      },
      children: (
        <>
          <p className="txt mt-4">Tus datos viven solo en este dispositivo. Descarga una copia de vez en cuando.</p>
          <div className="row2">
            <button type="button" className="btn ghost" onClick={exportData}>
              Exportar copia
            </button>
            <button type="button" className="btn ghost" onClick={pickImport}>
              Importar copia
            </button>
          </div>
          {install && (
            <button
              type="button"
              className="btn ghost big gap"
              onClick={() => {
                void install();
                closeSheet();
              }}
            >
              Instalar app en este dispositivo
            </button>
          )}
          {isIOS() && !isStandalone() && (
            <p className="txt mt-3.5">Para instalar en iPhone: toca Compartir y luego &quot;Añadir a pantalla de inicio&quot;.</p>
          )}
          <button type="button" className="btn danger big gap" onClick={resetAll}>
            Borrar todos los datos
          </button>
        </>
      ),
    });
  }, [openSheet, closeSheet, confirm, exportData, pickImport, install]);
}
