/** Una canción devuelta por el buscador musical (Deezer, a través de /api/music). */
export interface TrackHit {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  durationSec: number;
  link: string;
}

export async function searchTracks(query: string, signal: AbortSignal): Promise<TrackHit[]> {
  const res = await fetch(`/api/music?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) throw new Error(res.status === 429 ? "Demasiadas búsquedas seguidas. Espera un momento." : "No se pudo consultar el catálogo musical.");
  const data = (await res.json()) as { results?: TrackHit[] };
  return data.results ?? [];
}

export const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
