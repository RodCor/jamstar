/** Shared helpers for authoring event cards without repeating boilerplate. */

import type { EventContext, EventOutcome, GameEvent, InjuryRecord, Localized } from '../types'

/** A plain outcome with no dice involved. */
export function outcome(
  es: string,
  en: string,
  tone: EventOutcome['tone'],
  effects: Omit<EventOutcome, 'text' | 'tone'> = {},
): EventOutcome {
  return { text: { es, en }, tone, ...effects }
}

/** A coin-flip outcome, weighted by `odds`. The backbone of the risky choices. */
export function gamble(
  ctx: EventContext,
  odds: number,
  win: EventOutcome,
  lose: EventOutcome,
): EventOutcome {
  return ctx.rng.chance(odds) ? win : lose
}

export function loc(es: string, en: string): Localized {
  return { es, en }
}

/** Money formatted for event body text, in the reader's own idiom. */
export function money(amount: number): Localized {
  const millions = amount / 1_000_000
  if (millions >= 1) {
    const value = millions >= 10 ? millions.toFixed(0) : millions.toFixed(1)
    return { es: `${value} millones de dólares`, en: `$${value} million` }
  }
  const thousands = Math.round(amount / 1000)
  return { es: `${thousands} mil dólares`, en: `$${thousands}k` }
}

export function injury(
  id: string,
  es: string,
  en: string,
  severity: number,
  wearAdded: number,
  permanentDamage: InjuryRecord['permanentDamage'] = {},
): InjuryRecord {
  return { id, name: { es, en }, severity, wearAdded, permanentDamage }
}

/** Declare an event with sane defaults (fires once, ordinary weight). */
export function event(spec: GameEvent): GameEvent {
  return { once: true, ...spec }
}

/** Common gates, so cards read as intent rather than arithmetic. */
export const gate = {
  inLeagueTier: (max: number) => (ctx: EventContext) => ctx.league.tier <= max,
  minAge: (age: number) => (ctx: EventContext) => ctx.player.age >= age,
  maxAge: (age: number) => (ctx: EventContext) => ctx.player.age <= age,
  isPro: (ctx: EventContext) => ctx.league.id !== 'youth',
  hasPlayed: (seasons: number) => (ctx: EventContext) => ctx.seasonsPlayed >= seasons,
  minHype: (hype: number) => (ctx: EventContext) => ctx.player.hidden.hype >= hype,
  /**
   * Cards that only make sense if you grew up somewhere specific.
   *
   * Takes several codes because basketball cultures do not stop at borders:
   * the same street court exists either side of the Río de la Plata, and the
   * same academy pipeline runs through half of Europe. Listing them together
   * beats writing the same card twice with different flags on it.
   */
  fromCountry:
    (...codes: string[]) =>
    (ctx: EventContext) =>
      codes.includes(ctx.player.countryCode),
  all:
    (...gates: ((ctx: EventContext) => boolean)[]) =>
    (ctx: EventContext) =>
      gates.every((g) => g(ctx)),
}
