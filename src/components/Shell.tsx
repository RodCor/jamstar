'use client'

import { useT } from '@/i18n/LocaleProvider'
import { LanguageToggle } from './LanguageToggle'

export function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useT()

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-16 pt-5 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-50 sm:text-2xl">
            🏀 {t('appName')}
          </h1>
          <p className="text-xs text-slate-400 sm:text-sm">{t('tagline')}</p>
        </div>
        <LanguageToggle />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
