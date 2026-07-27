/**
 * Drawing and applying perks.
 *
 * Three are offered each preseason and one is taken, so the build diverges by
 * what you gave up as much as by what you picked. A perk already owned never
 * comes back around.
 */

import type { AwardId, Player, Season } from './types'
import { Rng, clamp } from './rng'
import { PERKS, aggregateEffects, getPerk, type Perk, type PerkRarity } from '@/data/perks'
import { spendGrowthPoint } from './progression'

/** How many are put in front of the player each preseason. */
export const PERK_CHOICES = 3

/** Weakest to strongest — also the order the draw falls back through. */
export const PERK_RARITIES: readonly PerkRarity[] = ['basic', 'silver', 'gold', 'legend', 'top1']

const MAJOR_AWARDS: readonly AwardId[] = ['mvp', 'dpoy', 'finals_mvp']
const TITLE_AWARDS: readonly AwardId[] = ['league_champion', 'cup_champion']

/**
 * How good last season was, 0..1. Feeds the rarity roll below: a career year
 * earns a shot at the rare tiers, a rookie with no season yet earns nothing.
 */
export function standingFor(lastSeason: Season | null): number {
  if (!lastSeason) return 0
  const hasMajorAward = lastSeason.awards.some((award) => MAJOR_AWARDS.includes(award))
  const wonTitle = lastSeason.awards.some((award) => TITLE_AWARDS.includes(award))
  const madeAllStar = lastSeason.awards.includes('all_star')
  return clamp(
    (lastSeason.rating - 50) / 40
      + (hasMajorAward ? 0.15 : 0)
      + (wonTitle ? 0.15 : 0)
      + (madeAllStar ? 0.05 : 0),
    0,
    1,
  )
}

/** The odds table's two endpoints — standing 0 and standing 1 — each summing to 1. */
const ODDS_AT_MIN: Record<PerkRarity, number> = {
  basic: 0.45, silver: 0.38, gold: 0.15, legend: 0.02, top1: 0,
}
const ODDS_AT_MAX: Record<PerkRarity, number> = {
  basic: 0.05, silver: 0.2, gold: 0.4, legend: 0.27, top1: 0.08,
}

/**
 * The rarity distribution to roll a preseason's three slots against.
 *
 * Pure — no `Rng` involved — so a replayed seed always sees the same odds;
 * only the roll made against them (in `drawPerkChoices`) consumes randomness.
 */
export function rarityOdds(standing: number): Record<PerkRarity, number> {
  const s = clamp(standing, 0, 1)
  const odds = {} as Record<PerkRarity, number>
  for (const rarity of PERK_RARITIES) {
    odds[rarity] = ODDS_AT_MIN[rarity] + (ODDS_AT_MAX[rarity] - ODDS_AT_MIN[rarity]) * s
  }
  // Both endpoints already sum to 1 and interpolation preserves that, but
  // renormalise anyway so float dust can never leave the total off by an epsilon.
  const total = PERK_RARITIES.reduce((sum, rarity) => sum + odds[rarity], 0)
  for (const rarity of PERK_RARITIES) odds[rarity] /= total
  return odds
}

/** Perks this player could be offered right now. */
function eligiblePerks(player: Player): Perk[] {
  const owned = new Set(player.perks)
  return PERKS.filter((perk) => {
    if (owned.has(perk.id)) return false
    if (perk.minAge !== undefined && player.age < perk.minAge) return false
    if (perk.maxAge !== undefined && player.age > perk.maxAge) return false
    if (perk.positions && !perk.positions.includes(player.position)) return false
    return true
  })
}

/**
 * Draw this preseason's options.
 *
 * Two-stage: roll a rarity per slot from `rarityOdds(standingFor(lastSeason))`,
 * then fill it from the eligible pool, tie-broken by the existing `weight`
 * field. Weighted toward what the player's position actually uses, so a centre
 * is not repeatedly offered ball-handling upgrades — but not exclusively,
 * because an off-profile perk is one of the more interesting things you can
 * be offered.
 */
export function drawPerkChoices(player: Player, rng: Rng, lastSeason: Season | null): string[] {
  const pool = eligiblePerks(player)
  if (pool.length === 0) return []

  const odds = rarityOdds(standingFor(lastSeason))
  const picked: Perk[] = []
  const remaining = [...pool]

  while (picked.length < PERK_CHOICES && remaining.length > 0) {
    const rolled = rng.weighted(PERK_RARITIES, (rarity) => odds[rarity])
    const choice = pickAtOrBelow(remaining, rolled, rng)
    picked.push(choice)
    remaining.splice(remaining.indexOf(choice), 1)
  }

  return picked.map((perk) => perk.id)
}

/**
 * An eligible perk at this rarity, or the next tier down if none remain.
 *
 * Only ever steps down, never up: a legend-tier drought must not turn into a
 * back door for legends themselves, or a player who cleared out every Gold
 * would start getting Legends handed to them automatically. If even `basic`
 * comes up dry, any eligible perk beats offering fewer than three.
 */
function pickAtOrBelow(remaining: Perk[], rarity: PerkRarity, rng: Rng): Perk {
  for (let tier = PERK_RARITIES.indexOf(rarity); tier >= 0; tier--) {
    const atTier = remaining.filter((perk) => perk.rarity === PERK_RARITIES[tier])
    if (atTier.length > 0) return rng.weighted(atTier, (perk) => perk.weight)
  }
  return rng.weighted(remaining, (perk) => perk.weight)
}

/**
 * Take a perk: record it and spend its growth points.
 *
 * Bonuses go through `spendGrowthPoint` rather than being added raw, so the
 * same diminishing returns apply and no perk can push an already-elite
 * attribute past what a career's worth of work would.
 */
export function takePerk(player: Player, perkId: string): boolean {
  if (!player.perkChoices.includes(perkId)) return false
  if (player.perks.includes(perkId)) return false

  const perk = getPerk(perkId)
  player.perks.push(perkId)
  player.perkChoices = []

  for (const [key, points] of Object.entries(perk.bonus)) {
    for (let i = 0; i < (points ?? 0); i++) {
      // Growth points are the currency; grant what this perk is worth.
      player.growthPoints += 1
      spendGrowthPoint(player, key as keyof typeof perk.bonus)
    }
  }
  // Perks spend exactly what they grant; reset so nothing can leak between
  // calls if a bonus ever failed to fully spend (e.g. every relevant
  // attribute already maxed).
  player.growthPoints = 0
  return true
}

/** Take one for a player who skipped the screen, so nobody stalls by clicking past. */
export function autoTakePerk(player: Player, rng: Rng): void {
  if (player.perkChoices.length === 0) return
  takePerk(player, rng.pick(player.perkChoices))
}

/** Everything the player's perks currently do, merged. */
export function effectsFor(player: Player) {
  return aggregateEffects(player.perks)
}
