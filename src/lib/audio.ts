let ctx: AudioContext | null = null;

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

/** Los navegadores solo dejan sonar audio tras un gesto del usuario: se llama desde un toque. */
export function unlockAudio() {
  try {
    const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    /* sin audio */
  }
}

/** Una nota "pulsada" de marimba: ataque rápido, cuerpo cálido y caída corta. */
function pluck(audio: BaseAudioContext, out: AudioNode, freq: number, t: number, peak: number, decay: number) {
  for (const [type, mult, level, d] of [["sine", 1, 1, decay], ["triangle", 2, 0.28, decay * 0.5], ["sine", 4.1, 0.08, decay * 0.18]] as const) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq * mult;
    osc.connect(gain);
    gain.connect(out);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak * level, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.start(t);
    osc.stop(t + d + 0.05);
  }
}

/**
 * Aviso de fin de descanso: tres notas de marimba que suben (Sol–Do–Mi) y una cuarta más alta que se queda un momento.
 * Es amable pero se nota; dura ~1,5 s y suena a volumen medio-bajo. Separado de `beep` para probarlo sin conexión.
 */
export function scheduleChime(audio: BaseAudioContext, t0: number) {
  const master = audio.createGain();
  master.gain.value = 0.5;
  master.connect(audio.destination);
  const notes: [number, number][] = [[392, 0], [523.25, 0.17], [659.25, 0.34], [783.99, 0.55]];
  for (const [f, dt] of notes) pluck(audio, master, f, t0 + dt, 0.55, dt > 0.5 ? 1.2 : 0.45);
}

/** Aviso al terminar el descanso (y el Pomodoro). */
export function beep() {
  if (ctx) scheduleChime(ctx, ctx.currentTime + 0.02);
}

/** "Bloop": una burbuja que sube de tono (barrido de frecuencia). */
function bloop(audio: BaseAudioContext, out: AudioNode, t: number, from: number, to: number, dur: number, peak: number) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  osc.connect(gain);
  gain.connect(out);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
  osc.start(t);
  osc.stop(t + dur + 0.08);
}

/**
 * Sonidos de nutrición, cortos y juguetones (nada que ver con el resto de la app):
 *  - comida: «bloop» con dos chispitas agudas, como una burbuja que se transforma en destello;
 *  - agua: dos burbujas seguidas, la segunda más grave («glu-glup»).
 */
export function scheduleNutri(audio: BaseAudioContext, t0: number, kind: "food" | "water") {
  const master = audio.createGain();
  master.gain.value = 0.32;
  master.connect(audio.destination);
  if (kind === "water") {
    bloop(audio, master, t0, 520, 980, 0.085, 0.7);
    bloop(audio, master, t0 + 0.12, 380, 720, 0.1, 0.75);
    bloop(audio, master, t0 + 0.27, 760, 1250, 0.05, 0.3);
  } else {
    bloop(audio, master, t0, 300, 880, 0.09, 0.8);
    bloop(audio, master, t0 + 0.11, 1250, 1500, 0.035, 0.35);
    bloop(audio, master, t0 + 0.17, 1700, 2100, 0.035, 0.3);
  }
}

export function playNutri(kind: "food" | "water") {
  unlockAudio();
  if (ctx) scheduleNutri(ctx, ctx.currentTime + 0.01, kind);
}

/** Clic de metrónomo (más agudo en el primer tiempo). */
function tick(audio: AudioContext, t: number, accent: boolean) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.value = accent ? 1480 : 990;
  osc.connect(gain);
  gain.connect(audio.destination);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.28 : 0.18, t + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  osc.start(t);
  osc.stop(t + 0.06);
}

/** Metrónomo preciso (programa los clics en el reloj de audio). Devuelve la función para pararlo. */
export function startMetronome(bpm: number, beats = 4): () => void {
  unlockAudio();
  const audio = ctx;
  if (!audio || !(bpm > 0)) return () => {};
  const step = 60 / Math.min(300, Math.max(20, bpm));
  let next = audio.currentTime + 0.06;
  let n = 0;
  const timer = setInterval(() => {
    while (next < audio.currentTime + 0.14) {
      tick(audio, next, n % beats === 0);
      next += step;
      n++;
    }
  }, 25);
  return () => clearInterval(timer);
}
