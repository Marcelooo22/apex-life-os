"use client";

import { useMemo } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { SONG_STATUS } from "@/lib/constants";
import { pick } from "@/lib/guards";
import { formatDuration, type TrackHit } from "@/lib/music";
import { getState, updateState } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Song } from "@/lib/types";
import { num, safeUrl, uid } from "@/lib/utils";
import { foundInfo, SongInfoFill } from "./song-info-fill";
import { Cover } from "./track-search";

/** Hojas modales de la sección Hobbies (canciones e instrumentos). */
export function useHobbySheets() {
  const { openSheet, closeSheet, confirm } = useSheet();

  return useMemo(() => {
    const save = (instrumentId: string, record: Song) =>
      updateState((d) => {
        const inst = d.hobbies.instruments.find((i) => i.id === instrumentId);
        if (!inst) return;
        const index = inst.songs.findIndex((s) => s.id === record.id);
        if (index >= 0) inst.songs[index] = record;
        else inst.songs.push(record);
      });

    return {
      /** Crear (a mano) o editar una canción del instrumento `instrumentId`. */
      song(instrumentId: string, songId?: string, preset?: string) {
        const instrument = getState().hobbies.instruments.find((i) => i.id === instrumentId);
        if (!instrument) return;
        const song = songId ? instrument.songs.find((s) => s.id === songId) : undefined;

        openSheet({
          title: song ? "Editar canción" : "Añadir canción a mano",
          submit: song ? "Guardar" : "Añadir",
          fields: [
            { name: "title", label: "Título de la canción", type: "text", required: true, value: song?.title ?? preset ?? "", placeholder: "Ej. La Gota Fría" },
            { name: "artist", label: "Artista o compositor", type: "text", value: song?.artist ?? "", placeholder: "Ej. Carlos Vives" },
            { name: "album", label: "Álbum", type: "text", value: song?.album ?? "", placeholder: "Opcional" },
            { name: "genre", label: "Ritmo o aire", type: "text", half: true, value: song?.genre ?? "", placeholder: "Paseo, Merengue, Rock" },
            { name: "key", label: "Tono / hilera", type: "text", half: true, value: song?.key ?? "", placeholder: "Sol Mayor (G)" },
            { name: "bpmCurrent", label: "BPM actual", type: "number", half: true, value: song?.bpmCurrent || "", placeholder: "90" },
            { name: "bpmTarget", label: "BPM objetivo", type: "number", half: true, value: song?.bpmTarget || "", placeholder: "110" },
            { name: "status", label: "Estado", type: "seg", options: SONG_STATUS.map((s) => [s, s] as const), value: song?.status ?? "Por aprender" },
            { name: "link", label: "Enlace a video, tablatura o audio", type: "url", value: song?.link ?? "", placeholder: "https://..." },
            { name: "notes", label: "Apuntes técnicos / digitación", type: "textarea", value: song?.notes ?? "", placeholder: "Detalles del fuelleo, adornos, escala o solo..." },
          ],
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
            save(instrumentId, {
              ...song,
              id: song?.id ?? uid(),
              title: (v.title ?? "").trim(),
              artist: (v.artist ?? "").trim(),
              album: (v.album ?? "").trim() || undefined,
              genre: (v.genre ?? "").trim(),
              key: (v.key ?? "").trim(),
              bpmCurrent: v.bpmCurrent ? num(v.bpmCurrent) : "",
              bpmTarget: v.bpmTarget ? num(v.bpmTarget) : "",
              status: pick(SONG_STATUS, v.status, "Por aprender"),
              link: safeUrl(v.link),
              notes: (v.notes ?? "").trim(),
            });
          },
        });
      },

      /** Añadir a la biblioteca una canción elegida en el buscador. */
      fromTrack(instrumentId: string, track: TrackHit) {
        const instrument = getState().hobbies.instruments.find((i) => i.id === instrumentId);
        if (!instrument) return;
        const dup = instrument.songs.some((s) => s.title.toLowerCase() === track.title.toLowerCase() && s.artist.toLowerCase() === track.artist.toLowerCase());
        if (dup) return toast("Esa canción ya está en tu biblioteca");

        openSheet({
          title: "Añadir a tu biblioteca",
          submit: "Añadir",
          focus: false,
          fields: [
            { name: "status", label: "Estado", type: "seg", options: SONG_STATUS.map((s) => [s, s] as const), value: "Por aprender" },
            { name: "bpmTarget", label: "BPM de la canción", type: "number", placeholder: "Se rellena solo si lo encuentro" },
          ],
          header: (
            <div className="pick-head">
              <Cover src={track.cover} size={72} />
              <div>
                <strong>{track.title}</strong>
                <small>{track.artist}</small>
                <small>
                  {[track.album, track.durationSec ? formatDuration(track.durationSec) : ""].filter(Boolean).join(" · ")}
                </small>
              </div>
            </div>
          ),
          footer: <SongInfoFill track={track} />,
          onSubmit: (v) => {
            const info = foundInfo.get(track.id);
            foundInfo.delete(track.id);
            save(instrumentId, {
              id: uid(),
              title: track.title,
              artist: track.artist,
              album: track.album || undefined,
              cover: track.cover || undefined,
              durationSec: track.durationSec || undefined,
              genre: "",
              key: info?.key ?? "",
              timeSig: info?.timeSig ?? undefined,
              year: info?.year ?? undefined,
              genres: info?.genres?.length ? info.genres : undefined,
              bpmCurrent: "",
              bpmTarget: v.bpmTarget ? num(v.bpmTarget) : "",
              status: pick(SONG_STATUS, v.status, "Por aprender"),
              link: "",
              notes: "",
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
    };
  }, [openSheet, closeSheet, confirm]);
}
