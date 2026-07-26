'use client'

import { useT } from '@/i18n/LocaleProvider'

export function LanguageToggle() {
  const { locale, setLocale, t } = useT()

  return (
    <div
      className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1"
      role="group"
      aria-label={t('language')}
    >
      {(['es', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase transition ${
            locale === code ? 'bg-flame-500 text-court-950' : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  )
}
