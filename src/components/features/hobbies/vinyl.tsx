import type { Song } from "@/lib/types";
import { Cover } from "./track-search";

/** Vinilo que gira despacio con la carátula de la canción que practicas, y ondas de audio. */
export function NowPlaying({ song }: { song: Song | undefined }) {
  return (
    <div className="np">
      <div className="vinyl" aria-hidden="true">
        <div className="vinyl-disc">
          <div className="vinyl-label">
            <Cover src={song?.cover} size={86} />
          </div>
        </div>
      </div>
      <div className="eq" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <i key={i} style={{ animationDelay: `${-((i * 37) % 13) / 10}s`, animationDuration: `${0.9 + ((i * 7) % 6) / 10}s` }} />
        ))}
      </div>
      {song ? (
        <p className="np-t">
          <strong>{song.title}</strong>
          <small>{[song.artist, song.key].filter(Boolean).join(" · ")}</small>
        </p>
      ) : (
        <p className="np-t">
          <strong>Nada en práctica</strong>
          <small>Pasa una canción a «En práctica» y aparecerá aquí.</small>
        </p>
      )}
    </div>
  );
}
