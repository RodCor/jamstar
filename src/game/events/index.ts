/**
 * The deck: assembly, filtering and weighted draw.
 *
 * A card is eligible if the stage matches, its `requires` gate passes, and — for
 * `once` cards — it has not fired before in this career.
 */

import type { EventContext, GameEvent } from '../types'
import { YOUTH_EVENTS } from './youth'
import { PRO_EVENTS } from './pro'
import { INJURY_EVENTS } from './injury'
import { NATIONAL_EVENTS } from './national'
import { RIVAL_EVENTS } from './rival'
import { LIFE_EVENTS } from './life'
import { ORIGIN_EVENTS } from './origin'
import { DEVELOPMENT_EVENTS } from './development'

export const ALL_EVENTS: GameEvent[] = [
  ...YOUTH_EVENTS,
  ...DEVELOPMENT_EVENTS,
  ...PRO_EVENTS,
  ...INJURY_EVENTS,
  ...NATIONAL_EVENTS,
  ...RIVAL_EVENTS,
  ...LIFE_EVENTS,
  ...ORIGIN_EVENTS,
]

const EVENT_INDEX = new Map(ALL_EVENTS.map((e) => [e.id, e]))

export function findEvent(id: string): GameEvent | undefined {
  return EVENT_INDEX.get(id)
}

/** Chance that any event fires at all in a given season. */
const EVENT_CHANCE = 0.82

export function eligibleEvents(ctx: EventContext): GameEvent[] {
  const fired = new Set(ctx.player.firedEventIds)
  return ALL_EVENTS.filter((e) => {
    if (!e.stages.includes(ctx.player.stage)) return false
    if (e.once !== false && fired.has(e.id)) return false
    if (e.requires && !e.requires(ctx)) return false
    return true
  })
}

/**
 * Draw one event for this season, or null for a quiet year. Quiet years matter:
 * a decision every single season stops feeling like a decision.
 */
export function drawEvent(ctx: EventContext): GameEvent | null {
  if (!ctx.rng.chance(EVENT_CHANCE)) return null
  const pool = eligibleEvents(ctx)
  if (pool.length === 0) return null
  return ctx.rng.weighted(pool, (e) => e.weight)
}
