'use client'

import { useT } from '@/i18n/LocaleProvider'
import type { ArchivedCareer, GameMode } from '@/game/types'
import { flagFor } from '@/data/countries'

interface Props {
  onPick: (mode: GameMode) => void
  onResume: (() => void) | null
  dailyPlayed: boolean
  archive: ArchivedCareer[]
  onClearArchive: () => void
}

export function ModeSelect({ onPick, onResume, dailyPlayed, archive, onClearArchive }: Props) {
  const { t, locale } = useT()

  return (
    <div className="space-y-4 animate-fade-up">
      {onResume && (
        <button type="button" onClick={onResume} className="btn-primary w-full py-3.5 text-base">
          ▶ {t('resumeRun')}
        </button>
      )}

      <button
        type="button"
        onClick={() => onPick('career')}
        className="w-full rounded-2xl border border-white/10 bg-court-900/70 p-4 text-left transition
                   hover:border-flame-500 hover:bg-flame-500/5 active:scale-[0.99]"
      >
        <span className="block text-lg font-black text-slate-50">🏀 {t('modeCareer')}</span>
        <span className="mt-1 block text-sm leading-snug text-slate-400">{t('modeCareerDesc')}</span>
      </button>

      <button
        type="button"
        onClick={() => onPick('daily')}
        className="w-full rounded-2xl border border-white/10 bg-court-900/70 p-4 text-left transition
                   hover:border-flame-500 hover:bg-flame-500/5 active:scale-[0.99]"
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-black text-slate-50">📅 {t('modeDaily')}</span>
          {dailyPlayed && <span className="chip shrink-0">{t('modeDailyDone')}</span>}
        </span>
        <span className="mt-1 block text-sm leading-snug text-slate-400">{t('modeDailyDesc')}</span>
      </button>

      <div className="panel p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-bold text-slate-100">{t('archiveTitle')}</h2>
          {archive.length > 0 && (
            <button
              type="button"
              onClick={onClearArchive}
              className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-300"
            >
              {t('archiveClear')}
            </button>
          )}
        </div>

        {archive.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t('archiveEmpty')}</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {archive.map((entry) => (
              <li
                key={`${entry.seed}-${entry.mode}-${entry.completedAt}`}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2"
              >
                <span className="shrink-0 text-base">{flagFor(entry.countryCode)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-200">
                    {entry.playerName || '—'}{' '}
                    <span className="font-normal text-slate-500">
                      #{entry.number} {entry.position}
                    </span>
                  </p>
                  <p className="tnum truncate text-xs text-slate-500">
                    {entry.totals.ppg}/{entry.totals.rpg}/{entry.totals.apg} ·{' '}
                    {entry.totals.seasons} · 🏆{entry.totals.rings} · 👑{entry.totals.mvps}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tnum text-sm font-black text-flame-400">{entry.legacy.score}</p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    {entry.legacy.title[locale]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
