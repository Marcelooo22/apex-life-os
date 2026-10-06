import type { CatalogSong, MealType, Slot, SongStatus, TaskStatus } from "./types";

export const STORAGE_KEY = "apex.v2";

export const SONG_STATUS: readonly SongStatus[] = [
  "Por aprender",
  "En proceso",
  "Afinación",
  "Velocidad",
  "Completada",
];

export const TASK_STATUS: readonly TaskStatus[] = ["Pendiente", "En proceso", "Entregado"];

export const SLOTS: readonly (readonly [Slot, string])[] = [
  ["morning", "Mañana"],
  ["afternoon", "Tarde"],
  ["night", "Noche"],
];

export const MEALS: readonly (readonly [MealType, string])[] = [
  ["Desayuno", "Desayuno"],
  ["Almuerzo", "Almuerzo"],
  ["Cena", "Cena"],
  ["Snack", "Snack"],
];

/** Catálogo para autocompletar canciones (título → artista, ritmo, tonalidad, BPM). */
export const SONG_CATALOG: readonly CatalogSong[] = [
  // Acordeón / Vallenato
  { title: "La Gota Fría", artist: "Carlos Vives / Emiliano Zuleta", genre: "Paseo", key: "Sol Mayor (G)", bpm: 110, instrument: "Acordeón" },
  { title: "Jaime Molina", artist: "Rafael Escalona", genre: "Paseo", key: "La Mayor (A)", bpm: 85, instrument: "Acordeón" },
  { title: "El Cantor de Fonseca", artist: "Carlos Huertas", genre: "Paseo", key: "Re Mayor (D)", bpm: 92, instrument: "Acordeón" },
  { title: "Mi Hermano y Yo", artist: "Los Hermanos Zuleta", genre: "Merengue", key: "Do Mayor (C)", bpm: 125, instrument: "Acordeón" },
  { title: "La Creciente", artist: "Binomio de Oro", genre: "Paseo", key: "Si Bemol (Bb)", bpm: 88, instrument: "Acordeón" },
  { title: "La Plata", artist: "Diomedes Díaz", genre: "Paseo", key: "Sol Mayor (G)", bpm: 118, instrument: "Acordeón" },
  { title: "Obsesión", artist: "Peter Manjarrés / Las Estrellas Vallenatas", genre: "Paseo", key: "Fa Mayor (F)", bpm: 95, instrument: "Acordeón" },
  { title: "Matilde Lina", artist: "Leandro Díaz", genre: "Paseo", key: "Sol Mayor (G)", bpm: 90, instrument: "Acordeón" },
  { title: "Sin Medir Distancias", artist: "Diomedes Díaz", genre: "Paseo", key: "Mi Mayor (E)", bpm: 86, instrument: "Acordeón" },
  { title: "Tierra de Cantores", artist: "Los Hermanos Zuleta", genre: "Merengue", key: "La Mayor (A)", bpm: 128, instrument: "Acordeón" },
  // Saxofón
  { title: "Careless Whisper", artist: "George Michael", genre: "Pop / Balada", key: "Re menor (Dm)", bpm: 76, instrument: "Saxofón" },
  { title: "Baker Street", artist: "Gerry Rafferty", genre: "Rock", key: "Re Mayor (D)", bpm: 116, instrument: "Saxofón" },
  { title: "Autumn Leaves", artist: "Standard de Jazz", genre: "Jazz", key: "Sol menor (Gm)", bpm: 120, instrument: "Saxofón" },
  { title: "Pick Up the Pieces", artist: "Average White Band", genre: "Funk", key: "Fa menor (Fm)", bpm: 108, instrument: "Saxofón" },
  // Guitarra Eléctrica
  { title: "Sultans of Swing", artist: "Dire Straits", genre: "Rock", key: "Re menor (Dm)", bpm: 148, instrument: "Guitarra Eléctrica" },
  { title: "Comfortably Numb", artist: "Pink Floyd", genre: "Rock Progresivo", key: "Si menor (Bm)", bpm: 65, instrument: "Guitarra Eléctrica" },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses", genre: "Hard Rock", key: "Re Bemol (Db)", bpm: 125, instrument: "Guitarra Eléctrica" },
  { title: "Hotel California", artist: "Eagles", genre: "Classic Rock", key: "Si menor (Bm)", bpm: 75, instrument: "Guitarra Eléctrica" },
];
