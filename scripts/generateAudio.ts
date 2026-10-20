/**
 * Synthesises the game's sound effects and background music loop into
 * assets/audio/*.wav. Everything is generated here (no samples), so there is
 * nothing to license; tweak the notes below and re-run to change a sound.
 *
 *   npm run audio
 *
 * WAV rather than MP3/AAC: compressed formats pad the start with silence,
 * which delays short effects and puts an audible gap in the music loop.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'assets/audio');

const SFX_RATE = 32000;
/** The music is soft and low, so a lower rate keeps the file small. */
const MUSIC_RATE = 22050;

/** Note name (e.g. "C5", "F#3") to frequency, A4 = 440 Hz. */
function hz(note: string): number {
  const m = /^([A-G])(#|b)?(\d)$/.exec(note);
  if (!m) throw new Error(`Bad note ${note}`);
  const steps: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  const semis = steps[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * 2 ** (semis / 12);
}

type Voice = {
  /** Harmonic multiples and their relative levels. */
  partials: readonly (readonly [number, number])[];
  attack: number;
  /** Exponential decay time constant in seconds. */
  decay: number;
};

/** Glassy bell: bright attack, slightly inharmonic upper partial. */
const BELL: Voice = { partials: [[1, 1], [2, 0.35], [3.01, 0.12], [4.2, 0.05]], attack: 0.004, decay: 0.22 };
/** Soft wooden pluck for taps. */
const PLUCK: Voice = { partials: [[1, 1], [2, 0.25], [3, 0.06]], attack: 0.002, decay: 0.03 };
/** Rounded low "bonk" for a near miss: odd harmonics only, like a triangle. */
const BONK: Voice = { partials: [[1, 1], [3, 0.11], [5, 0.04]], attack: 0.006, decay: 0.07 };
/** Music voices. */
const KEYS: Voice = { partials: [[1, 1], [2, 0.3], [3, 0.08]], attack: 0.005, decay: 0.32 };
const BASS: Voice = { partials: [[1, 1], [2, 0.18]], attack: 0.02, decay: 0.7 };

class Track {
  readonly data: Float32Array;
  constructor(
    readonly rate: number,
    seconds: number,
  ) {
    this.data = new Float32Array(Math.ceil(rate * seconds));
  }

  /** Adds one note starting at `at` seconds, lasting up to `length` seconds. */
  note(voice: Voice, freq: number, at: number, gain: number, length = voice.decay * 7) {
    const start = Math.floor(at * this.rate);
    // Clamped to the track so a note the track cuts short still fades out (no click).
    const n = Math.min(Math.floor(length * this.rate), this.data.length - start);
    const fadeOut = Math.floor(0.01 * this.rate);
    for (let i = 0; i < n; i++) {
      const t = i / this.rate;
      const env = Math.min(1, t / voice.attack) * Math.exp(-t / voice.decay) * Math.min(1, (n - i) / fadeOut);
      let s = 0;
      for (const [mult, level] of voice.partials) {
        // Upper partials die away faster, as on a real struck instrument.
        s += level * Math.exp((-t * (mult - 1)) / (voice.decay * 3)) * Math.sin(2 * Math.PI * freq * mult * t);
      }
      this.data[start + i] += s * env * gain;
    }
  }

  /** A sustained pad note with slow swell and two detuned copies for warmth. */
  pad(freq: number, at: number, length: number, gain: number) {
    const start = Math.floor(at * this.rate);
    const n = Math.floor(length * this.rate);
    const swell = 0.6;
    for (let i = 0; i < n && start + i < this.data.length; i++) {
      const t = i / this.rate;
      const env = Math.min(1, t / swell, (length - t) / swell);
      const s =
        Math.sin(2 * Math.PI * freq * 0.998 * t) + Math.sin(2 * Math.PI * freq * 1.002 * t) + 0.2 * Math.sin(2 * Math.PI * freq * 2 * t);
      this.data[start + i] += (s / 2.2) * Math.max(0, env) * gain;
    }
  }

  /** Folds everything past `seconds` back onto the start so the loop has no seam, then trims. */
  wrapTo(seconds: number): Track {
    const len = Math.round(seconds * this.rate);
    const out = new Track(this.rate, seconds);
    for (let i = 0; i < this.data.length; i++) out.data[i % len] += this.data[i];
    return out;
  }

  /** Scales so the loudest sample sits at `peak` (0..1). */
  normalize(peak: number): this {
    let max = 0;
    for (const s of this.data) max = Math.max(max, Math.abs(s));
    if (max > 0) for (let i = 0; i < this.data.length; i++) this.data[i] *= peak / max;
    return this;
  }

  /** 16-bit mono PCM WAV. */
  wav(): Buffer {
    const bytes = this.data.length * 2;
    const buf = Buffer.alloc(44 + bytes);
    buf.write('RIFF', 0);
    buf.writeUInt32LE(36 + bytes, 4);
    buf.write('WAVEfmt ', 8);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20); // PCM
    buf.writeUInt16LE(1, 22); // mono
    buf.writeUInt32LE(this.rate, 24);
    buf.writeUInt32LE(this.rate * 2, 28);
    buf.writeUInt16LE(2, 32);
    buf.writeUInt16LE(16, 34);
    buf.write('data', 36);
    buf.writeUInt32LE(bytes, 40);
    this.data.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2));
    return buf;
  }
}

/** Effects. Levels are relative; the app sets the final volume per sound. */
const SOUNDS: Record<string, () => Track> = {
  // A tile picked up or tapped: tiny, high and dry.
  select: () => {
    const t = new Track(SFX_RATE, 0.12);
    t.note(PLUCK, hz('E6'), 0, 1);
    return t.normalize(0.7);
  },
  // Word found: a bright rising pair.
  found: () => {
    const t = new Track(SFX_RATE, 0.9);
    t.note(BELL, hz('C6'), 0, 0.8);
    t.note(BELL, hz('G6'), 0.075, 1);
    t.note(BELL, hz('C7'), 0.075, 0.18);
    return t.normalize(0.85);
  },
  // Close but not counted (backwards drag, no word there): soft and falling, never harsh.
  warning: () => {
    const t = new Track(SFX_RATE, 0.45);
    t.note(BONK, hz('E4'), 0, 1);
    t.note(BONK, hz('C4'), 0.11, 0.9);
    return t.normalize(0.65);
  },
  // Hint: a quick pentatonic sparkle upwards.
  hint: () => {
    const t = new Track(SFX_RATE, 0.9);
    ['G5', 'A5', 'C6', 'D6', 'E6', 'G6'].forEach((n, i) => t.note({ ...BELL, decay: 0.12 }, hz(n), i * 0.045, 0.5 + i * 0.08));
    return t.normalize(0.6);
  },
  // Puzzle complete. Starts after a short pause so the last word's "found" chime is heard first.
  complete: () => {
    const t = new Track(SFX_RATE, 2.4);
    const lead = 0.28;
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => t.note(BELL, hz(n), lead + i * 0.09, 0.7));
    for (const n of ['C5', 'E5', 'G5', 'C6', 'E6']) t.note({ ...BELL, decay: 0.45 }, hz(n), lead + 0.4, 0.45);
    t.note(BELL, hz('G6'), lead + 0.52, 0.3);
    t.note(BELL, hz('C7'), lead + 0.62, 0.22);
    return t.normalize(0.9);
  },
};

/**
 * A calm 8-bar loop (90 bpm): warm pad, soft bass and a sparse keys arpeggio
 * over Cmaj7 / Am7 / Fmaj7 / G6, the second pass varying the pattern.
 */
function music(): Track {
  const beat = 60 / 90;
  const bar = beat * 4;
  const bars = 8;
  const loop = bar * bars;
  const t = new Track(MUSIC_RATE, loop + 3);
  const chords = [
    { root: 'C2', pad: ['C3', 'G3', 'B3', 'E4'], arp: ['C5', 'E5', 'G5', 'B5'] },
    { root: 'A1', pad: ['A2', 'E3', 'G3', 'C4'], arp: ['A4', 'C5', 'E5', 'G5'] },
    { root: 'F1', pad: ['F2', 'C3', 'E3', 'A3'], arp: ['F4', 'A4', 'C5', 'E5'] },
    { root: 'G1', pad: ['G2', 'D3', 'E3', 'B3'], arp: ['G4', 'B4', 'D5', 'E5'] },
  ];
  // Eighth-note steps per bar; -1 is a rest. Two patterns so the loop doesn't feel mechanical.
  const patterns = [
    [0, 2, 1, 3, 2, -1, 1, -1],
    [0, -1, 2, 3, -1, 2, 1, -1],
  ];
  for (let b = 0; b < bars; b++) {
    const chord = chords[b % chords.length];
    const at = b * bar;
    for (const n of chord.pad) t.pad(hz(n), at - 0.3, bar + 0.6, 0.055);
    t.note(BASS, hz(chord.root) * 2, at, 0.32, bar);
    t.note(BASS, hz(chord.root) * 2, at + beat * 2, 0.2, bar / 2);
    const pattern = patterns[Math.floor(b / chords.length) % patterns.length];
    pattern.forEach((step, i) => {
      if (step < 0) return;
      // Slight swing and accent on the beat for a human feel.
      const swing = i % 2 === 1 ? beat * 0.06 : 0;
      t.note(KEYS, hz(chord.arp[step]), at + (i * beat) / 2 + swing, i % 2 === 0 ? 0.16 : 0.11);
    });
  }
  return t.wrapTo(loop).normalize(0.7);
}

mkdirSync(OUT, { recursive: true });
for (const [name, make] of Object.entries(SOUNDS)) {
  writeFileSync(join(OUT, `${name}.wav`), make().wav());
  console.log(`assets/audio/${name}.wav`);
}
writeFileSync(join(OUT, 'music.wav'), music().wav());
console.log('assets/audio/music.wav');
