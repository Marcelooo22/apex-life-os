import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const PATHS = {
  back: <path d="M15 5l-7 7 7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
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
  chevron: <path d="M6 9.5l6 6 6-6" />,
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
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  play: <path d="M8 5.5v13l11-6.5z" />,
  pause: <path d="M8.5 5.5v13M15.5 5.5v13" />,
  reset: (
    <>
      <path d="M3.5 12a8.5 8.5 0 102.6-6.1L3.5 8.5" />
      <path d="M3.5 3.5v5h5" />
    </>
  ),
  skip: <path d="M6 5.5v13l8-6.5zM18 5.5v13" />,
  bell: (
    <>
      <path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 1.5h-15z" />
      <path d="M10 20.5a2 2 0 004 0" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 018 0v2.5" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="14.5" r="5.5" />
      <path d="M8.5 10L6.5 3.5h4l1.5 3 1.5-3h4L15.5 10" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 1.5M9.5 3.5h5" />
    </>
  ),
  send: <path d="M12 19V5M6 11l6-6 6 6" />,
  list: (
    <>
      <path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20" />
      <circle cx="4.5" cy="6.5" r=".9" />
      <circle cx="4.5" cy="12" r=".9" />
      <circle cx="4.5" cy="17.5" r=".9" />
    </>
  ),
  board: (
    <>
      <rect x="4" y="4.5" width="7" height="15" rx="2" />
      <rect x="13" y="4.5" width="7" height="8.5" rx="2" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 016.5 5H18v3" />
      <path d="M4 7.5V17a2 2 0 002 2h13a1 1 0 001-1V9a1 1 0 00-1-1H6.5A2.5 2.5 0 014 7.5z" />
      <circle cx="16" cy="13.5" r="1" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.5A1.5 1.5 0 016.5 4H19v14H6.5A1.5 1.5 0 005 19.5z" />
      <path d="M5 19.5A1.5 1.5 0 006.5 21H19v-3" />
    </>
  ),
  drop: <path d="M12 3.5c3.2 3.8 5.5 6.6 5.5 9.5a5.5 5.5 0 01-11 0c0-2.9 2.3-5.7 5.5-9.5z" />,
  moon: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.5 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z" />,
  sparkle: (
    <>
      <path d="M11 3.5l1.9 5.6 5.6 1.9-5.6 1.9L11 18.5l-1.9-5.6L3.5 11l5.6-1.9z" />
      <path d="M18.5 15v5M16 17.5h5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r=".8" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-6.5 8 6.5" />
      <path d="M6 9.5V19h12V9.5" />
      <path d="M10 19v-5h4v5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M15.5 5.5a3 3 0 010 6M17 14c2.3.5 3.5 2.4 3.5 5" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <path d="M9 7.5V6a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 6v1.5M3.5 13h17" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  bolt: <path d="M13 3L5.5 13.5H12L11 21l7.5-10.5H12z" />,
  plane: (
    <>
      <path d="M20.5 4.5l-17 7 6.5 2.5 2.5 6z" />
      <path d="M10 14l10.5-9.5" />
    </>
  ),
  cart: (
    <>
      <path d="M3.5 4.5H6l2 10.5h9.5l2-7.5H7" />
      <circle cx="9.5" cy="19" r="1.2" />
      <circle cx="16.5" cy="19" r="1.2" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 013 3L8 18.5z" />
      <path d="M14.5 6l3 3" />
    </>
  ),
  star: <path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />,
  leaf: (
    <>
      <path d="M19 4.5C10 5 5 10.5 5 18.5c8 .3 13.5-4.5 14-14z" />
      <path d="M5 19l8-8" />
    </>
  ),
  coffee: (
    <>
      <path d="M5 9h11v5.5A4.5 4.5 0 0111.5 19h-2A4.5 4.5 0 015 14.5z" />
      <path d="M16 10.5h1.5a2 2 0 010 4H16" />
      <path d="M8 3.5v2M11 3.5v2M14 3.5v2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5a2 2 0 012-2h2l1.5-2h5L16 6.5h2a2 2 0 012 2V17a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </>
  ),
  film: (
    <>
      <rect x="4" y="4.5" width="16" height="15" rx="2.5" />
      <path d="M8 4.5v15M16 4.5v15M4 9h4M4 15h4M16 9h4M16 15h4" />
    </>
  ),
  paw: (
    <>
      <circle cx="7.5" cy="10" r="1.8" />
      <circle cx="12" cy="7" r="1.8" />
      <circle cx="16.5" cy="10" r="1.8" />
      <path d="M12 12.5c-3 0-5 2.3-5 4.3 0 1.7 1.5 2.4 3 2 .7-.2 1.3-.4 2-.4s1.3.2 2 .4c1.5.4 3-.3 3-2 0-2-2-4.3-5-4.3z" />
    </>
  ),
  code: <path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5l-3 14" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export const isIconName = (name: unknown): name is IconName => typeof name === "string" && Object.hasOwn(PATHS, name);

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

/** Icono a partir de un nombre guardado (si ya no existe, muestra una estrella). */
export function IconByName({ name, size, className }: { name: string; size?: number; className?: string }) {
  return <Icon name={isIconName(name) ? name : "star"} size={size} className={className} />;
}
