let audioCtx: AudioContext | null = null;
let loopTimer: number | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

export function stopRetroAudio(): void {
  if (loopTimer !== null) {
    window.clearInterval(loopTimer);
    loopTimer = null;
  }
}

export function playModemHandshake(): void {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Brief DTMF-like dial tones + V.90 negotiation chirps
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  gain.gain.setValueAtTime(0.05, now);

  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.setValueAtTime(2400, now + 0.12);
  osc.frequency.setValueAtTime(980, now + 0.25);
  osc.frequency.setValueAtTime(1650, now + 0.4);
  osc.frequency.setValueAtTime(2100, now + 0.55);
  osc.frequency.exponentialRampToValueAtTime(1400, now + 0.95);

  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 1.08);
}

const TRACKS: Record<string, { tempoMs: number; notes: number[]; wave: OscillatorType }> = {
  cyberia: {
    tempoMs: 170,
    wave: 'triangle',
    notes: [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23, 440.0, 523.25, 440.0, 349.23],
  },
  netscape: {
    tempoMs: 190,
    wave: 'square',
    notes: [220.0, 261.63, 329.63, 440.0, 392.0, 329.63, 293.66, 329.63, 261.63, 196.0, 220.0, 261.63],
  },
  y2k: {
    tempoMs: 145,
    wave: 'sawtooth',
    notes: [329.63, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66, 261.63, 293.66, 329.63, 261.63, 220.0],
  },
};

export function playMidiTrack(trackName: string): string {
  stopRetroAudio();
  if (trackName === 'stop') {
    return 'Stopped MIDI playback';
  }

  const track = TRACKS[trackName];
  const ctx = getCtx();
  if (!track || !ctx) {
    return 'Audio synthesizer unavailable';
  }

  let step = 0;
  const playStep = () => {
    const now = ctx.currentTime;
    const freq = track.notes[step % track.notes.length];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = track.wave;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + track.tempoMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + track.tempoMs / 1000);
    step += 1;
  };

  playStep();
  loopTimer = window.setInterval(playStep, track.tempoMs);
  return `Playing ${trackName}.mid`;
}
