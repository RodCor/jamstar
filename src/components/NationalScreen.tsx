'use client'

import { useT } from '@/i18n/LocaleProvider'
import type { GameState } from '@/game/types'
import { getCountry } from '@/data/countries'
import { AWARD_INFO } from '@/game/awards'
import { MinigameScreen } from './MinigameScreen'

interface Props {
  state: GameState
  onFinishFinal: (successes: number) => void
  onContinue: () => void
}

export function NationalScreen({ state, onFinishFinal, onContinue }: Props) {
  const { t, L, locale } = useT()
  const tournament = state.pendingTournament
  if (!tournament) return null

  const country = getCountry(state.player.countryCode)

  // The final is still to be played. Hand over to the minigame.
  if (state.pendingMinigame) {
    return (
      <div className="space-y-4">
        <div className="panel p-4 text-center animate-fade-up">
          <span className="label text-flame-400">{L(tournament.name)}</span>
          <p className="mt-2 text-2xl">{country.flag}</p>
          <p className="mt-1 font-bold text-slate-100">{L(country.nationalTeam)}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{L(tournament.summary)}</p>
        </div>
        <MinigameScreen state={state} onFinish={onFinishFinal} />
      </div>
    )
  }

  const gold = tournament.awards.some((a) => a.endsWith('gold'))

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="panel overflow-hidden text-center">
        <div className="border-b border-white/10 bg-flame-500/10 px-4 py-2">
          <span className="label text-flame-400">{t('nationalSummer')}</span>
        </div>
        <div
          className={`px-4 py-6 ${
            gold ? 'bg-gradient-to-b from-flame-500/25 to-transparent' : ''
          }`}
        >
          <p className="text-4xl">{country.flag}</p>
          <p className="mt-2 text-lg font-black text-slate-50">{L(tournament.name)}</p>
          <p className="text-xs text-slate-400">{L(country.nationalTeam)}</p>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            {L(tournament.summary)}
          </p>

          {tournament.awards.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {tournament.awards.map((award) => (
                <span
                  key={award}
                  className="rounded-lg border border-flame-400/30 bg-flame-400/10 px-2.5 py-1
                             text-sm font-bold text-flame-400"
                >
                  {AWARD_INFO[award].icon} {AWARD_INFO[award][locale]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button type="button" onClick={onContinue} className="btn-primary w-full py-3.5 text-base">
        {t('continue')}
      </button>
    </div>
  )
}
