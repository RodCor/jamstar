'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Locale, Localized } from '@/game/types'
import { DICTIONARIES, type Dictionary } from './dictionary'

const STORAGE_KEY = 'la-naranja:locale'
// One-time migration from the game's previous name, Hoop Glory. Delete this
// once players have had time to reopen the game after the rename ships.
const OLD_STORAGE_KEY = 'hoop-glory:locale'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Translate a UI chrome key, with optional `{placeholder}` substitution. */
  t: (key: keyof Dictionary, vars?: Record<string, string | number>) => string
  /** Read the current language out of a bilingual content string. */
  L: (value: Localized | null | undefined) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

/** Spanish is the default: this genre's audience is Spanish-speaking first. */
const DEFAULT_LOCALE: Locale = 'es'

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Read the stored preference after mount so the server and first client
  // render agree, then correct <html lang> to match.
  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === null) {
      try {
        const old = window.localStorage.getItem(OLD_STORAGE_KEY)
        if (old !== null) {
          window.localStorage.setItem(STORAGE_KEY, old)
          window.localStorage.removeItem(OLD_STORAGE_KEY)
        }
      } catch {
        // Storage disabled — nothing to migrate, nothing lost that wasn't
        // already inaccessible.
      }
    }
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'es' || stored === 'en') {
      setLocaleState(stored)
      return
    }
    // No stored preference: follow the browser, defaulting to Spanish.
    const browser = window.navigator.language?.slice(0, 2).toLowerCase()
    if (browser === 'en') setLocaleState('en')
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private browsing with storage disabled — the toggle still works for
      // this session, it just will not be remembered.
    }
  }, [])

  const value = useMemo<LocaleContextValue>(() => {
    const dict: Dictionary = DICTIONARIES[locale]
    return {
      locale,
      setLocale,
      t: (key, vars) => {
        let out: string = dict[key] ?? String(key)
        if (vars) {
          for (const [name, replacement] of Object.entries(vars)) {
            out = out.replaceAll(`{${name}}`, String(replacement))
          }
        }
        return out
      },
      L: (localized) => (localized ? localized[locale] : ''),
    }
  }, [locale, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useT(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useT must be used inside a LocaleProvider')
  return ctx
}
