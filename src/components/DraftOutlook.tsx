'use client'

import { useT } from '@/i18n/LocaleProvider'
import type { GameState } from '@/game/types'
import { draftOutlook, type DraftOutlook as DraftOutlookData } from '@/game/draft'
import { getCountry } from '@/data/countries'
import { DRAFT_TIER_KEY } from './display'

/**
 * Single call site for `draftOutlook`, so the header strip and this panel
 * always read the exact same projection off the exact same inputs — never a
 * second copy of the country/seasonsPlayed plumbing that could drift.
 */
export function getDraftOutlook(state: GameState): DraftOutlookData | null {
  return draftOutlook(state.player, getCountry(state.player.countryCode), state.seasons.length)
}

/**
 * Draft night is still ahead, and the panel says so plainly: when it lands,
 * roughly where scouts have the player now, what's holding the number back,
 * and what actually moves it. It sits below the perk choice and above the
 * attribute panel, because this is where the player is making decisions that
 * bear on it.
 */
export function DraftOutlookPanel({ state }: { state: GameState }) {
  const { t } = useT()
  const outlook = getDraftOutlook(state)
  if (!outlook) return null

  const range = `#${outlook.projectedRange[0]}–#${outlook.projectedRange[1]}`
  const tierLabel = t(DRAFT_TIER_KEY[outlook.tier])
  // eligibleNow already implies "this season" — seasonsUntilForced only
  // reaches 0 in lockstep with it, but checking both keeps this panel
  // correct on its own terms rather than leaning on that coincidence.
  const soon = outlook.eligibleNow || outlook.seasonsUntilForced === 0

  return (
    <div className="panel p-4">
      <span className="label">{t('draftOutlookTitle')}</span>

      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        {soon ? t('draftOutlookTimingSoon') : t('draftOutlookTiming', { n: outlook.seasonsUntilForced })}
        {outlook.couldDeclareEarly && ` ${t('draftOutlookEarlyHint')}`}
      </p>

      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        {t('draftOutlookRange', { tier: tierLabel, range })}
      </p>

      {outlook.limiter && (
        <p className="mt-1.5 text-xs leading-relaxed text-amber-300/90">
          {t(outlook.limiter === 'exposure' ? 'draftOutlookLimiterExposure' : 'draftOutlookLimiterAbility')}
        </p>
      )}

      <p className="mt-1.5 text-xs leading-relaxed text-emerald-300/90">{t('draftOutlookBoost')}</p>
    </div>
  )
}
