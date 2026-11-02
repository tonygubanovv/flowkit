type AudioContextCtor = typeof AudioContext;

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  const AudioContextClass = window.AudioContext || ((window as any).webkitAudioContext as AudioContextCtor | undefined);
  if (!AudioContextClass) return null;

  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.72;
    masterGain.connect(audioContext.destination);
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => undefined);
  }

  return audioContext;
};

const warmAudio = () => {
  getAudioContext();
};

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', warmAudio, { once: true, passive: true });
  window.addEventListener('keydown', warmAudio, { once: true });
}

const play = (makeSound: (ctx: AudioContext, now: number, out: AudioNode) => void) => {
  try {
    const ctx = getAudioContext();
    if (!ctx || !masterGain) return;

    makeSound(ctx, ctx.currentTime + 0.003, masterGain);
  } catch {
    // Sound is optional UI feedback.
  }
};

const pop = (
  ctx: AudioContext,
  out: AudioNode,
  start: number,
  {
    freq,
    endFreq = freq,
    duration = 0.06,
    volume = 0.04,
    type = 'sine',
    pan = 0,
  }: {
    freq: number;
    endFreq?: number;
    duration?: number;
    volume?: number;
    type?: OscillatorType;
    pan?: number;
  },
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), start + duration);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  panner.pan.value = pan;

  osc.connect(gain);
  gain.connect(panner);
  panner.connect(out);

  osc.start(start);
  osc.stop(start + duration + 0.012);
};

export const playDoneSound = () => {
  play((ctx, now, out) => {
    pop(ctx, out, now, { freq: 523.25, endFreq: 659.25, duration: 0.07, volume: 0.045, pan: -0.05 });
    pop(ctx, out, now + 0.045, { freq: 783.99, endFreq: 987.77, duration: 0.085, volume: 0.036, pan: 0.05 });
  });
};

export const playTaskDragStartSound = () => {
  return;
};

export const playTaskDropSound = () => {
  return;
};

export const playTaskSaveSound = () => {
  return;
};

export const playTaskDeleteSound = () => {
  return;
};
