'use client'

import { useT } from '@/i18n/LocaleProvider'
import type { AwardId } from '@/game/types'
import { AWARD_INFO } from '@/game/awards'
import { LogoBadge } from './LogoBadge'

/**
 * Winning something should feel like winning something.
 *
 * Awards used to appear as a row of small grey chips indistinguishable from the
 * team record — an MVP season read exactly like a losing one. The heaviest
 * trophy gets the headline treatment; the rest sit under it.
 */
export function AwardReveal({
  awards,
  /** The cup just won, when there is one — so the trophy shows its own badge. */
  cupId = null,
}: {
  awards: AwardId[]
  cupId?: string | null
}) {
  const { t, locale } = useT()
  if (awards.length === 0) return null

  const sorted = [...awards].sort((a, b) => AWARD_INFO[b].weight - AWARD_INFO[a].weight)
  const [headline, ...rest] = sorted
  const info = AWARD_INFO[headline]
  const major = info.weight >= 45
  const badge = headline === 'cup_champion' && cupId ? cupId : null

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
            <LogoBadge id={badge} label={info[locale]} size={major ? 52 : 40} />
          </div>
        ) : (
          <p className={major ? 'text-4xl' : 'text-2xl'}>{info.icon}</p>
        )}
        <p
          className={`mt-1.5 font-black leading-tight ${
            major ? 'text-xl text-flame-400' : 'text-base text-slate-100'
          }`}
        >
          {info[locale]}
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
