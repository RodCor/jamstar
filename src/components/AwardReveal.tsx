'use client'

import { useT } from '@/i18n/LocaleProvider'
import type { AwardId } from '@/game/types'
import { AWARD_INFO } from '@/game/awards'
import { cupLogoPathFor } from '@/data/logos'
import { CupCrest } from './CompetitionCrest'
import { trophyLabel, type Trophy } from '@/game/trophies'

/**
 * Winning something should feel like winning something.
 *
 * Awards used to appear as a row of small grey chips indistinguishable from the
 * team record — an MVP season read exactly like a losing one. The heaviest
 * trophy gets the headline treatment; the rest sit under it.
 */
export function AwardReveal({
  awards,
  /** Trophies this season produced, so a title is named after its competition. */
  trophies = [],
}: {
  awards: AwardId[]
  trophies?: Trophy[]
}) {
  const { t, locale } = useT()
  if (awards.length === 0) return null

  const sorted = [...awards].sort((a, b) => AWARD_INFO[b].weight - AWARD_INFO[a].weight)
  const [headline, ...rest] = sorted
  const info = AWARD_INFO[headline]
  const major = info.weight >= 45

  // A championship is named after what it won; every other award already is.
  const titled =
    headline === 'league_champion' || headline === 'cup_champion'
      ? trophies.find((tr) => tr.result === 'champion' &&
          (headline === 'cup_champion' ? tr.kind === 'cup' : tr.kind === 'league'))
      : undefined
  const heading = titled ? trophyLabel(titled)[locale] : info[locale]

  const cupTrophy = trophies.find((tr) => tr.kind === 'cup' && tr.result === 'champion')
  // Only when a real trophy badge exists. `CupCrest` would happily draw its
  // generated plate here, but as the hero of the reveal the emoji trophy beats
  // an abbreviation on a rectangle — the plate is for inline use beside a name.
  const badge =
    headline === 'cup_champion' && cupTrophy && cupLogoPathFor(cupTrophy.competitionId)
      ? cupTrophy.competitionId
      : null

  return (
    <div
      className={`animate-fade-up overflow-hidden rounded-2xl border text-center ${
        major
          ? 'border-flame-400/50 bg-gradient-to-b from-flame-500/25 to-flame-500/5'
          : 'border-white/15 bg-white/5'
      }`}
    >
      <div className="px-4 py-4">
        {/* The real trophy when we have its badge, the emoji stand-in otherwise. */}
        {badge ? (
          <div className="flex justify-center">
            <CupCrest cupId={badge} size={major ? 52 : 40} />
          </div>
        ) : (
          <p className={major ? 'text-4xl' : 'text-2xl'}>{info.icon}</p>
        )}
        <p
          className={`mt-1.5 font-black leading-tight ${
            major ? 'text-xl text-flame-400' : 'text-base text-slate-100'
          }`}
        >
          {heading}
        </p>
        {major && (
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-flame-400/70">
            {t('awardWon')}
          </p>
        )}

        {rest.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {rest.map((award, i) => (
              <span
                key={`${award}-${i}`}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px]
                           font-semibold text-slate-300"
              >
                {AWARD_INFO[award].icon} {AWARD_INFO[award][locale]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
