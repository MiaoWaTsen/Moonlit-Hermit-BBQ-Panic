/**
 * SoundManager: Procedural Web Audio API Sound Effects Generator
 * Zero external audio files required, instant load & 100% compatible
 */

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.sizzleNode = null;
    this.washNode = null;
    this.initAudioContext();
  }

  initAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      // Lazy init on first user gesture
      const unlockAudio = () => {
        if (!this.ctx) {
          this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('click', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Quick sound generator helper
  playTone(freq, type = 'sine', duration = 0.1, gain = 0.15) {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gainNode.gain.setValueAtTime(gain, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // 1. Pickup sound (cheerful upward pop)
  playPickup() {
    if (this.isMuted || !this.ctx) return;
    this.playTone(480, 'sine', 0.08, 0.2);
    setTimeout(() => this.playTone(680, 'sine', 0.08, 0.2), 30);
  }

  // 2. Drop / Place sound (soft downward thud)
  playDrop() {
    if (this.isMuted || !this.ctx) return;
    this.playTone(320, 'triangle', 0.09, 0.25);
  }

  // 3. Throw Whoosh sound
  playThrow() {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch (e) {}
  }

  // 4. Chopping Knife Click
  playChop() {
    if (this.isMuted || !this.ctx) return;
    this.playTone(900 + Math.random() * 200, 'triangle', 0.04, 0.25);
  }

  // 5. Dish Completed / Order Served Bell Chime (Festive Golden Ding)
  playOrderSuccess() {
    if (this.isMuted || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.35, 0.25), idx * 70);
    });
  }

  // 6. Water Washing Bubbles
  playWash() {
    if (this.isMuted || !this.ctx) return;
    this.playTone(350 + Math.random() * 150, 'sine', 0.05, 0.12);
  }

  // 7. Warning Alert Beep
  playWarning() {
    if (this.isMuted || !this.ctx) return;
    this.playTone(880, 'square', 0.1, 0.15);
  }

  // 8. Order Expired / Burnt Buzzer
  playBuzzer() {
    if (this.isMuted || !this.ctx) return;
    this.playTone(150, 'sawtooth', 0.25, 0.3);
  }
}
