import { STREAM_AUDIO_URL } from './live365Service';

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isInitialized = false;
  private isSourceConnected = false;
  private fallbackPhase = 0;

  // VU meter smoothed levels (0 to 1)
  private leftLevel = 0;
  private rightLevel = 0;
  private leftPeak = 0;
  private rightPeak = 0;

  private frequencyData: Uint8Array = new Uint8Array(128);
  private timeDomainData: Uint8Array = new Uint8Array(128);

  private constructor() {
    this.initAudioElement();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private initAudioElement() {
    if (typeof window === 'undefined') return;

    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'none';
    this.audio.src = STREAM_AUDIO_URL;
  }

  private setupWebAudio() {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      this.gainNode = this.audioContext.createGain();

      if (this.audio && !this.isSourceConnected) {
        try {
          this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
          this.sourceNode.connect(this.analyser);
          this.analyser.connect(this.gainNode);
          this.gainNode.connect(this.audioContext.destination);
          this.isSourceConnected = true;
        } catch (e) {
          console.warn('Could not create media element source directly (CORS fallback active):', e);
        }
      }

      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio API initialization failed:', err);
    }
  }

  public async play(): Promise<void> {
    if (!this.audio) this.initAudioElement();
    if (!this.audio) return;

    this.setupWebAudio();

    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Refresh stream src to guarantee live edge and avoid cached buffer lag
    const isPlaying = !this.audio.paused && !this.audio.ended && this.audio.readyState > 2;
    if (!isPlaying) {
      this.audio.src = `${STREAM_AUDIO_URL}?t=${Date.now()}`;
      this.audio.load();
    }

    try {
      await this.audio.play();
    } catch (err) {
      console.error('Audio play error:', err);
      throw err;
    }
  }

  public pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  public stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
    }
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = clamped;
    }
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(clamped, this.audioContext.currentTime);
    }
  }

  public setMuted(muted: boolean): void {
    if (this.audio) {
      this.audio.muted = muted;
    }
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }

  public isAudioPlaying(): boolean {
    if (!this.audio) return false;
    return !this.audio.paused && !this.audio.ended && this.audio.readyState > 1;
  }

  /**
   * Reads real-time spectrum and time-domain samples.
   * If real Web Audio analyser has active data, returns it.
   * Otherwise, generates a synthetic dynamic spectrum matching live rhythm and volume.
   */
  public getVisualizerData(): {
    frequency: Uint8Array;
    timeDomain: Uint8Array;
    leftVu: number;
    rightVu: number;
    leftPeak: number;
    rightPeak: number;
  } {
    const isPlaying = this.isAudioPlaying();
    const volume = this.audio ? (this.audio.muted ? 0 : this.audio.volume) : 0.8;

    let hasRealData = false;

    if (this.analyser && isPlaying) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      this.analyser.getByteTimeDomainData(this.timeDomainData);

      // Check if frequency data is non-zero
      let sum = 0;
      for (let i = 0; i < 20; i++) {
        sum += this.frequencyData[i];
      }
      if (sum > 10) {
        hasRealData = true;
      }
    }

    if (!hasRealData) {
      this.generateSimulatedData(isPlaying, volume);
    }

    // Calculate VU meter ballistics
    this.updateVuMeters(isPlaying, volume, hasRealData);

    return {
      frequency: this.frequencyData,
      timeDomain: this.timeDomainData,
      leftVu: this.leftLevel,
      rightVu: this.rightLevel,
      leftPeak: this.leftPeak,
      rightPeak: this.rightPeak,
    };
  }

  private generateSimulatedData(isPlaying: boolean, volume: number) {
    const len = this.frequencyData.length || 64;
    this.fallbackPhase += 0.08;

    if (!isPlaying || volume === 0) {
      for (let i = 0; i < len; i++) {
        this.frequencyData[i] = Math.max(0, this.frequencyData[i] - 6);
        this.timeDomainData[i] = 128;
      }
      return;
    }

    const t = this.fallbackPhase;
    const baseBeat = Math.pow(Math.sin(t * 1.8), 2) * 0.4 + Math.pow(Math.sin(t * 3.6), 2) * 0.3 + 0.3;
    const midPulse = Math.sin(t * 2.4) * 0.3 + 0.5;
    const highFlicker = Math.sin(t * 5.2 + 1) * 0.2 + 0.4;

    for (let i = 0; i < len; i++) {
      const normalizedFreq = i / len;
      // Classic EQ curve: high bass, balanced mids, rolled-off treble
      let profile = Math.exp(-normalizedFreq * 2.5) * 220 * baseBeat;
      profile += Math.sin(i * 0.3 + t * 2) * 35 * midPulse;
      profile += Math.cos(i * 0.7 - t * 3) * 25 * highFlicker;
      profile += (Math.random() - 0.5) * 18;

      const target = Math.max(8, Math.min(255, profile * volume));
      // Smooth toward target
      this.frequencyData[i] = Math.round(this.frequencyData[i] * 0.65 + target * 0.35);

      // Synthesize realistic sine waveform for oscilloscope
      const wave = Math.sin(i * 0.2 + t * 4) * 50 * volume * baseBeat + 
                   Math.sin(i * 0.5 - t * 2) * 20 * volume;
      this.timeDomainData[i] = Math.max(0, Math.min(255, Math.round(128 + wave)));
    }
  }

  private updateVuMeters(isPlaying: boolean, volume: number, hasRealData: boolean) {
    let targetLeft = 0;
    let targetRight = 0;

    if (isPlaying && volume > 0) {
      if (hasRealData) {
        // Average low and mid frequencies for left / right channels
        let leftSum = 0;
        let rightSum = 0;
        const half = Math.floor(this.frequencyData.length / 2);

        for (let i = 0; i < half; i++) {
          leftSum += this.frequencyData[i];
        }
        for (let i = half; i < this.frequencyData.length; i++) {
          rightSum += this.frequencyData[i];
        }

        targetLeft = (leftSum / (half * 255)) * 1.2 * volume;
        targetRight = (rightSum / (half * 255)) * 1.25 * volume;
      } else {
        const beat = (Math.sin(this.fallbackPhase * 2) * 0.3 + 0.7) * volume;
        const jitterL = (Math.random() * 0.1 - 0.05);
        const jitterR = (Math.random() * 0.1 - 0.05);
        targetLeft = Math.max(0, Math.min(1, 0.65 * beat + jitterL));
        targetRight = Math.max(0, Math.min(1, 0.68 * beat + jitterR));
      }
    }

    // Ballistic needle smoothing (fast rise, slower exponential decay)
    const attack = 0.35;
    const decay = 0.08;

    this.leftLevel = targetLeft > this.leftLevel 
      ? this.leftLevel + (targetLeft - this.leftLevel) * attack 
      : this.leftLevel + (targetLeft - this.leftLevel) * decay;

    this.rightLevel = targetRight > this.rightLevel 
      ? this.rightLevel + (targetRight - this.rightLevel) * attack 
      : this.rightLevel + (targetRight - this.rightLevel) * decay;

    // Peak indicators with gravity hold
    if (this.leftLevel > this.leftPeak) {
      this.leftPeak = this.leftLevel;
    } else {
      this.leftPeak = Math.max(0, this.leftPeak - 0.015);
    }

    if (this.rightLevel > this.rightPeak) {
      this.rightPeak = this.rightLevel;
    } else {
      this.rightPeak = Math.max(0, this.rightPeak - 0.015);
    }
  }
}
