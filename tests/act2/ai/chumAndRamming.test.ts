import { describe, it, expect } from 'vitest'
import { respondChum } from '~/act2/core/ai/respondChum'
import { rammingOptions, decideRammingMove } from '~/act2/core/ai/rammingMove'
import { DEFAULT_PARAMS } from '~/act2/core/ai/params'
import { setOptions, sharkChoose } from '~/act2/core/round'
import type { GameState } from '~/act2/core/state'
import type { ResurfaceId } from '~/act2/core/types'
import { board, card, boat, water, Tweak } from '../helpers'

const p = DEFAULT_PARAMS

const chosen = (options: ResurfaceId[], choice: number, t: Tweak = {}): GameState => sharkChoose(setOptions(board(t), options), choice)

describe('Act II AI Chum: which unchosen option to show (SPECS §4.5)', () => {
    it('shows the option that shares the chosen zone [FW 2231479]', () => {
        expect(respondChum(chosen(['R03', 'R04', 'R16'], 0), p)).toBe(1) // R03 and R04 are both zone 2
        expect(respondChum(chosen(['R16', 'R03', 'R04'], 2), p)).toBe(1)
        // even when the crew model finds the other decoy less believable
        expect(respondChum(chosen(['R03', 'R04', 'R16'], 0), p, [0.4, 0.5, 0.1])).toBe(1)
    })

    it('otherwise shows the least believable decoy, keeping the more credible one hidden', () => {
        expect(respondChum(chosen(['R03', 'R07', 'R13'], 0), p, [0.5, 0.1, 0.4])).toBe(1)
        expect(respondChum(chosen(['R03', 'R07', 'R13'], 0), p, [0.5, 0.4, 0.1])).toBe(2)
    })

    it('two decoys in the same zone: still the less believable one', () => {
        expect(respondChum(chosen(['R03', 'R07', 'R08'], 0), p, [0.4, 0.2, 0.4])).toBe(1)
    })

    it('never shows the chosen option, and works out the crew model by itself', () => {
        for (const choice of [0, 1, 2]) {
            const r = respondChum(chosen(['R03', 'R07', 'R13'], choice), p)
            expect(r).not.toBe(choice)
            expect([0, 1, 2]).toContain(r)
        }
    })
})

/** The shark in a given water with Ramming Speed in play. */
const rammer = (t: Tweak): GameState => board(Object.assign({ ability: 'rammingSpeed' as const }, t))

describe('Act II AI Ramming Speed: where to move after the crew attacks (SPECS §4.6)', () => {
    it('lists staying (no +2) and every adjacent water (+2)', () => {
        const opts = rammingOptions(rammer({ shark: 2 }), card('R03'), p)
        expect(opts.map(o => o.zone).sort()).toEqual([1, 3, null].sort())
        for (const o of opts) expect(Number.isFinite(o.value)).toBe(true)
    })

    it('moves to the water with the best attack', () => {
        const s = rammer({ shark: 2 })
        const opts = rammingOptions(s, card('R03'), p)
        const best = opts.reduce((a, b) => (b.value > a.value ? b : a))
        expect(decideRammingMove(s, card('R03'), p)).toBe(best.zone)
    })

    it('from a safe water with nothing to attack, rams into reach', () => {
        // decks 1, 2, 5, 6 gone: water 1 touches no deck; water 2 next to it touches deck 3
        const s = rammer({ shark: 1, tiles: { 1: 'gone', 2: 'gone', 5: 'gone', 6: 'gone' }, at: { brody: boat(4), quint: boat(8), hooper: boat(7) } })
        expect(decideRammingMove(s, card('R01'), p)).toBe(2)
    })

    it('stays when moving reaches nothing better', () => {
        const s = rammer({ shark: 1, tiles: { 1: 'gone', 2: 'gone', 3: 'gone', 5: 'gone', 6: 'gone' }, at: { brody: boat(4), quint: boat(8), hooper: boat(7) } })
        expect(decideRammingMove(s, card('R01'), p)).toBe(null)
    })

    it('moves for the +2 alone: 1 die cannot finish Quint (3 wounds) from here, 1 die + 2 can', () => {
        const s = rammer({ shark: 4, at: { quint: water(4), brody: boat(1), hooper: boat(5) }, wounds: { quint: 3 } })
        expect(decideRammingMove(s, card('R08'), p)).toBe(3)
    })

    it('goes for the crew member it can finish off', () => {
        const s = rammer({ shark: 1, at: { quint: water(3) }, wounds: { quint: 4 } })
        expect(decideRammingMove(s, card('R01'), p)).toBe(2) // from water 2, Quint in water 3 takes 1 die + 2
    })

    it('nothing to decide without the card in play, or once it moved', () => {
        expect(decideRammingMove(board({ shark: 2 }), card('R03'), p)).toBe(null)
        expect(decideRammingMove(rammer({ shark: 2, abilityUsed: true }), card('R03'), p)).toBe(null)
    })
})
