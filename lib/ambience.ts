/* Blind Eye ambience engine — synthesized, no audio files.
   Per-scene layered ambience with crossfades, plus one-shot events
   (train whistle, desk bell, screen door). Everything is gentle. */

export type AmbienceScene = 'town' | 'exterior' | 'lobby' | 'room6';

const MUTE_KEY = 'blindeye-muted';

interface Layer {
  gain: GainNode;
  stop: () => void;
}

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private scene: AmbienceScene | null = null;
  private layers: Layer[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      /* ignore */
    }
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);
    this.noise = makeNoiseBuffer(this.ctx);
    if (this.scene) this.startScene(this.scene);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime + 0.4);
    }
    return this.muted;
  }

  private addLayer(build: (ctx: AudioContext, out: GainNode) => () => void, peak: number): Layer {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(this.master!);
    const stopFns = build(ctx, out);
    out.gain.linearRampToValueAtTime(peak, ctx.currentTime + 3);
    const layer: Layer = {
      gain: out,
      stop: () => {
        try {
          stopFns();
        } catch {
          /* ignore */
        }
        try {
          out.disconnect();
        } catch {
          /* ignore */
        }
      },
    };
    this.layers.push(layer);
    return layer;
  }

  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  private later(ms: number, fn: () => void) {
    this.timers.push(setTimeout(fn, ms));
  }

  setScene(name: AmbienceScene) {
    this.scene = name;
    if (!this.ctx) return;
    // fade out old layers
    const old = this.layers;
    this.layers = [];
    this.clearTimers();
    const t = this.ctx.currentTime;
    old.forEach((l) => {
      l.gain.gain.cancelScheduledValues(t);
      l.gain.gain.linearRampToValueAtTime(0, t + 2.5);
      setTimeout(() => l.stop(), 3000);
    });
    this.startScene(name);
  }

  private noiseSrc(filterType: BiquadFilterType, freq: number, q = 1): { src: AudioBufferSourceNode; filt: BiquadFilterNode } {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise!;
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.value = freq;
    filt.Q.value = q;
    src.connect(filt);
    src.start();
    return { src, filt };
  }

  private startScene(name: AmbienceScene) {
    const ctx = this.ctx!;
    // wind everywhere, shaped per scene
    const windCutoff = name === 'room6' ? 220 : name === 'lobby' ? 300 : 480;
    const windPeak = name === 'room6' ? 0.05 : 0.075;
    this.addLayer((c, out) => {
      const { src, filt } = this.noiseSrc('lowpass', windCutoff);
      filt.connect(out);
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoG = c.createGain();
      lfoG.gain.value = windCutoff * 0.35;
      lfo.connect(lfoG);
      lfoG.connect(filt.frequency);
      lfo.start();
      return () => {
        try {
          src.stop();
          lfo.stop();
        } catch {
          /* ignore */
        }
      };
    }, windPeak);

    if (name === 'town' || name === 'exterior') {
      // insects
      this.addLayer((c, out) => {
        const { src, filt } = this.noiseSrc('bandpass', 5400, 9);
        filt.connect(out);
        const trem = c.createOscillator();
        trem.frequency.value = 17;
        const tg = c.createGain();
        tg.gain.value = 0.5;
        const base = c.createGain();
        base.gain.value = 0.5;
        trem.connect(tg);
        tg.connect(base.gain);
        filt.connect(base);
        base.connect(out);
        trem.start();
        return () => {
          try {
            src.stop();
            trem.stop();
          } catch {
            /* ignore */
          }
        };
      }, name === 'exterior' ? 0.02 : 0.012);
      // birds, sparse
      const chirp = () => {
        if (!this.ctx || this.scene !== name) return;
        const c = this.ctx;
        const o = c.createOscillator();
        o.type = 'sine';
        const g = c.createGain();
        g.gain.value = 0;
        o.connect(g);
        g.connect(this.master!);
        const t0 = c.currentTime;
        const f0 = 2300 + Math.random() * 900;
        o.frequency.setValueAtTime(f0, t0);
        o.frequency.exponentialRampToValueAtTime(f0 * 1.35, t0 + 0.09);
        o.frequency.exponentialRampToValueAtTime(f0 * 0.9, t0 + 0.2);
        g.gain.linearRampToValueAtTime(0.028, t0 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
        o.start(t0);
        o.stop(t0 + 0.35);
        this.later(3500 + Math.random() * 8000, chirp);
      };
      this.later(2500 + Math.random() * 4000, chirp);
    }

    if (name === 'lobby' || name === 'room6') {
      // room tone
      this.addLayer((c, out) => {
        const { src, filt } = this.noiseSrc('lowpass', name === 'room6' ? 110 : 160);
        filt.connect(out);
        return () => {
          try {
            src.stop();
          } catch {
            /* ignore */
          }
        };
      }, 0.05);
      // clock tick — in room 6 it runs slow and wrong
      const tick = () => {
        if (!this.ctx || this.scene !== name) return;
        const c = this.ctx;
        const t0 = c.currentTime;
        const o = c.createOscillator();
        o.type = 'square';
        o.frequency.value = name === 'room6' ? 1400 : 1900;
        const g = c.createGain();
        g.gain.setValueAtTime(0.012, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
        o.connect(g);
        g.connect(this.master!);
        o.start(t0);
        o.stop(t0 + 0.07);
        this.later(name === 'room6' ? 1400 : 1000, tick);
      };
      this.later(800, tick);
    }
  }

  /** Distant train whistle: two detuned tones, mournful. */
  whistle() {
    if (!this.ctx || !this.master) return;
    const c = this.ctx;
    const t0 = c.currentTime + 0.05;
    [622, 740].forEach((f) => {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f * 0.97;
      const vib = c.createOscillator();
      vib.frequency.value = 5.5;
      const vg = c.createGain();
      vg.gain.value = 6;
      vib.connect(vg);
      vg.connect(o.frequency);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.05, t0 + 0.5);
      g.gain.setValueAtTime(0.05, t0 + 1.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2);
      o.connect(g);
      g.connect(this.master!);
      o.start(t0);
      vib.start(t0);
      o.stop(t0 + 2.4);
      vib.stop(t0 + 2.4);
    });
  }

  /** Brass desk bell. */
  ding() {
    if (!this.ctx || !this.master) return;
    const c = this.ctx;
    const t0 = c.currentTime;
    [1568, 2093, 2637].forEach((f, i) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = c.createGain();
      const peak = 0.06 / (i + 1);
      g.gain.setValueAtTime(peak, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
      o.connect(g);
      g.connect(this.master!);
      o.start(t0);
      o.stop(t0 + 1.5);
    });
  }

  /** Screen door: soft rattle + low creak. */
  screenDoor() {
    if (!this.ctx || !this.master || !this.noise) return;
    const c = this.ctx;
    const t0 = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 900;
    f.Q.value = 2;
    const g = c.createGain();
    g.gain.setValueAtTime(0.09, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + 0.5);
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(95, t0);
    o.frequency.exponentialRampToValueAtTime(62, t0 + 0.5);
    const og = c.createGain();
    og.gain.setValueAtTime(0.02, t0);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    o.connect(lp);
    lp.connect(og);
    og.connect(this.master);
    o.start(t0);
    o.stop(t0 + 0.6);
  }
}

export const ambience = new Ambience();
