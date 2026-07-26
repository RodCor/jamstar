/**
 * Drawing and applying perks.
 *
 * Three are offered each preseason and one is taken, so the build diverges by
 * what you gave up as much as by what you picked. A perk already owned never
 * comes back around.
 */

import type { Player } from './types'
import { Rng } from './rng'
import { PERKS, aggregateEffects, getPerk, type Perk } from '@/data/perks'
import { spendGrowthPoint } from './progression'

/** How many are put in front of the player each preseason. */
export const PERK_CHOICES = 3

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
 * Weighted toward what the player's position actually uses, so a centre is not
 * repeatedly offered ball-handling upgrades — but not exclusively, because an
 * off-profile perk is one of the more interesting things you can be offered.
 */
export function drawPerkChoices(player: Player, rng: Rng): string[] {
  const pool = eligiblePerks(player)
  if (pool.length === 0) return []

  const picked: Perk[] = []
  const remaining = [...pool]

  while (picked.length < PERK_CHOICES && remaining.length > 0) {
    const choice = rng.weighted(remaining, (perk) => perk.weight)
    picked.push(choice)
    remaining.splice(remaining.indexOf(choice), 1)
  }

  return picked.map((perk) => perk.id)
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
  // Perks spend exactly what they grant.
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
