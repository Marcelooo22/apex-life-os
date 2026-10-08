import { useId } from "react";
import { levelIndex, LEVELS, TIERS, type RankInfo } from "@/lib/rank";
import { cn } from "@/lib/utils";

interface BadgeProps {
  tierIndex: number;
  /** 1–3 (0 en Magno, que no tiene divisiones). */
  division: number;
  size?: number;
  /** 0–1: cuánto brilla y cuántos adornos lleva (crece al avanzar de rango). */
  power?: number;
  locked?: boolean;
  animated?: boolean;
}

const star = (cx: number, cy: number, r: number, inner: number, n: number) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const rr = i % 2 ? inner : r;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }).join(" ");

/** Insignia de un rango: escudo con emblema propio; desde Plata lleva alas, desde Oro corona, y Magno irradia. */
export function BadgeArt({ tierIndex, division, size = 84, power = 0.2, locked = false, animated = true }: BadgeProps) {
  const uid = useId().replace(/:/g, "");
  const tier = TIERS[tierIndex] ?? TIERS[0]!;
  const c = tier.color;
  const magno = tierIndex === TIERS.length - 1;
  const grad = `g${uid}`;
  const clip = `c${uid}`;
  const moving = animated && !locked;
  return (
    <svg
      className={cn("rb", moving && "rb-float", locked && "rb-locked")}
      width={size}
      height={size * 1.16}
      viewBox="0 0 120 140"
      role="img"
      aria-label={`Rango ${tier.name}${division ? " " + division : ""}${locked ? " (bloqueado)" : ""}`}
      style={{ filter: locked ? undefined : `drop-shadow(0 ${4 + power * 8}px ${10 + power * 26}px rgba(${tier.glow},${0.35 + power * 0.5}))`, overflow: "visible" }}
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={magno ? "#f0abfc" : c} />
          <stop offset="0.55" stopColor={c} />
          <stop offset="1" stopColor={magno ? "#7c3aed" : c} stopOpacity=".5" />
        </linearGradient>
        <linearGradient id={`${grad}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clip}>
          <path d="M60 14 L104 28 V66 C104 98 84 120 60 130 C36 120 16 98 16 66 V28 Z" />
        </clipPath>
      </defs>

      {tierIndex >= 3 && <circle className={moving ? "rb-aura" : undefined} cx="60" cy="72" r={52 + power * 14} fill={`rgba(${tier.glow},${0.1 + power * 0.22})`} />}
      {tierIndex >= 5 && (
        <g className={moving ? "rb-rays" : undefined} opacity={0.25 + power * 0.5} stroke={c} strokeWidth={magno ? 2.2 : 1.6} strokeLinecap="round">
          {Array.from({ length: magno ? 16 : 10 }, (_, i) => {
            const a = (Math.PI * 2 * i) / (magno ? 16 : 10);
            return <line key={i} x1={60 + Math.cos(a) * 58} y1={72 + Math.sin(a) * 58} x2={60 + Math.cos(a) * (magno ? 78 : 70)} y2={72 + Math.sin(a) * (magno ? 78 : 70)} />;
          })}
        </g>
      )}

      {tierIndex >= 2 && (
        <g fill={`url(#${grad})`} opacity=".95">
          {[0, 1].map((side) => (
            <g key={side} transform={side ? "translate(120 0) scale(-1 1)" : undefined}>
              <path d="M18 58 C0 54 -6 36 -2 18 C8 30 18 34 30 36 Z" />
              <path d="M18 70 C-2 68 -10 52 -8 36 C4 48 16 50 28 50 Z" opacity=".85" />
              {tierIndex >= 4 && <path d="M20 82 C2 82 -8 70 -8 56 C4 66 16 66 28 64 Z" opacity=".7" />}
              {tierIndex >= 6 && <path d="M24 94 C8 96 -4 88 -6 74 C6 82 18 80 30 78 Z" opacity=".55" />}
            </g>
          ))}
        </g>
      )}

      <path d="M60 14 L104 28 V66 C104 98 84 120 60 130 C36 120 16 98 16 66 V28 Z" fill="#0d0d12" stroke={`url(#${grad})`} strokeWidth="4" strokeLinejoin="round" />
      <path d="M60 22 L96 34 V66 C96 92 79 111 60 120 C41 111 24 92 24 66 V34 Z" fill={`url(#${grad})`} opacity=".2" />
      <g clipPath={`url(#${clip})`}>{moving && <rect className="rb-sheen" x="-40" y="0" width="34" height="140" fill={`url(#${grad}s)`} transform="skewX(-18)" />}</g>

      {tierIndex >= 3 && (
        <g fill={`url(#${grad})`} stroke={c} strokeWidth="1" strokeLinejoin="round">
          <path d={tierIndex >= 5 ? "M36 18 L40 2 L50 11 L60 -4 L70 11 L80 2 L84 18 Z" : "M42 17 L46 5 L54 12 L60 1 L66 12 L74 5 L78 17 Z"} />
          <circle cx="60" cy={tierIndex >= 5 ? 6 : 8} r="2.4" fill="#fff" stroke="none" />
        </g>
      )}

      <g transform="translate(60 72)" fill={`url(#${grad})`} stroke={c} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        {tierIndex === 0 && (
          <>
            <polygon points="0,-19 16.5,-9.5 16.5,9.5 0,19 -16.5,9.5 -16.5,-9.5" />
            <circle r="7" fill="#0d0d12" />
          </>
        )}
        {tierIndex === 1 && (
          <g fill="none" strokeWidth="5">
            <path d="M-17 -6 L0 -17 L17 -6" />
            <path d="M-17 8 L0 -3 L17 8" />
            <path d="M-17 22 L0 11 L17 22" opacity=".7" />
          </g>
        )}
        {tierIndex === 2 && <polygon points={star(0, 0, 21, 9, 5)} />}
        {tierIndex === 3 && (
          <>
            <polygon points={star(0, 0, 22, 10, 6)} />
            <circle r="6" fill="#fff" fillOpacity=".85" stroke="none" />
          </>
        )}
        {tierIndex === 4 && (
          <>
            <path d="M0 -20 L17 -8 L12 14 L0 22 L-12 14 L-17 -8 Z" />
            <path d="M-17 -8 H17 M-6 -8 L0 22 L6 -8 M0 -20 L-6 -8 M0 -20 L6 -8" fill="none" stroke="#0d0d12" strokeOpacity=".4" strokeWidth="1" />
          </>
        )}
        {tierIndex === 5 && (
          <>
            <path d="M-20 -6 L-11 -19 H11 L20 -6 L0 24 Z" />
            <path d="M-20 -6 H20 M-8 -6 L0 24 L8 -6 M-11 -19 L-8 -6 M11 -19 L8 -6 M0 -19 L-8 -6 M0 -19 L8 -6" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
          </>
        )}
        {tierIndex === 6 && (
          <>
            <polygon points={star(0, 0, 26, 10, 8)} />
            <circle r="9" fill="#fff" fillOpacity=".9" stroke="none" />
            <circle r="14" fill="none" strokeWidth="1.4" opacity=".8" />
          </>
        )}
      </g>

      {division > 0 && (
        <g>
          {[1, 2, 3].map((d) => (
            <path key={d} transform={`translate(${60 + (d - 2) * 15} 109)`} d="M0 -5 L4.5 0 L0 5 L-4.5 0 Z" fill={d <= division ? c : "none"} stroke={c} strokeWidth="1.3" opacity={d <= division ? 1 : 0.4} />
          ))}
        </g>
      )}
      {tierIndex >= 4 && !locked &&
        [[12, 28, 5], [112, 40, 4], [100, 112, 3.5]].map(([x, y, r], i) => (
          <polygon key={i} className={moving ? "rb-tw" : undefined} style={{ animationDelay: `${i * 0.7}s` }} points={star(x!, y!, r!, r! / 3.2, 4)} fill="#fff" />
        ))}
    </svg>
  );
}

/** Insignia del rango actual (cabecera del gym). */
export function RankBadge({ rank, size = 84 }: { rank: RankInfo; size?: number }) {
  const tierIndex = TIERS.findIndex((t) => t.id === rank.tier.id);
  const i = levelIndex(rank.points);
  return <BadgeArt tierIndex={tierIndex} division={rank.division} size={size} power={i / (LEVELS.length - 1)} />;
}
