/** Convierte un texto de formulario en uno de los valores permitidos (o el valor por defecto). */
export function pick<T extends string>(allowed: readonly T[], value: string | undefined, fallback: T): T {
  return allowed.find((a) => a === value) ?? fallback;
}
