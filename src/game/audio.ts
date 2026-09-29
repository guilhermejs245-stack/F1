/**
 * Procedural Web Audio API Sound Generator for Street Drift
 * Creates rich engine synthesis, tire squeals, blow-off valve, collision thuds, and UI chimes.
 */

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Engine nodes
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning = false;

  // Tire squeal nodes
  private squealNoise: AudioBufferSourceNode | null = null;
  private squealGain: GainNode | null = null;
  private squealFilter: BiquadFilterNode | null = null;
  private isSquealing = false;

  // Volumes
  private masterVol = 0.8;
  private engineVol = 0.7;
  private sfxVol = 0.8;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public init(masterVol = 0.8, engineVol = 0.7, sfxVol = 0.8): void {
    this.masterVol = masterVol;
    this.engineVol = engineVol;
    this.sfxVol = sfxVol;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVol;
      this.masterGain.connect(this.ctx.destination);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = this.engineVol;
      this.engineGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateVolumes(master: number, engine: number, sfx: number): void {
    this.masterVol = master;
    this.engineVol = engine;
    this.sfxVol = sfx;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(master, this.ctx.currentTime, 0.05);
    }
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(engine, this.ctx.currentTime, 0.05);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
    }
  }

  public startEngine(): void {
    if (!this.ctx || this.isEngineRunning) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      this.osc1 = this.ctx.createOscillator();
      this.osc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();

      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';

      this.osc1.frequency.value = 55; // Sub-bass idle rumble
      this.osc2.frequency.value = 110;

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 350;
      this.engineFilter.Q.value = 3;

      const subGain = this.ctx.createGain();
      subGain.gain.value = 0.25;

      this.osc1.connect(this.engineFilter);
      this.osc2.connect(this.engineFilter);
      this.engineFilter.connect(subGain);
      if (this.engineGain) {
        subGain.connect(this.engineGain);
      }

      this.osc1.start();
      this.osc2.start();
      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Erro ao iniciar som do motor:', e);
    }
  }

  public stopEngine(): void {
    if (!this.isEngineRunning) return;
    try {
      this.osc1?.stop();
      this.osc2?.stop();
      this.osc1?.disconnect();
      this.osc2?.disconnect();
      this.stopSqueal();
    } catch {
      // ignore
    }
    this.isEngineRunning = false;
  }

  public updateEngine(speedKmh: number, throttle: number): void {
    if (!this.ctx || !this.isEngineRunning || !this.osc1 || !this.osc2 || !this.engineFilter) return;

    // F1 8-Speed Gearbox & High-Revving V6 Turbo Hybrid (up to 14,000 RPM, 350 km/h)
    const speedRatio = Math.min(speedKmh / 350, 1.0);
    // 8 gear ratios
    const gearFraction = (speedRatio * 7.5) % 1;
    const rpm = 3500 + throttle * 2500 + gearFraction * 7500 + speedRatio * 1500;

    // High screaming F1 frequencies
    const baseFreq = 75 + (rpm / 14000) * 280;
    const filterFreq = 400 + (rpm / 14000) * 3200 + (throttle > 0 ? 500 : 0);

    const now = this.ctx.currentTime;
    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
    this.osc2.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.03);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.04);
  }

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public updateTireSqueal(slipRatio: number, speedKmh: number): void {
    if (!this.ctx || !this.sfxGain) return;

    const isSquealingNow = slipRatio > 0.15 && speedKmh > 12;

    if (isSquealingNow) {
      if (!this.isSquealing) {
        // Start squeal noise
        const buffer = this.createNoiseBuffer();
        if (!buffer) return;

        this.squealNoise = this.ctx.createBufferSource();
        this.squealNoise.buffer = buffer;
        this.squealNoise.loop = true;

        this.squealFilter = this.ctx.createBiquadFilter();
        this.squealFilter.type = 'bandpass';
        this.squealFilter.frequency.value = 1100;
        this.squealFilter.Q.value = 4;

        this.squealGain = this.ctx.createGain();
        this.squealGain.gain.value = 0;

        this.squealNoise.connect(this.squealFilter);
        this.squealFilter.connect(this.squealGain);
        this.squealGain.connect(this.sfxGain);

        this.squealNoise.start();
        this.isSquealing = true;
      }

      // Modulate volume and pitch based on slip and speed
      if (this.squealGain && this.squealFilter) {
        const targetGain = Math.min(0.35, (slipRatio - 0.1) * 0.7);
        const targetFreq = 900 + slipRatio * 800 + Math.min(speedKmh, 150) * 4;
        const now = this.ctx.currentTime;
        this.squealGain.gain.setTargetAtTime(targetGain, now, 0.05);
        this.squealFilter.frequency.setTargetAtTime(targetFreq, now, 0.05);
      }
    } else {
      this.stopSqueal();
    }
  }

  private stopSqueal(): void {
    if (this.isSquealing && this.squealGain && this.ctx) {
      this.squealGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      setTimeout(() => {
        try {
          this.squealNoise?.stop();
          this.squealNoise?.disconnect();
          this.squealGain?.disconnect();
        } catch {
          // ignore
        }
        this.isSquealing = false;
      }, 60);
    }
  }

  public playCollision(intensity: number): void {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140 * Math.min(1.5, intensity), now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

      filter.type = 'lowpass';
      filter.frequency.value = 400;

      const vol = Math.min(0.8, Math.max(0.2, intensity * 0.4));
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.3);

      // Noise impact layer
      const noise = this.ctx.createBufferSource();
      const buffer = this.createNoiseBuffer();
      if (buffer) {
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(vol * 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.15);
      }
    } catch (e) {
      console.warn('Erro ao tocar colisão:', e);
    }
  }

  public playTurboPop(): void {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      const buffer = this.createNoiseBuffer();
      if (!buffer) return;
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2500, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.2);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  public playUiClick(): void {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }

  public playCashEarned(): void {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = now + i * 0.06;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch {
      // ignore
    }
  }
}
