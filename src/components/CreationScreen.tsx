'use client'

import { useState } from 'react'
import { useT } from '@/i18n/LocaleProvider'
import { COUNTRIES } from '@/data/countries'
import { PLAY_STYLES } from '@/data/styles'
import type { CreationChoices } from '@/game/create'
import type { Hand, PlayStyleId, Position } from '@/game/types'
import { POSITION_KEY } from './display'

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']

interface Props {
  onStart: (choices: CreationChoices) => void
  /** Daily mode fixes the archetype; only the name is editable. */
  locked?: CreationChoices
}

export function CreationScreen({ onStart, locked }: Props) {
  const { t, L } = useT()

  const [name, setName] = useState(locked?.name ?? '')
  const [countryCode, setCountryCode] = useState(locked?.countryCode ?? 'AR')
  const [number, setNumber] = useState(locked?.number ?? 10)
  const [position, setPosition] = useState<Position>(locked?.position ?? 'SG')
  const [hand, setHand] = useState<Hand>(locked?.hand ?? 'right')
  const [styleId, setStyleId] = useState<PlayStyleId>(locked?.styleId ?? 'scorer')

  const isLocked = Boolean(locked)

  return (
    <form
      className="space-y-5 animate-fade-up"
      onSubmit={(e) => {
        e.preventDefault()
        onStart({ name, countryCode, number, position, hand, styleId })
      }}
    >
      <div>
        <h2 className="text-lg font-bold text-slate-50">{t('createTitle')}</h2>
        <p className="text-sm text-slate-400">{t('createSubtitle')}</p>
      </div>

      <div className="panel space-y-4 p-4">
        <label className="block">
          <span className="label">{t('fieldName')}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('fieldNamePlaceholder')}
            maxLength={28}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-court-800 px-3 py-2.5 text-slate-100
                       outline-none placeholder:text-slate-500 focus:border-flame-500"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">{t('fieldCountry')}</span>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={isLocked}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-court-800 px-3 py-2.5
                         text-slate-100 outline-none focus:border-flame-500 disabled:opacity-60"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {L(country.name)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="label">{t('fieldNumber')}</span>
            <input
              type="number"
              min={0}
              max={99}
              value={number}
              disabled={isLocked}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10)
                setNumber(Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(99, parsed)))
              }}
              className="tnum mt-1.5 w-full rounded-xl border border-white/10 bg-court-800 px-3 py-2.5
                         text-slate-100 outline-none focus:border-flame-500 disabled:opacity-60"
            />
          </label>
        </div>

      </div>

      <fieldset className="panel p-4" disabled={isLocked}>
        <legend className="label px-1">{t('fieldPosition')}</legend>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setPosition(pos)}
              aria-pressed={position === pos}
              className={`rounded-xl border px-1 py-2.5 text-center transition ${
                position === pos
                  ? 'border-flame-500 bg-flame-500/15 text-flame-400'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <span className="block text-sm font-black">{pos}</span>
              <span className="mt-0.5 block text-[10px] leading-tight">{t(POSITION_KEY[pos])}</span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <span className="label">{t('fieldHand')}</span>
          <div className="mt-1.5 flex gap-2">
            {(['right', 'left'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setHand(option)}
                aria-pressed={hand === option}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  hand === option
                    ? 'border-flame-500 bg-flame-500/15 text-flame-400'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {option === 'right' ? t('handRight') : t('handLeft')}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="panel p-4" disabled={isLocked}>
        <legend className="label px-1">{t('fieldStyle')}</legend>
        <p className="mt-1 text-xs text-slate-500">{t('fieldStyleHelp')}</p>
        <div className="mt-3 space-y-2">
          {PLAY_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => setStyleId(style.id)}
              aria-pressed={styleId === style.id}
              className={`w-full rounded-xl border p-3 text-left transition ${
                styleId === style.id
                  ? 'border-flame-500 bg-flame-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span
                className={`block text-sm font-bold ${
                  styleId === style.id ? 'text-flame-400' : 'text-slate-200'
                }`}
              >
                {L(style.name)}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-400">
                {L(style.tradeoff)}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="btn-primary w-full py-3.5 text-base">
        {t('startCareer')}
      </button>
    </form>
  )
}
