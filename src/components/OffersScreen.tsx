'use client'

import { useT } from '@/i18n/LocaleProvider'
import type { GameState } from '@/game/types'
import { getTeam } from '@/data/teams'
import { getLeague } from '@/data/leagues'
import { ROLE_KEY, formatMoney } from './display'
import { TeamCrest } from './TeamCrest'

interface Props {
  state: GameState
  onAccept: (index: number) => void
}

export function OffersScreen({ state, onAccept }: Props) {
  const { t, L, locale } = useT()
  const offers = state.pendingOffers ?? []

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="panel p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-50">{t('offersTitle')}</h2>
          <span className="tnum text-sm text-slate-400">{state.year}</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">{t('offersSubtitle')}</p>
      </div>

      <div className="space-y-2">
        {offers.map((offer, index) => {
          const team = getTeam(offer.teamId)
          const league = getLeague(offer.leagueId)
          const isTop = league.tier === 1

          return (
            <button
              key={`${offer.teamId}-${index}`}
              type="button"
              onClick={() => onAccept(index)}
              className={`w-full rounded-2xl border p-3.5 text-left transition active:scale-[0.99]
                ${
                  isTop
                    ? 'border-flame-500/50 bg-flame-500/5 hover:border-flame-400 hover:bg-flame-500/10'
                    : 'border-white/15 bg-white/5 hover:border-flame-500 hover:bg-flame-500/10'
                }`}
            >
              <div className="flex items-center gap-3">
                <TeamCrest teamId={team.id} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-100">{L(team.name)}</p>
                  <p className="truncate text-xs text-slate-400">{L(league.name)}</p>
                </div>
                {offer.isCurrentClub && (
                  <span className="chip shrink-0 border-flame-400/30 text-flame-400">
                    {t('offerRenewal')}
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="chip">
                  {t('offerRole')}:{' '}
                  <span className="font-bold text-slate-100">{t(ROLE_KEY[offer.role])}</span>
                </span>
                <span className="chip tnum">
                  {t('offerSalary')}:{' '}
                  <span className="font-bold text-slate-100">
                    {formatMoney(offer.salary, locale)}
                  </span>
                </span>
                <span className="chip tnum">
                  {t('offerYears', { n: offer.years })}
                </span>
              </div>

              <p className="mt-2 text-xs italic leading-snug text-slate-400">“{L(offer.pitch)}”</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
