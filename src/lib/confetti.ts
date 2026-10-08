/** Confeti que sale de los dos lados de la pantalla (o notas musicales). Se dibuja en un lienzo temporal. */
interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  glyph?: string;
  life: number;
}

const COLORS = ["#c084fc", "#f472b6", "#fbbf24", "#34d399", "#60a5fa", "#fb7185", "#fde047"];
const NOTES = ["♪", "♫", "♬", "♩"];

export function confetti(kind: "confetti" | "notes" = "confetti") {
  if (typeof document === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:90";
  document.body.appendChild(canvas);
  const g = canvas.getContext("2d");
  if (!g) return canvas.remove();
  g.scale(dpr, dpr);

  const pieces: Piece[] = [];
  const count = kind === "notes" ? 16 : 70;
  for (const side of [-1, 1]) {
    for (let i = 0; i < count; i++) {
      const a = 0.3 + Math.random() * 0.8; // apertura respecto a la vertical, hacia el centro
      const speed = (kind === "notes" ? 7 : 10) + Math.random() * (kind === "notes" ? 5 : 9);
      pieces.push({
        x: side < 0 ? -6 : w + 6,
        y: h * (0.55 + Math.random() * 0.25),
        vx: Math.sin(a) * speed * (side < 0 ? 1 : -1),
        vy: -Math.cos(a) * speed,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.4,
        size: kind === "notes" ? 18 + Math.random() * 14 : 6 + Math.random() * 7,
        color: COLORS[(Math.random() * COLORS.length) | 0]!,
        glyph: kind === "notes" ? NOTES[(Math.random() * NOTES.length) | 0] : undefined,
        life: 1,
      });
    }
  }
  const start = performance.now();
  const total = kind === "notes" ? 1900 : 2800;
  const tick = (now: number) => {
    const t = now - start;
    g.clearRect(0, 0, w, h);
    for (const p of pieces) {
      p.vy += 0.34;
      p.vx *= 0.992;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life = Math.max(0, 1 - Math.max(0, t - total * 0.55) / (total * 0.45));
      g.save();
      g.globalAlpha = p.life;
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.fillStyle = p.color;
      if (p.glyph) {
        g.font = `${p.size}px system-ui, sans-serif`;
        g.fillText(p.glyph, 0, 0);
      } else g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      g.restore();
    }
    if (t < total) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
