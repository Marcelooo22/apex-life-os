"use client";

import { useCallback } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { dkey } from "@/lib/dates";
import { hydrate } from "@/lib/defaults";
import { getState, replaceState } from "@/lib/store";
import { toast } from "@/lib/toast";

const isBackup = (data: unknown): data is Record<string, unknown> =>
  typeof data === "object" && data !== null && "gym" in data && "habits" in data;

/** Exportar e importar una copia de seguridad (archivo .json). */
export function useBackup() {
  const { confirm } = useSheet();

  const exportData = useCallback(async () => {
    const name = `apex-copia-${dkey()}.json`;
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
    const file = new File([blob], name, { type: "application/json" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Copia de Apex" });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    toast("Copia descargada");
  }, []);

  const pickImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.hidden = true;
    document.body.appendChild(input);

    input.addEventListener("cancel", () => input.remove());
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data: unknown = JSON.parse(String(reader.result));
          if (!isBackup(data)) throw new Error("copia no válida");
          confirm("¿Reemplazar tus datos?", "Se sustituirá todo lo actual por el contenido de la copia.", "Importar", () => {
            replaceState(hydrate(data));
            toast("Copia importada");
          });
        } catch {
          toast("El archivo no es una copia válida de Apex");
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }, [confirm]);

  return { exportData, pickImport };
}
