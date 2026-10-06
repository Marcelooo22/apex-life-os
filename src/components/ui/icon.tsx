import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const PATHS = {
  back: <path d="M15 5l-7 7 7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  flame: <path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 01-8 0c0-1.5.7-2.5 1.5-3.5.3 1 1 1.5 1.5 1.5 0-3-.5-4.5 1-6.5z" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </>
  ),
  link: <path d="M7 17L17 7M9 7h8v8" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  music: (
    <>
      <circle cx="8" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <path d="M11 18V6l10-2v12M11 10l10-2" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </>
  ),
  dumbbell: <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />,
  habits: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16 9.5" />
    </>
  ),
  nutrition: (
    <>
      <path d="M12 7c-1-2-3-3-5-2.5C4.5 5.3 3.5 8 4 11c.6 4 3.2 8 5.5 8 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5c2.3 0 4.9-4 5.5-8 .5-3-.5-5.7-3-6.5C15 4 13 5 12 7z" />
      <path d="M12 7c0-1.5.8-3 2.5-4" />
    </>
  ),
  uni: (
    <>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
      <path d="M22 9v6" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  /** Tamaño en px (por defecto hereda 1em del contenedor). */
  size?: number;
  className?: string;
}

export function Icon({ name, size, className }: IconProps) {
  return (
    <svg className={cn("i", className)} viewBox="0 0 24 24" aria-hidden="true" style={size ? { fontSize: size } : undefined}>
      {PATHS[name]}
    </svg>
  );
}
