import type { MusicPlatform } from "./types";

export interface SongInfo {
  bpm: number | null;
  key: string | null;
  /** Compás (4/4, 3/4…), año, géneros y la ficha en GetSongBPM, cuando la fuente los da. */
  timeSig?: string | null;
  year?: number | null;
  genres?: string[];
  uri?: string | null;
  /** Quién aportó cada dato. */
  from: { bpm?: string; key?: string };
  /** true si algún dato es una estimación de la IA. */
  approx: boolean;
}

/** BPM y tono de una canción (a través de /api/songinfo). */
export async function fetchSongInfo(q: { title: string; artist: string; id?: string; source?: string }, signal?: AbortSignal): Promise<SongInfo | null> {
  const params = new URLSearchParams({ title: q.title, artist: q.artist });
  if (q.id && q.source === "deezer") params.set("id", q.id);
  try {
    const res = await fetch(`/api/songinfo?${params}`, { signal });
    if (!res.ok) return null;
    return (await res.json()) as SongInfo;
  } catch {
    return null;
  }
}

export const PLATFORMS: readonly { id: MusicPlatform; label: string }[] = [
  { id: "spotify", label: "Spotify" },
  { id: "youtube", label: "YouTube Music" },
  { id: "apple", label: "Apple Music" },
  { id: "deezer", label: "Deezer" },
];

/** Enlace de búsqueda de la canción en la plataforma preferida. */
export function listenLink(platform: MusicPlatform, title: string, artist: string): string {
  const q = encodeURIComponent(`${title} ${artist}`.trim());
  switch (platform) {
    case "spotify":
      return `https://open.spotify.com/search/${q}`;
    case "youtube":
      return `https://music.youtube.com/search?q=${q}`;
    case "apple":
      return `https://music.apple.com/search?term=${q}`;
    case "deezer":
      return `https://www.deezer.com/search/${q}`;
  }
}
