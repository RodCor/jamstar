'use client'

import { useT } from '@/i18n/LocaleProvider'
import type { GameState } from '@/game/types'
import { TONE_CLASS } from './display'

interface Props {
  state: GameState
  onChoose: (index: number) => void
  onContinue: () => void
}

export function EventScreen({ state, onChoose, onContinue }: Props) {
  const { t, L } = useT()
  const event = state.pendingEvent
  if (!event) return null

  const resolved = event.outcome !== null

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="panel overflow-hidden">
        <div className="border-b border-white/10 bg-flame-500/10 px-4 py-2">
          <span className="label text-flame-400">{t('eventDecision')}</span>
        </div>
        <div className="p-4">
          <h2 className="text-lg font-bold text-slate-50">{L(event.title)}</h2>
          <p className="mt-2 leading-relaxed text-slate-300">{L(event.body)}</p>
        </div>
      </div>

      {!resolved && (
        <div className="space-y-2">
          {event.choices.map((choice) => (
            <button
              key={choice.index}
              type="button"
              onClick={() => onChoose(choice.index)}
              className="w-full rounded-xl border border-white/15 bg-white/5 p-3.5 text-left text-sm
                         font-semibold leading-snug text-slate-100 transition hover:border-flame-500
                         hover:bg-flame-500/10 active:scale-[0.99]"
            >
              {L(choice.label)}
            </button>
          ))}
        </div>
      )}

      {resolved && event.outcome && (
        <div className="space-y-4 animate-fade-up">
          <div className={`rounded-2xl border p-4 ${TONE_CLASS[event.outcome.tone] ?? TONE_CLASS.neutral}`}>
            <span className="label opacity-80">{t('eventOutcome')}</span>
            <p className="mt-1.5 leading-relaxed">{L(event.outcome.text)}</p>
          </div>
          <button type="button" onClick={onContinue} className="btn-primary w-full py-3.5 text-base">
            {t('continue')}
          </button>
        </div>
      )}
    </div>
  )
}
