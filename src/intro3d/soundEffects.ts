export class IntroSfxEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private firedCues = new Set<string>();

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public unlock(): boolean {
    if (typeof window === 'undefined') return false;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return false;
    if (!this.ctx) {
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx.state === 'running';
  }

  public reset(): void {
    this.firedCues.clear();
  }

  public dispose(): void {
    this.firedCues.clear();
  }

  public triggerOnce(cueId: string, fn: () => void): void {
    if (this.firedCues.has(cueId)) return;
    this.firedCues.add(cueId);
    if (this.muted) return;
    fn();
  }

  private ensureRunningCtx(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public playDoorOpen(): void {
    const ctx = this.ensureRunningCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(92, now + 0.24);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playPaperCrumple(): void {
    const ctx = this.ensureRunningCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.32);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.4;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  public playTrashClank(): void {
    const ctx = this.ensureRunningCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.16);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playFootstep(pitchOffset = 0): void {
    const ctx = this.ensureRunningCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95 + pitchOffset, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.08);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playPhoneBeep(): void {
    const ctx = this.ensureRunningCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1320, 1760].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.04, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.075);
    });
  }

  public playIdeaSting(): void {
    const ctx = this.ensureRunningCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.045);
      gain.gain.setValueAtTime(0.08, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.36);
    });
  }

  public playPowerButtonClick(): void {
    const ctx = this.ensureRunningCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);

    // Subtle 1999 CRT power-on hum
    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(110, now + 0.08);
    humGain.gain.setValueAtTime(0.001, now + 0.08);
    humGain.gain.linearRampToValueAtTime(0.035, now + 0.25);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    hum.connect(humGain);
    humGain.connect(ctx.destination);
    hum.start(now + 0.08);
    hum.stop(now + 1.15);
  }

  public playMouseClick(): void {
    const ctx = this.ensureRunningCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.03);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playSubtleStartupChime(): void {
    const ctx = this.ensureRunningCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(392, now);
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.45);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  public playWin98StartupChord(): void {
    const ctx = this.ensureRunningCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Soft nostalgic 1998-style rising polyphonic chord progression
    const events: Array<{ time: number; freqs: number[]; dur: number }> = [
      { time: 0.0, freqs: [261.63, 329.63, 392.0], dur: 0.65 },
      { time: 0.42, freqs: [293.66, 369.99, 440.0], dur: 0.65 },
      { time: 0.85, freqs: [329.63, 415.3, 493.88, 659.25], dur: 1.8 },
    ];
    events.forEach((ev) => {
      ev.freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + ev.time);
        gain.gain.setValueAtTime(0.001, now + ev.time);
        gain.gain.linearRampToValueAtTime(0.032, now + ev.time + 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + ev.time + ev.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + ev.time);
        osc.stop(now + ev.time + ev.dur + 0.05);
      });
    });
  }
}
