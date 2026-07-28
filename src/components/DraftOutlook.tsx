'use client'

import { useT } from '@/i18n/LocaleProvider'
import type { GameState } from '@/game/types'
import { draftOutlook, type DraftOutlook as DraftOutlookData } from '@/game/draft'
import { getCountry } from '@/data/countries'
import { DRAFT_LIKELIHOOD_KEY, DRAFT_TIER_KEY } from './display'

/**
 * Single call site for `draftOutlook`, so the header strip and this panel
 * always read the exact same projection off the exact same inputs, never a
 * second copy of the country/seasonsPlayed plumbing that could drift.
 */
export function getDraftOutlook(state: GameState): DraftOutlookData | null {
  return draftOutlook(state.player, getCountry(state.player.countryCode), state.seasons.length)
}

/**
 * Draft night is still ahead, and the panel says so plainly: when it lands,
 * roughly where scouts have the player now, what's holding the number back,
 * and what moves it. It sits below the perk choice and above the attribute
 * panel, because this is where the player is making decisions that bear on it.
 */
export function DraftOutlookPanel({ state }: { state: GameState }) {
  const { t } = useT()
  const outlook = getDraftOutlook(state)
  if (!outlook) return null

  // Soft start: below the threshold, every fresh build reads almost
  // identically, so the numbers below aren't yet about *this* player.
  // Name the draft, place it a while off, stop there.
  if (!outlook.detailed) {
    return (
      <div className="panel p-4">
        <span className="label">{t('draftOutlookTitle')}</span>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{t('draftOutlookFarOff')}</p>
      </div>
    )
  }

  const range = `#${outlook.projectedRange[0]}–#${outlook.projectedRange[1]}`
  const tierLabel = t(DRAFT_TIER_KEY[outlook.tier])
  // eligibleNow already implies "this season". seasonsUntilForced only reaches
  // 0 in lockstep with it, but checking both keeps this panel correct on its
  // own terms rather than leaning on that coincidence.
  const soon = outlook.eligibleNow || outlook.seasonsUntilForced === 0

  return (
    <div className="panel p-4">
      <span className="label">{t('draftOutlookTitle')}</span>

      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        {soon ? t('draftOutlookTimingSoon') : t('draftOutlookTiming', { n: outlook.seasonsUntilForced })}
        {outlook.couldDeclareEarly && ` ${t('draftOutlookEarlyHint')}`}
      </p>

      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        {/* 'fringe' is an odds word, not a placement. Forcing it into the
            same "scouts have you around {tier}" frame as lottery/first_round/
            second_round produces broken grammar ("around on the fringe",
            "en al margen"). It gets its own sentence that keeps the range
            (still true and worth saying, even when being picked at all is
            the long shot) without the placement claim. */}
        {outlook.tier === 'fringe'
          ? t('draftOutlookRangeFringe', { range })
          : t('draftOutlookRange', { tier: tierLabel, range })}
        {/* The range is where you'd land *if* picked, not a promise you will
            be. Stated only when the odds are not already high, so a real
            lottery/first-round lock doesn't get second-guessed for no reason. */}
        {outlook.likelihood !== 'strong' &&
          ` ${t('draftOutlookLikelihoodNote', { likelihood: t(DRAFT_LIKELIHOOD_KEY[outlook.likelihood]) })}`}
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
