interface Props {
  items: readonly { label: string; value: number }[];
  label: string;
}

/** Gráfica de radar sencilla (SVG). Los valores se normalizan contra el mayor. */
export function RadarChart({ items, label }: Props) {
  const size = 240;
  const c = size / 2;
  const r = 78;
  const n = items.length;
  const max = Math.max(...items.map((i) => i.value), 1);
  const point = (i: number, k: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * r * k, c + Math.sin(a) * r * k];
  };
  const poly = (k: (i: number) => number) => items.map((_, i) => point(i, k(i)).join(",")).join(" ");
  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      {[0.33, 0.66, 1].map((k) => (
        <polygon key={k} points={poly(() => k)} className="radar-g" />
      ))}
      {items.map((_, i) => {
        const [x, y] = point(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} className="radar-g" />;
      })}
      <polygon points={poly((i) => Math.max(0.04, items[i]!.value / max))} className="radar-d" />
      {items.map((it, i) => {
        const [x, y] = point(i, 1.2);
        return (
          <text key={it.label} x={x} y={y} className="radar-t" textAnchor="middle" dominantBaseline="middle">
            {it.label}
          </text>
        );
      })}
    </svg>
  );
}
