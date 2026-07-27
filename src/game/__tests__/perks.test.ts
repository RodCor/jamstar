import { describe, expect, it, vi } from 'vitest'

import type { Perk, PerkRarity } from '@/data/perks'

/**
 * The two-stage rarity draw is tested against a small fixture that spans
 * every rarity, rather than the real 53-perk pool. Task 2 tagged every real
 * perk with a rarity and Task 3 grew the pool to 14/14/12/8/5, but the
 * mechanism tests still want a pool with a known, exact count per tier —
 * independent of however the real content happens to be distributed — so the
 * fixture stays.
 */
const FIXTURE_PERKS = vi.hoisted(() => {
  function tier(rarity: string, count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `${rarity}_${i}`,
      name: { es: rarity, en: rarity },
      description: { es: '', en: '' },
      bonus: {},
      rarity,
      weight: 10,
    }))
  }
  return [
    ...tier('basic', 6),
    ...tier('silver', 6),
    ...tier('gold', 6),
    ...tier('legend', 4),
    ...tier('top1', 3),
  ]
})

vi.mock('@/data/perks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/perks')>()
  return { ...actual, PERKS: FIXTURE_PERKS as unknown as Perk[] }
})

import { createGame } from '../create'
import { Rng } from '../rng'
import { PERK_RARITIES, drawPerkChoices, rarityOdds, standingFor } from '../perks'
import type { Player, Season } from '../types'

function player(): Player {
  return createGame(
    { name: 'Test', countryCode: 'ES', number: 9, position: 'SF', hand: 'right', styleId: 'scorer' },
    'perks-fixture',
    'career',
  ).player
}

function season(over: Partial<Season> = {}): Season {
  return {
    year: 2035, age: 26, stage: 'prime', teamId: 'bos', leagueId: 'nba', role: 'star',
    gamesPlayed: 82, gamesMissed: 0, minutesPerGame: 34, points: 24, rebounds: 6,
    assists: 5, steals: 1.2, blocks: 0.6, turnovers: 2.4, fgPct: 0.5, threePct: 0.38,
    ftPct: 0.85, tsPct: 0.61, rating: 80, teamWins: 58, teamLosses: 24,
    playoffResult: 'none', awards: [], salary: 1, injuries: [], headlines: [],
    ...over,
  }
}

describe('standingFor', () => {
  it('is 0 for a rookie with no prior season', () => {
    expect(standingFor(null)).toBe(0)
  })

  it('rises monotonically with rating', () => {
    const low = standingFor(season({ rating: 55 }))
    const mid = standingFor(season({ rating: 75 }))
    const high = standingFor(season({ rating: 95 }))
    expect(low).toBeLessThan(mid)
    expect(mid).toBeLessThan(high)
  })

  it('adds for major awards and a title on top of rating alone', () => {
    const plain = standingFor(season({ rating: 84 }))
    const decorated = standingFor(season({ rating: 84, awards: ['mvp', 'league_champion'] }))
    expect(decorated).toBeGreaterThan(plain)
  })
})

describe('rarityOdds', () => {
  it('sums to 1 at every standing level', () => {
    for (const s of [0, 0.25, 0.5, 0.75, 1]) {
      const odds = rarityOdds(s)
      const total = PERK_RARITIES.reduce((sum, r) => sum + odds[r], 0)
      expect(total).toBeCloseTo(1, 9)
    }
  })

  it('gives top1 zero odds at standing 0', () => {
    expect(rarityOdds(0).top1).toBe(0)
  })

  it('puts more mass on legend and top1 as standing rises to 1', () => {
    const low = rarityOdds(0)
    const high = rarityOdds(1)
    expect(high.legend + high.top1).toBeGreaterThan(low.legend + low.top1)
  })
})

describe('drawPerkChoices', () => {
  it('returns 3 distinct, unowned ids across 20 consecutive draws at standing 0', () => {
    const p = player()
    for (let i = 0; i < 20; i++) {
      const rng = new Rng(`draw-low-${i}`)
      const choices = drawPerkChoices(p, rng, null)
      expect(choices).toHaveLength(3)
      expect(new Set(choices).size).toBe(3)
      for (const id of choices) expect(p.perks).not.toContain(id)
      p.perks.push(choices[0])
    }
  })

  it('returns 3 distinct, unowned ids across 20 consecutive draws at standing 1', () => {
    const p = player()
    const bestSeason = season({ rating: 100, awards: ['mvp', 'league_champion', 'all_star'] })
    for (let i = 0; i < 20; i++) {
      const rng = new Rng(`draw-high-${i}`)
      const choices = drawPerkChoices(p, rng, bestSeason)
      expect(choices).toHaveLength(3)
      expect(new Set(choices).size).toBe(3)
      for (const id of choices) expect(p.perks).not.toContain(id)
      p.perks.push(choices[0])
    }
  })

  it('falls down a tier rather than up once every top1 perk is owned', () => {
    const p = player()
    p.perks.push('top1_0', 'top1_1', 'top1_2')
    const bestSeason = season({ rating: 100, awards: ['mvp', 'league_champion', 'all_star'] })
    const rng = new Rng('exhausted-top1')
    const choices = drawPerkChoices(p, rng, bestSeason)
    expect(choices).toHaveLength(3)
    expect(choices.some((id) => id.startsWith('top1_'))).toBe(false)
  })
})

describe('perk bonus budgets', () => {
  /**
   * Everything above this point mocks `@/data/perks` to isolate the draw
   * mechanism from real content. This guard is the opposite: it exists to
   * check the real content, so it reaches past the mock with `importActual`
   * rather than asserting against `FIXTURE_PERKS`.
   *
   * This is what stops the pool drifting now that it holds 53 perks — a
   * single perk with an out-of-band `bonus` total fails here immediately,
   * rather than surfacing only as a distribution shift many careers later.
   * The bands themselves are load-bearing: an earlier pass scaled them up by
   * 1/0.675 and that alone moved five of the nine metrics in
   * `career-distribution.test.ts` out of band.
   */
  it('gives every real perk a bonus total inside its rarity\'s budget', async () => {
    const real = await vi.importActual<typeof import('@/data/perks')>('@/data/perks')
    expect(real.PERKS.length).toBeGreaterThan(0)

    for (const perk of real.PERKS) {
      const total = Object.values(perk.bonus).reduce((sum: number, points) => sum + (points ?? 0), 0)
      const budget = real.PERK_BUDGET[perk.rarity as PerkRarity]
      expect(
        total,
        `${perk.id} (${perk.rarity}): total ${total} outside [${budget.min}, ${budget.max}]`,
      ).toBeGreaterThanOrEqual(budget.min)
      expect(
        total,
        `${perk.id} (${perk.rarity}): total ${total} outside [${budget.min}, ${budget.max}]`,
      ).toBeLessThanOrEqual(budget.max)
    }
  })
})

/**
 * The guard above bounds each perk on its own. That is not enough, and the
 * gap is not theoretical — it was measured.
 *
 * A career takes roughly twenty perks, so what reaches the player is the
 * pool's *aggregate* magnitude, and `PERK_BUDGET` says nothing about it.
 * Every one of these placements is legal per-perk and reds the suite:
 *
 * - 266 points (Gold and Legend seated at their band tops) puts
 *   `allStarsPerCareer` at +21.34% against ±12%.
 * - 246 points (every perk at its band floor) clears all nine distribution
 *   metrics but fails `legacy.test.ts > rewards perks chosen to suit the
 *   position`, because a pool with no spread inside a tier leaves nothing for
 *   an informed pick to be better *at*.
 *
 * The pool currently sits at 257 and the suite's tightest metric,
 * `allStarsPerCareer`, holds only 0.54pp of headroom — which works out at
 * roughly half a growth point across the whole 53-perk pool. So the total is
 * asserted directly, along with the size and the tier spread that set it.
 *
 * A failure here is not a licence to widen this band. It means the pool's
 * magnitude moved, and the response is to re-run
 * `career-distribution.test.ts` and `legacy.test.ts` and find out what that
 * did — those are the measurements this band is a cheap proxy for.
 */
describe('the pool as a whole', () => {
  const EXPECTED_TOTAL = 257
  /**
   * ±3%, i.e. 250–264 growth points.
   *
   * Deliberately narrower than it looks like it could be. The nearest
   * measured failures are 246 and 266, and ±4% would reach 267.3 — admitting
   * the 266-point placement that is known to red `allStarsPerCareer`. ±3%
   * clears both boundaries with a few points to spare on each side while
   * still leaving room to re-place a handful of perks inside their bands.
   */
  const TOLERANCE = 0.03

  const SPREAD: Record<PerkRarity, number> = {
    basic: 14, silver: 14, gold: 12, legend: 8, top1: 5,
  }

  it('holds 53 perks in a 14/14/12/8/5 spread', async () => {
    const real = await vi.importActual<typeof import('@/data/perks')>('@/data/perks')
    expect(real.PERKS).toHaveLength(53)

    const counts = {} as Record<PerkRarity, number>
    for (const rarity of Object.keys(SPREAD) as PerkRarity[]) counts[rarity] = 0
    for (const perk of real.PERKS) counts[perk.rarity as PerkRarity] += 1
    expect(counts).toEqual(SPREAD)
  })

  it('spends a total across the pool within 3% of 257 growth points', async () => {
    const real = await vi.importActual<typeof import('@/data/perks')>('@/data/perks')
    const total = real.PERKS.reduce(
      (sum, perk) =>
        sum + Object.values(perk.bonus).reduce((n: number, points) => n + (points ?? 0), 0),
      0,
    )
    const drift = ((total - EXPECTED_TOTAL) / EXPECTED_TOTAL) * 100
    expect(
      Math.abs(drift),
      `pool total ${total} growth points vs ${EXPECTED_TOTAL} (${drift.toFixed(1)}%). `
        + 'Re-run career-distribution.test.ts and legacy.test.ts before changing this bound.',
    ).toBeLessThanOrEqual(TOLERANCE * 100)
  })
})
