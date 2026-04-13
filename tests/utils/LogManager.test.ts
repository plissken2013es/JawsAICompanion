import { describe, it, expect, beforeEach, vi } from 'vitest'
import LogManager from '~/utils/LogManager'

beforeEach(() => {
    (LogManager as any).instance = undefined
})

describe('LogManager.log — saving behaviour', () => {
    it('saves message to savedLogs when saveLogMsg is true', () => {
        const lm = LogManager.getInstance(false)
        lm.log('hello', true)
        expect(lm.savedLogs).toContain('hello')
    })

    it('does NOT save message when saveLogMsg is false', () => {
        const lm = LogManager.getInstance(false)
        lm.log('hello', false)
        expect(lm.savedLogs).not.toContain('hello')
    })

    it('does NOT save message when saveLogMsg is omitted', () => {
        const lm = LogManager.getInstance(false)
        lm.log('hello')
        expect(lm.savedLogs).toHaveLength(0)
    })

    it('accumulates multiple saved messages in order', () => {
        const lm = LogManager.getInstance(false)
        lm.log('first', true)
        lm.log('second', true)
        lm.log('third', true)
        expect(lm.savedLogs).toEqual(['first', 'second', 'third'])
    })
})

describe('LogManager.log — console behaviour', () => {
    it('calls console.log when logEnabled is true', () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
        const lm = LogManager.getInstance(true)
        lm.log('visible')
        expect(spy).toHaveBeenCalledWith('visible')
        spy.mockRestore()
    })

    it('does NOT call console.log when logEnabled is false', () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
        const lm = LogManager.getInstance(false)
        lm.log('silent')
        expect(spy).not.toHaveBeenCalled()
        spy.mockRestore()
    })

    it('saves message even when logEnabled is false', () => {
        const lm = LogManager.getInstance(false)
        lm.log('saved-anyway', true)
        expect(lm.savedLogs).toContain('saved-anyway')
    })
})

describe('LogManager.reset', () => {
    it('reset() with no args clears savedLogs', () => {
        const lm = LogManager.getInstance(false)
        lm.log('a', true)
        lm.log('b', true)
        lm.reset()
        expect(lm.savedLogs).toHaveLength(0)
    })

    it('reset(array) replaces savedLogs with the provided array', () => {
        const lm = LogManager.getInstance(false)
        lm.log('old', true)
        lm.reset(['pre-seeded'])
        expect(lm.savedLogs).toEqual(['pre-seeded'])
    })
})
