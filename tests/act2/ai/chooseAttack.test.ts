import { describe, it, expect } from 'vitest'
import {
    attackOptions, decideAttack, decideRerolls, decideDomino, secondHelpingTargets, decideSecondHelping,
} from '~/act2/core/ai/chooseAttack'
import { DEFAULT_PARAMS } from '~/act2/core/ai/params'
import { hitValues } from '~/act2/core/ai/attackModel'
import type { GameState } from '~/act2/core/state'
import type { CrewId, GearId } from '~/act2/core/types'
import { board, card, boat, water, Tweak } from '../helpers'

const p = DEFAULT_PARAMS
const R03 = card('R03') // zone 2, 3 dice
const R04 = card('R04') // zone 2, 2 dice

function geared(t: Tweak, gear: Partial<Record<CrewId, GearId[]>>): GameState {
    const s = board(t)
    const crew = Object.assign({}, s.crew)
    for (const id of Object.keys(gear) as CrewId[]) crew[id] = Object.assign({}, crew[id], { gear: gear[id] })
    return Object.assign({}, s, { crew })
}

describe('Act II AI attack: the target, with the real positions (SPECS §4.7)', () => {
    it('finishes off the crew member one wound from death', () => {
        const s = board({ shark: 2, at: { quint: water(3), brody: boat(4), hooper: boat(8) }, wounds: { quint: 5 } })
        expect(decideAttack(s, R04, p)).toEqual({ kind: 'crew', crew: 'quint' })
    })

    it('nobody climbs out of the water now: no climbing discount in step 6', () => {
        // Quint in water 2 could climb onto deck 2 in step 3, but in step 6 it is too late
        const s = board({ shark: 2, at: { quint: water(2), brody: boat(4), hooper: boat(8) }, wounds: { quint: 3 } })
        const quint = { kind: 'crew' as const, crew: 'quint' as const }
        const real = hitValues(s, quint, 2, p, { real: true })
        const planning = hitValues(s, quint, 2, p)
        expect(real[2]).toBeGreaterThan(planning[2])
    })

    it('discounts a crew member who still holds the Shark Cage (main and bonus attacks)', () => {
        const t: Tweak = { shark: 2, at: { brody: water(2), quint: boat(6), hooper: boat(8) }, wounds: { brody: 3 } }
        const value = (s: GameState, q = p) => attackOptions(s, R04, q).filter(o => o.target.kind === 'crew')[0].value
        const withCage = geared(t, { brody: ['bat', 'sharkCage'], quint: ['machete'], hooper: ['hammer'] })
        const without = geared(t, { brody: ['bat'], quint: ['machete'], hooper: ['hammer'] })
        expect(value(withCage)).toBeLessThan(value(without))
        expect(value(withCage)).toBeCloseTo(value(without) * (1 - p.cageDiscount), 12)
        expect(value(withCage, Object.assign({}, p, { cageDiscount: 0 }))).toBeCloseTo(value(without), 12) // Easy ignores it
    })

    it('Ramming Speed\'s +2 counts once the shark moved', () => {
        const base: Tweak = { shark: 2, at: { brody: boat(4), quint: boat(8), hooper: boat(7) } }
        const moved = attackOptions(board(Object.assign({ ability: 'rammingSpeed' as const, abilityUsed: true }, base)), R04, p)[0].value
        const still = attackOptions(board(Object.assign({ ability: 'rammingSpeed' as const }, base)), R04, p)[0].value
        expect(moved).toBeGreaterThan(still)
    })

    it('holds back only with nothing to attack', () => {
        const s = board({ shark: 1, tiles: { 1: 'gone', 2: 'gone', 5: 'gone' }, at: { brody: boat(4), quint: boat(8), hooper: boat(7) } })
        expect(decideAttack(s, card('R01'), p)).toBe(null)
        expect(decideAttack(board({ shark: 2 }), R04, p)).not.toBe(null)
    })
})

describe('Act II AI Maul Again: reroll only the dice that improve the expected value [FW 2236208]', () => {
    const maul = (t: Tweak = {}) => board(Object.assign({ shark: 2, ability: 'maulAgain' as const, at: { brody: boat(4), quint: boat(8), hooper: boat(7) } }, t))
    const deck2 = { kind: 'boat' as const, zone: 2 as const }

    it('keeps a roll that already destroys the deck', () => {
        expect(decideRerolls(maul(), deck2, [2, 2, 0], p)).toEqual([])
    })

    it('rerolls a blank to try for the destroy, never the 2s', () => {
        // 2 + 2 = 4 would destroy; 2 + 0 only damages: reroll the blank
        expect(decideRerolls(maul(), deck2, [2, 0], p)).toEqual([1])
    })

    it('rerolls everything after a total miss', () => {
        expect(decideRerolls(maul(), deck2, [0, 0], p)).toEqual([0, 1])
    })

    it('nothing without the card, or once used', () => {
        expect(decideRerolls(board({ shark: 2 }), deck2, [0, 0], p)).toEqual([])
        expect(decideRerolls(maul({ abilityUsed: true }), deck2, [0, 0], p)).toEqual([])
    })
})

describe('Act II AI second targets: Second Helping and Domino Effect', () => {
    it('Second Helping goes for the best deck within reach', () => {
        const s = board({ shark: 2, tiles: { 2: 'damaged' }, ability: 'secondHelping', at: { brody: boat(4), quint: boat(8), hooper: boat(7) } })
        const list = secondHelpingTargets(s, p)
        expect(list.map(t => t.zone).sort()).toEqual([1, 2, 3])
        const best = list.reduce((a, b) => (b.value > a.value ? b : a))
        expect(decideSecondHelping(s, p)).toBe(best.zone)
    })

    it('Second Helping: no deck within reach, nothing to do', () => {
        const s = board({ shark: 1, tiles: { 1: 'gone', 2: 'gone', 5: 'gone' }, ability: 'secondHelping' })
        expect(decideSecondHelping(s, p)).toBe(null)
    })

    it('Domino Effect breaks the neighbour that knocks a crew member into the water next to the shark', () => {
        // deck 2 just damaged; Hooper on deck 3 would fall into water 3, next to the shark: bonus attack
        const s = board({ shark: 2, tiles: { 2: 'damaged' }, ability: 'dominoEffect', at: { brody: boat(4), quint: boat(8), hooper: boat(3) } })
        expect(decideDomino(s, 2, p)).toBe(3)
    })

    it('Domino Effect needs a neighbouring deck that still exists', () => {
        const s = board({ shark: 2, tiles: { 1: 'gone', 2: 'gone', 3: 'gone', 6: 'gone' }, ability: 'dominoEffect' })
        expect(decideDomino(s, 2, p)).toBe(null)
    })
})
