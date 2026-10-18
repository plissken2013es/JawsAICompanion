import { describe, it, expect } from 'vitest'
import { expectedAttack, attackValue, canClimbAboard, atOption } from '~/act2/core/ai/offense'
import { DEFAULT_PARAMS } from '~/act2/core/ai/params'
import { WIN_VALUE } from '~/act2/core/ai/evaluate'
import type { GameState } from '~/act2/core/state'
import { board, card, boat, water } from '../helpers'

const p = DEFAULT_PARAMS
const R01 = card('R01') // zone 1, 1 die
const R02 = card('R02') // zone 1, 2 dice
const R03 = card('R03') // zone 2, 3 dice, shakes off
const R04 = card('R04') // zone 2, 2 dice
const R07 = card('R07') // zone 4, 2 dice

const eliminate = (s: GameState, ...ids: ('brody' | 'quint' | 'hooper')[]): GameState => {
    const crew = Object.assign({}, s.crew)
    for (const id of ids) crew[id] = Object.assign({}, crew[id], { space: null, gear: [] })
    return Object.assign({}, s, { crew })
}

describe('Act II AI offense: placing the shark on an option', () => {
    it('puts it in the water of the card zone without touching anything else', () => {
        const s = board({})
        const at = atOption(s, R07)
        expect(at.shark.space).toEqual(water(4))
        expect(at.tiles).toEqual(s.tiles)
        expect(s.shark.space).toBe(null)
    })
})

describe('Act II AI offense: expected value of the main attack (SPECS §4.3.2)', () => {
    it('is 0 with nothing to attack', () => {
        // water 1 with decks 1, 2 and 5 destroyed touches no deck; the crew is on decks far away
        const s = board({ tiles: { 1: 'gone', 2: 'gone', 5: 'gone' }, at: { brody: boat(3), quint: boat(6), hooper: boat(7) } })
        const e = expectedAttack(s, R01, p)
        expect(e.target).toBe(null)
        expect(e.main).toBe(0)
        expect(e.total).toBe(0)
    })

    it('finishing off a crew member in the water beats damaging an intact deck', () => {
        const s = board({ at: { quint: water(2) }, wounds: { quint: 5 } })
        const e = expectedAttack(s, R03, p)
        expect(e.target).toEqual({ kind: 'crew', crew: 'quint' })
        const at = atOption(s, R03)
        expect(attackValue(at, { kind: 'crew', crew: 'quint' }, 3, p)).toBeGreaterThan(attackValue(at, { kind: 'boat', zone: 2 }, 3, p))
    })

    it('more dice against an intact stern deck are worth more', () => {
        const at = atOption(board({}), R01)
        const target = { kind: 'boat' as const, zone: 1 as const }
        expect(attackValue(at, target, 3, p)).toBeGreaterThan(attackValue(at, target, 2, p))
        expect(attackValue(at, target, 2, p)).toBeGreaterThan(attackValue(at, target, 1, p))
        expect(expectedAttack(board({}), R02, p).main).toBeGreaterThan(expectedAttack(board({}), R01, p).main)
    })

    it('the Fishing Pole on the shark lowers it; a Tranq Spear wound leaves 1 die', () => {
        expect(expectedAttack(board({ attached: ['fishingPole'] }), R04, p).main).toBeLessThan(expectedAttack(board({}), R04, p).main)
        expect(expectedAttack(board({ tranquilized: true }), R03, p).main).toBeLessThan(expectedAttack(board({}), R03, p).main)
    })

    it('eliminating the last crew member is a win (halved: Quint could climb aboard first)', () => {
        const s = eliminate(board({ at: { quint: water(2) }, wounds: { quint: 5 } }), 'brody', 'hooper')
        const e = expectedAttack(s, R04, p)
        expect(e.main).toBeGreaterThan(WIN_VALUE / 4)
    })
})

describe('Act II AI offense: crew in the water who can climb back aboard count less', () => {
    // decks 3, 4, 7 and 8 destroyed: water 4 touches no deck, water 3 still touches deck 2
    const tiles = { 3: 'gone', 4: 'gone', 7: 'gone', 8: 'gone' } as const

    it('knows who can climb aboard', () => {
        expect(canClimbAboard(board({ tiles, at: { quint: water(3), hooper: boat(6) } }), 'quint')).toBe(true)
        expect(canClimbAboard(board({ tiles, at: { quint: water(4), hooper: boat(6) } }), 'quint')).toBe(false)
        expect(canClimbAboard(board({}), 'quint')).toBe(false) // on the boat already
    })

    it('the same kill is worth more on someone who cannot get out of the water', () => {
        const stuck = atOption(board({ tiles, at: { quint: water(4), hooper: boat(6) }, wounds: { quint: 5 } }), R07)
        const free = atOption(board({ tiles, at: { quint: water(3), hooper: boat(6) }, wounds: { quint: 5 } }), R07)
        const target = { kind: 'crew' as const, crew: 'quint' as const }
        expect(attackValue(stuck, target, 2, p)).toBeGreaterThan(attackValue(free, target, 2, p))
        expect(attackValue(free, target, 2, p)).toBeCloseTo(attackValue(stuck, target, 2, p) * (1 - p.climbDiscount), 12)
    })
})

describe('Act II AI offense: bonus attacks and shaking off', () => {
    it('crew in the water nearby add bonus attack value', () => {
        expect(expectedAttack(board({ at: { brody: water(3) } }), R04, p).bonus).toBeGreaterThan(0)
        expect(expectedAttack(board({}), R04, p).bonus).toBe(0)
    })

    it('a shake-off card is worth more with gear stuck on the shark', () => {
        expect(expectedAttack(board({ attached: ['flare'] }), R03, p).shakeOff).toBeGreaterThan(0)
        expect(expectedAttack(board({}), R03, p).shakeOff).toBe(0)
        expect(expectedAttack(board({ attached: ['flare'] }), R04, p).shakeOff).toBe(0) // R04 does not shake off
    })

    it('the total adds the three parts', () => {
        const e = expectedAttack(board({ at: { brody: water(2) }, attached: ['flare'] }), R03, p)
        expect(e.total).toBeCloseTo(e.main + e.bonus + e.shakeOff, 12)
        expect(e.main).toBeGreaterThan(0)
    })
})
