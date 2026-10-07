interface Props {
  points: readonly { label: string; value: number }[];
  color?: string;
  unit?: string;
  label: string;
}

/** Línea sencilla con puntos y los extremos marcados. */
export function LineChart({ points, color = "#ff8a2b", unit = "", label }: Props) {
  const W = 320;
  const H = 130;
  const pad = { l: 8, r: 8, t: 16, b: 22 };
  if (points.length < 2) return null;
  const values = points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const x = (i: number) => pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / span) * (H - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const last = points.length - 1;
  const lowI = values.indexOf(lo);
  const highI = values.indexOf(hi);
  return (
    <svg className="lc" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <path d={`${d} L${x(last)} ${H - pad.b} L${x(0)} ${H - pad.b} Z`} fill={color} opacity=".12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={i === last ? 4.5 : 2.5} fill={i === last ? color : "#0a0a0a"} stroke={color} strokeWidth="1.5" />
      ))}
      {[...new Set([highI, lowI, last])].map((i) => (
        <text key={i} x={Math.min(W - 24, Math.max(24, x(i)))} y={y(values[i]!) - 8} textAnchor="middle" className="lc-t">
          {values[i]}
          {unit}
        </text>
      ))}
      <text x={pad.l} y={H - 5} className="lc-d">{points[0]!.label}</text>
      <text x={W - pad.r} y={H - 5} className="lc-d" textAnchor="end">{points[last]!.label}</text>
    </svg>
  );
}
