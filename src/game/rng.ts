/**
 * Seeded pseudo-random number generation.
 *
 * The entire simulation runs off this. Two runs with the same seed must produce
 * byte-identical careers. That is what makes the daily mode fair and a shared
 * seed replayable. `Math.random()` must never appear anywhere else in
 * `src/game`; an RNG instance is threaded explicitly through every call that
 * needs randomness.
 */

/** Deterministic 32-bit string hash (FNV-1a). Same string → same seed, forever. */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export class Rng {
  private state: number
  readonly seed: string

  constructor(seed: string) {
    this.seed = seed
    // Avoid a 0 state, which would make mulberry32 degenerate.
    this.state = hashSeed(seed) || 0x9e3779b9
  }

  /** Float in [0, 1). mulberry32: small, fast, good enough distribution for a game. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Float in [min, max). */
  float(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    if (max < min) return min
    return Math.floor(this.float(min, max + 1))
  }

  /** True with probability `p` (clamped to [0, 1]). */
  chance(p: number): boolean {
    return this.next() < clamp(p, 0, 1)
  }

  /** Uniform pick. Throws on an empty list rather than returning undefined. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick called with an empty array')
    return items[this.int(0, items.length - 1)]
  }

  /**
   * Weighted pick. Non-positive weights are skipped; if every weight is <= 0 we
   * fall back to a uniform pick so callers can never get stuck.
   */
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
    if (items.length === 0) throw new Error('Rng.weighted called with an empty array')
    const weights = items.map((it) => Math.max(0, weightOf(it)))
    const total = weights.reduce((a, b) => a + b, 0)
    if (total <= 0) return this.pick(items)
    let roll = this.next() * total
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i]
      if (roll < 0) return items[i]
    }
    return items[items.length - 1]
  }

  /** `count` distinct items, or all of them if count >= length. Order is randomized. */
  sample<T>(items: readonly T[], count: number): T[] {
    const pool = [...items]
    this.shuffle(pool)
    return pool.slice(0, Math.max(0, Math.min(count, pool.length)))
  }

  /** In-place Fisher-Yates. */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.int(0, i)
      ;[items[i], items[j]] = [items[j], items[i]]
    }
    return items
  }

  /**
   * Approximately normal via the mean of 3 uniforms (Bates). Cheap, bounded, and
   * unlike Box-Muller, can never return a wild tail value that produces a
   * 71-point-per-game season.
   */
  gauss(mean: number, stdDev: number): number {
    const u = (this.next() + this.next() + this.next()) / 3
    return mean + (u - 0.5) * 3.46 * stdDev
  }

  /** Gaussian clamped to [min, max]. The workhorse for stat generation. */
  gaussClamped(mean: number, stdDev: number, min: number, max: number): number {
    return clamp(this.gauss(mean, stdDev), min, max)
  }

  /**
   * A child RNG whose stream is derived from this one's seed plus a label.
   * Lets a subsystem (the rival's parallel career, say) draw numbers without
   * shifting the main stream and desynchronising every later event.
   */
  fork(label: string): Rng {
    return new Rng(`${this.seed}::${label}`)
  }
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/** Round to `places` decimals, avoiding `-0` and float dust like 12.300000000000001. */
export function round(value: number, places = 1): number {
  const f = 10 ** places
  const r = Math.round(value * f) / f
  return Object.is(r, -0) ? 0 : r
}

/** `YYYY-MM-DD` in UTC, the basis of the daily seed. */
export function dailySeedKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

/** A short, human-shareable seed like `7F3K-92QX`. */
export function randomSeed(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) out += '-'
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}
