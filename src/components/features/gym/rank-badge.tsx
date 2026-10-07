import { ROMAN, type RankInfo } from "@/lib/rank";

/** Escudo del rango con una gema; el color y el brillo cambian con el rango. */
export function RankBadge({ rank, size = 84 }: { rank: RankInfo; size?: number }) {
  const { tier, division } = rank;
  const id = `rb-${tier.id}`;
  return (
    <svg className="rb" width={size} height={size * 1.1} viewBox="0 0 72 80" role="img" aria-label={`Rango ${tier.name}${division ? " " + ROMAN[division] : ""}`} style={{ filter: `drop-shadow(0 6px 18px rgba(${tier.glow},.55))` }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tier.color} />
          <stop offset="1" stopColor={tier.color} stopOpacity=".45" />
        </linearGradient>
      </defs>
      <path d="M36 3 L65 13 V38 C65 58 52 72 36 78 C20 72 7 58 7 38 V13 Z" fill="#0d0d10" stroke={`url(#${id})`} strokeWidth="3" />
      <path d="M36 9 L59 17 V38 C59 54 49 66 36 71 C23 66 13 54 13 38 V17 Z" fill={`url(#${id})`} opacity=".16" />
      <g transform="translate(36 38)">
        <path d="M-14 -6 L-8 -14 H8 L14 -6 L0 14 Z" fill={`url(#${id})`} stroke={tier.color} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M-14 -6 H14 M-5 -6 L0 14 L5 -6 M-8 -14 L-5 -6 M8 -14 L5 -6" fill="none" stroke="#0d0d10" strokeOpacity=".45" strokeWidth="1" />
      </g>
      {division > 0 && (
        <text x="36" y="66" textAnchor="middle" fontSize="11" fontWeight="800" fill={tier.color}>
          {ROMAN[division]}
        </text>
      )}
    </svg>
  );
}
