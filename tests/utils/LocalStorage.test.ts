import { describe, it, expect, beforeEach } from 'vitest'
import LocalStorage from '~/utils/LocalStorage'

beforeEach(() => {
    (LocalStorage as any).instance = undefined
    window.localStorage.clear()
})

describe('LocalStorage.saveGameData / loadGameData', () => {
    it('round-trips a simple object', () => {
        const ls = LocalStorage.getInstance()
        ls.saveGameData({ key: 'value' })
        expect(ls.loadGameData()).toEqual({ key: 'value' })
    })

    it('round-trips multiple fields', () => {
        const ls = LocalStorage.getInstance()
        ls.saveGameData({ jaws: 'data', language: 'ES' })
        const loaded = ls.loadGameData()
        expect(loaded.jaws).toBe('data')
        expect(loaded.language).toBe('ES')
    })

    it('loadGameData returns undefined when storage is empty', () => {
        const ls = LocalStorage.getInstance()
        expect(ls.loadGameData()).toBeUndefined()
    })

    it('loadGameData returns undefined for an empty saved object (known behaviour)', () => {
        // The implementation has: for (const prop in parsedGameData) { return parsedGameData }
        // An empty object never enters the loop, so the function returns undefined
        const ls = LocalStorage.getInstance()
        ls.saveGameData({})
        expect(ls.loadGameData()).toBeUndefined()
    })
})

describe('LocalStorage.reset', () => {
    it('reset clears saved data', () => {
        const ls = LocalStorage.getInstance()
        ls.saveGameData({ test: '1' })
        ls.reset()
        expect(ls.loadGameData()).toBeUndefined()
    })
})

describe('LocalStorage.removeItem', () => {
    it('removes the specified key, preserving others', () => {
        const ls = LocalStorage.getInstance()
        ls.saveGameData({ keep: 'yes', remove: 'no' })
        ls.removeItem('remove')
        const loaded = ls.loadGameData()
        expect(loaded.keep).toBe('yes')
        expect(loaded.remove).toBeUndefined()
    })

    it('does not throw when removing a key that does not exist', () => {
        const ls = LocalStorage.getInstance()
        ls.saveGameData({ other: 'x' })
        expect(() => ls.removeItem('nonexistent')).not.toThrow()
        expect(ls.loadGameData().other).toBe('x')
    })

    it('does not throw when storage is empty', () => {
        const ls = LocalStorage.getInstance()
        expect(() => ls.removeItem('anything')).not.toThrow()
    })
})
