"use client";

import { useMemo } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { SONG_CATALOG, SONG_STATUS } from "@/lib/constants";
import { pick } from "@/lib/guards";
import { getState, updateState } from "@/lib/store";
import type { Song } from "@/lib/types";
import { num, safeUrl, uid } from "@/lib/utils";

const CATALOG_TITLES = SONG_CATALOG.map((s) => s.title);

/** Hojas modales de la sección Hobbies (canciones e instrumentos). */
export function useHobbySheets() {
  const { openSheet, closeSheet, confirm } = useSheet();

  return useMemo(
    () => ({
      /** Crear o editar una canción del instrumento `instrumentId`. */
      song(instrumentId: string, songId?: string) {
        const instrument = getState().hobbies.instruments.find((i) => i.id === instrumentId);
        if (!instrument) return;
        const song = songId ? instrument.songs.find((s) => s.id === songId) : undefined;

        openSheet({
          title: song ? "Editar canción" : "Añadir canción al repertorio",
          submit: song ? "Guardar" : "Añadir",
          fields: [
            { name: "title", label: "Título de la canción", type: "text", required: true, value: song?.title ?? "", placeholder: "Ej. La Gota Fría", list: CATALOG_TITLES },
            { name: "artist", label: "Artista o compositor", type: "text", value: song?.artist ?? "", placeholder: "Ej. Carlos Vives" },
            { name: "genre", label: "Ritmo o Aire", type: "text", half: true, value: song?.genre ?? "", placeholder: "Ej. Paseo, Merengue, Rock" },
            { name: "key", label: "Tonalidad / Hilera", type: "text", half: true, value: song?.key ?? "", placeholder: "Ej. Sol Mayor (G), 5 Letras" },
            { name: "bpmCurrent", label: "BPM Actual", type: "number", half: true, value: song?.bpmCurrent || "", placeholder: "Ej. 90" },
            { name: "bpmTarget", label: "BPM Objetivo", type: "number", half: true, value: song?.bpmTarget || "", placeholder: "Ej. 110" },
            { name: "status", label: "Estado", type: "seg", options: SONG_STATUS.map((s) => [s, s] as const), value: song?.status ?? "Por aprender" },
            { name: "link", label: "Enlace a video, tablatura o audio", type: "url", value: song?.link ?? "", placeholder: "https://..." },
            { name: "notes", label: "Apuntes técnicos / digitación", type: "textarea", value: song?.notes ?? "", placeholder: "Detalles del fuelleo, adornos, escala o solo..." },
          ],
          // Al escribir un título conocido se rellenan los campos vacíos con datos del catálogo.
          onFieldInput: (form, target) => {
            if (!(target instanceof HTMLInputElement) || target.name !== "title") return;
            const match = SONG_CATALOG.find((s) => s.title.toLowerCase() === target.value.trim().toLowerCase());
            if (!match) return;
            const fill = (name: string, value: string | number) => {
              const el = form.elements.namedItem(name);
              if (el instanceof HTMLInputElement && !el.value) el.value = String(value);
            };
            fill("artist", match.artist);
            fill("genre", match.genre);
            fill("key", match.key);
            fill("bpmTarget", match.bpm);
          },
          danger: song
            ? {
                label: "Eliminar",
                fn: () => {
                  updateState((d) => {
                    const inst = d.hobbies.instruments.find((i) => i.id === instrumentId);
                    if (inst) inst.songs = inst.songs.filter((s) => s.id !== song.id);
                  });
                  closeSheet();
                },
              }
            : undefined,
          onSubmit: (v) => {
            const record: Song = {
              id: song?.id ?? uid(),
              title: (v.title ?? "").trim(),
              artist: (v.artist ?? "").trim(),
              genre: (v.genre ?? "").trim(),
              key: (v.key ?? "").trim(),
              bpmCurrent: v.bpmCurrent ? num(v.bpmCurrent) : "",
              bpmTarget: v.bpmTarget ? num(v.bpmTarget) : "",
              status: pick(SONG_STATUS, v.status, "Por aprender"),
              link: safeUrl(v.link),
              notes: (v.notes ?? "").trim(),
            };
            updateState((d) => {
              const inst = d.hobbies.instruments.find((i) => i.id === instrumentId);
              if (!inst) return;
              const index = song ? inst.songs.findIndex((s) => s.id === song.id) : -1;
              if (index >= 0) inst.songs[index] = record;
              else inst.songs.push(record);
            });
          },
        });
      },

      /** Crear o editar un instrumento/hobby. `onCreated` recibe el id del nuevo. */
      instrument(id?: string, onCreated?: (id: string) => void) {
        const list = getState().hobbies.instruments;
        const item = id ? list.find((x) => x.id === id) : undefined;

        openSheet({
          title: item ? "Editar hobby o instrumento" : "Nuevo hobby o instrumento",
          submit: item ? "Guardar" : "Crear",
          fields: [
            { name: "name", label: "Nombre", type: "text", required: true, value: item?.name ?? "", placeholder: "Ej. Acordeón, Lectura, Saxofón" },
            { name: "detail", label: "Detalle o afinación", type: "text", value: item?.detail ?? "", placeholder: "Ej. Cinco Letras / GCF, Alto en Mib..." },
          ],
          danger:
            item && list.length > 1
              ? {
                  label: "Eliminar",
                  fn: () => {
                    closeSheet();
                    confirm("¿Eliminar instrumento?", `"${item.name}" y todo su repertorio se borrarán permanentemente.`, "Eliminar", () => {
                      updateState((d) => {
                        d.hobbies.instruments = d.hobbies.instruments.filter((x) => x.id !== item.id);
                      });
                    });
                  },
                }
              : undefined,
          onSubmit: (v) => {
            const name = (v.name ?? "").trim();
            const detail = (v.detail ?? "").trim();
            if (item) {
              updateState((d) => {
                const target = d.hobbies.instruments.find((x) => x.id === item.id);
                if (target) {
                  target.name = name;
                  target.detail = detail;
                }
              });
            } else {
              const created = { id: uid(), name, detail, songs: [] };
              updateState((d) => {
                d.hobbies.instruments.push(created);
              });
              onCreated?.(created.id);
            }
          },
        });
      },
    }),
    [openSheet, closeSheet, confirm],
  );
}
