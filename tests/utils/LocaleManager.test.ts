import { describe, it, expect } from 'vitest'
import LocaleManager from '~/utils/LocaleManager'
import Languages from '~/consts/Languages'

describe('LocaleManager.getLocale — English (key passthrough)', () => {
    const en = new LocaleManager(Languages.English)

    it('returns the key unchanged when English is selected', () => {
        expect(en.getLocale('End Turn')).toBe('End Turn')
    })

    it('returns an unknown key unchanged', () => {
        expect(en.getLocale('this_key_does_not_exist')).toBe('this_key_does_not_exist')
    })

    it('returns an empty string unchanged', () => {
        expect(en.getLocale('')).toBe('')
    })

    it('returns array items unchanged for English', () => {
        expect(en.getLocale(['N', 'S'])).toEqual(['N', 'S'])
    })
})

describe('LocaleManager.getLocale — Spanish', () => {
    const es = new LocaleManager(Languages.Spanish)

    it('translates "End Turn" to Spanish', () => {
        expect(es.getLocale('End Turn')).toBe('Fin Turno')
    })

    it('translates "Yes" to Spanish', () => {
        expect(es.getLocale('Yes')).toBe('Sí')
    })

    it('"W" translates to "O" in Spanish (intentional divergence)', () => {
        expect(es.getLocale('W')).toBe('O')
    })

    it('"N" stays "N" in Spanish', () => {
        expect(es.getLocale('N')).toBe('N')
    })

    it('unknown key passes through in Spanish', () => {
        expect(es.getLocale('no_such_key')).toBe('no_such_key')
    })
})

describe('LocaleManager.getLocale — German', () => {
    const de = new LocaleManager(Languages.German)

    it('translates "End Turn" to German', () => {
        expect(de.getLocale('End Turn')).toBe('Zug beenden')
    })

    it('translates "No" to German', () => {
        expect(de.getLocale('No')).toBe('Nein')
    })
})

describe('LocaleManager.getLocale — Russian', () => {
    const ru = new LocaleManager(Languages.Russian)

    it('translates "End Turn" to Russian', () => {
        expect(ru.getLocale('End Turn')).toBe('Конец хода')
    })

    it('translates "N" to Cyrillic "С"', () => {
        expect(ru.getLocale('N')).toBe('С')
    })

    it('translates "S" to Cyrillic "Ю"', () => {
        expect(ru.getLocale('S')).toBe('Ю')
    })
})

describe('LocaleManager.getLocale — array input', () => {
    it('translates each element independently in Russian', () => {
        const ru = new LocaleManager(Languages.Russian)
        expect(ru.getLocale(['N', 'S'])).toEqual(['С', 'Ю'])
    })

    it('passes through unknown keys within an array', () => {
        const ru = new LocaleManager(Languages.Russian)
        expect(ru.getLocale(['N', 'unknown_key'])).toEqual(['С', 'unknown_key'])
    })

    it('returns empty array for empty array input', () => {
        const es = new LocaleManager(Languages.Spanish)
        expect(es.getLocale([])).toEqual([])
    })
})
