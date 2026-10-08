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

/** Una campana suave: tono fundamental + armónico inarmónico que se apaga antes (suena a "ding" de metal). */
function bell(audio: BaseAudioContext, out: AudioNode, freq: number, t: number, peak: number, decay: number) {
  for (const [mult, level, d] of [[1, 1, decay], [2.76, 0.32, decay * 0.45], [5.4, 0.12, decay * 0.2]] as const) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * mult;
    osc.connect(gain);
    gain.connect(out);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak * level, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.start(t);
    osc.stop(t + d + 0.05);
  }
}

/**
 * Sonido de Apex: arpegio ascendente de campanas (Do–Mi–Sol–Do) que remata en un acorde largo.
 * Dura unos 2,5 segundos. Se separa de `beep` para poder probarlo en un contexto de audio sin conexión.
 */
export function scheduleChime(audio: BaseAudioContext, t0: number) {
  const master = audio.createGain();
  master.gain.value = 0.5;
  master.connect(audio.destination);
  const notes: [number, number][] = [[523.25, 0], [659.25, 0.15], [783.99, 0.3], [1046.5, 0.45]];
  for (const [f, dt] of notes) bell(audio, master, f, t0 + dt, 0.5, 1.2);
  for (const f of [523.25, 783.99, 1046.5, 1318.5]) bell(audio, master, f, t0 + 0.72, 0.4, 3.0);
}

/** Aviso al terminar el descanso (y el Pomodoro). */
export function beep() {
  if (ctx) scheduleChime(ctx, ctx.currentTime + 0.02);
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
