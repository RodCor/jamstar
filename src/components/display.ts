/** Shared formatting and label lookup used across the UI. */

import type { Dictionary } from '@/i18n/dictionary'
import type { AttributeKey, Locale, PlayerRole, PlayoffResult, Position } from '@/game/types'
import type { DraftLikelihood, DraftTier } from '@/game/draft'

export const POSITION_KEY: Record<Position, keyof Dictionary> = {
  PG: 'posPG',
  SG: 'posSG',
  SF: 'posSF',
  PF: 'posPF',
  C: 'posC',
}

export const ROLE_KEY: Record<PlayerRole, keyof Dictionary> = {
  star: 'roleStar',
  starter: 'roleStarter',
  rotation: 'roleRotation',
  bench: 'roleBench',
  prospect: 'roleProspect',
  injured: 'roleInjured',
}

export const PLAYOFF_KEY: Record<PlayoffResult, keyof Dictionary> = {
  champion: 'poChampion',
  finals: 'poFinals',
  conference_finals: 'poConferenceFinals',
  semifinals: 'poSemifinals',
  first_round: 'poFirstRound',
  missed: 'poMissed',
  none: 'poNone',
}

export const ATTRIBUTE_KEY: Record<AttributeKey, keyof Dictionary> = {
  scoring: 'attrScoring',
  playmaking: 'attrPlaymaking',
  defense: 'attrDefense',
  physical: 'attrPhysical',
  mental: 'attrMental',
}

/** Scouting-language label per tier — shared by the header strip and the
 *  preseason panel so the two surfaces never describe the same range differently. */
export const DRAFT_TIER_KEY: Record<DraftTier, keyof Dictionary> = {
  lottery: 'draftTierLottery',
  first_round: 'draftTierFirstRound',
  second_round: 'draftTierSecondRound',
  fringe: 'draftTierFringe',
}

/** Short label for how confident a tier's placement is — shown alongside
 *  `DRAFT_TIER_KEY`, never instead of it, on both the header strip and the
 *  preseason panel. `tier` says where; this says how sure. */
export const DRAFT_LIKELIHOOD_KEY: Record<DraftLikelihood, keyof Dictionary> = {
  strong: 'draftLikelihoodStrong',
  likely: 'draftLikelihoodLikely',
  uncertain: 'draftLikelihoodUncertain',
  longshot: 'draftLikelihoodLongshot',
  unlikely: 'draftLikelihoodUnlikely',
  remote: 'draftLikelihoodRemote',
}

export const ATTRIBUTE_HELP_KEY: Record<AttributeKey, keyof Dictionary> = {
  scoring: 'attrScoringHelp',
  playmaking: 'attrPlaymakingHelp',
  defense: 'attrDefenseHelp',
  physical: 'attrPhysicalHelp',
  mental: 'attrMentalHelp',
}

/** Money, compact and readable in both locales. */
export function formatMoney(amount: number, locale: Locale): string {
  if (amount === 0) return '—'
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000
    const value = millions >= 100 ? millions.toFixed(0) : millions.toFixed(1)
    return locale === 'es' ? `${sign}${value} M US$` : `${sign}$${value}M`
  }
  const thousands = Math.round(abs / 1000)
  return locale === 'es' ? `${sign}${thousands} mil US$` : `${sign}$${thousands}k`
}

/** A percentage stored as 0-1, rendered as `.482` — how box scores show it. */
export function formatPct(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return value.toFixed(3).replace(/^0/, '')
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-AR' : 'en-US').format(Math.round(value))
}

/** Relative luminance of a `#rrggbb` colour, 0 (black) to 1 (white). */
function luminance(hex: string): number {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 0.5
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(clean.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Pick whichever of a team's two colours stays readable on the dark UI.
 *
 * Team palettes are chosen for jerseys, not for dark backgrounds — Maccabi's
 * navy on their own yellow is invisible here. Falling back to a light neutral
 * when both colours are dark keeps every club name legible.
 */
export function teamTextColor(colors: [string, string]): string {
  const candidates = colors.filter((c) => luminance(c) > 0.42)
  if (candidates.length === 0) return '#e2e8f0'
  return candidates.reduce((best, c) => (luminance(c) > luminance(best) ? c : best))
}

/** Tailwind classes for an event outcome's tone. */
export const TONE_CLASS: Record<string, string> = {
  good: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  bad: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  epic: 'border-flame-400/40 bg-flame-400/10 text-flame-400',
  neutral: 'border-white/15 bg-white/5 text-slate-300',
}
