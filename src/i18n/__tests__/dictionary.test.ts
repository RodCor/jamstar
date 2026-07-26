import { describe, expect, it } from 'vitest'
import { en, es } from '../dictionary'

/**
 * A missing translation key is the failure mode that rots silently: the UI
 * falls back to rendering the raw key and nobody notices until a user does.
 */
describe('dictionary', () => {
  const esKeys = Object.keys(es).sort()
  const enKeys = Object.keys(en).sort()

  it('has exactly the same keys in both languages', () => {
    expect(enKeys).toEqual(esKeys)
  })

  it('has no empty strings', () => {
    for (const [key, value] of Object.entries(es)) {
      expect(value.trim().length, `es.${key} is empty`).toBeGreaterThan(0)
    }
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim().length, `en.${key} is empty`).toBeGreaterThan(0)
    }
  })

  it('keeps placeholders consistent between languages', () => {
    // If `es` says "{n} sin asignar", `en` must also carry an {n}, or the
    // substitution silently drops the number in one language.
    for (const key of esKeys) {
      const typed = key as keyof typeof es
      const esVars = [...es[typed].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
      const enVars = [...en[typed].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
      expect(enVars, `placeholder mismatch on "${key}"`).toEqual(esVars)
    }
  })

  it('actually translates prose rather than copying it', () => {
    // Proper nouns and abbreviations legitimately match; long prose should not.
    const identical = esKeys.filter((key) => {
      const typed = key as keyof typeof es
      return es[typed] === en[typed] && es[typed].length > 14
    })
    expect(identical).toEqual([])
  })
})
