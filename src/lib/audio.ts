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

/** Tres pitidos al terminar el descanso. */
export function beep() {
  const audio = ctx;
  if (!audio) return;
  [0, 0.24, 0.48].forEach((offset, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const t = audio.currentTime + offset;
    osc.type = "sine";
    osc.frequency.value = i === 2 ? 1046 : 784;
    osc.connect(gain);
    gain.connect(audio.destination);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.22);
  });
}
