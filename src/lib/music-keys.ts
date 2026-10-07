const NOTES: Record<string, string> = { C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };

/** "G", "Gm", "F# minor", "Bb major" → "Sol Mayor (G)", "Sol menor (Gm)", "Fa♯ menor (F#m)", "Si♭ Mayor (Bb)". */
export function formatKey(raw: string | null | undefined): string {
  const text = (raw ?? "").trim();
  const m = /^([A-Ga-g])\s*([#♯b♭]?)\s*(m(?!aj)|min(?:or)?|menor|maj(?:or)?|mayor)?\.?$/i.exec(text);
  if (!m) return text;
  const letter = m[1]!.toUpperCase();
  const acc = m[2] === "#" || m[2] === "♯" ? "#" : m[2] === "b" || m[2] === "♭" ? "b" : "";
  const minor = /^(m|min|minor|menor)$/i.test(m[3] ?? "") && !/^maj/i.test(m[3] ?? "");
  const nice = acc === "#" ? "♯" : acc === "b" ? "♭" : "";
  return `${NOTES[letter]}${nice} ${minor ? "menor" : "Mayor"} (${letter}${acc}${minor ? "m" : ""})`;
}
