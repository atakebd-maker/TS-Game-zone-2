class SoundController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check local storage for mute preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('novaplay_muted');
      this.isMuted = saved === 'true';
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('novaplay_muted', String(this.isMuted));
    }
    return this.isMuted;
  }

  public playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, gainVal: number = 0.15) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy or not supported
    }
  }

  public playLaser() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  public playExplosion() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  public playCoin() {
    if (this.isMuted) return;
    this.playTone(987.77, 'sine', 0.08, 0.18);
    setTimeout(() => {
      this.playTone(1318.51, 'sine', 0.15, 0.2);
    }, 80);
  }

  public playClick() {
    this.playTone(400, 'sine', 0.04, 0.08);
  }

  public playSuccess() {
    if (this.isMuted) return;
    this.playTone(523.25, 'triangle', 0.1, 0.15); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.1, 0.15), 100); // E5
    setTimeout(() => this.playTone(783.99, 'triangle', 0.12, 0.18), 200); // G5
    setTimeout(() => this.playTone(1046.5, 'triangle', 0.25, 0.2), 300); // C6
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.playTone(440, 'sawtooth', 0.15, 0.2);
    setTimeout(() => this.playTone(370, 'sawtooth', 0.18, 0.2), 150);
    setTimeout(() => this.playTone(293, 'sawtooth', 0.35, 0.22), 330);
  }

  public playBounce() {
    this.playTone(320, 'sine', 0.06, 0.15);
  }

  public playSwish() {
    this.playTone(600, 'sine', 0.12, 0.18);
  }

  public playPowerup() {
    if (this.isMuted) return;
    this.playTone(440, 'triangle', 0.08, 0.15);
    setTimeout(() => this.playTone(554.37, 'triangle', 0.08, 0.15), 70);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.2), 140);
  }

  public playVictory() {
    this.playSuccess();
  }
}

export const sound = new SoundController();
