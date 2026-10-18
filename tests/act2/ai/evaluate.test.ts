import { describe, it, expect } from 'vitest'
import { evaluate, evaluateParts, lambda, WIN_VALUE } from '~/act2/core/ai/evaluate'
import { DEFAULT_PARAMS } from '~/act2/core/ai/params'
import type { GameState } from '~/act2/core/state'
import type { CrewId, GearId } from '~/act2/core/types'
import { board, water } from '../helpers'

const V = (s: GameState) => evaluate(s, DEFAULT_PARAMS)

const withGear = (s: GameState, id: CrewId, gear: GearId[]): GameState =>
    Object.assign({}, s, { crew: Object.assign({}, s.crew, { [id]: Object.assign({}, s.crew[id], { gear }) }) })

describe('Act II AI valuation: monotonic in every term (SPECS §4.2)', () => {
    it('a damaged or destroyed tile is worth more to the shark', () => {
        expect(V(board({ tiles: { 2: 'damaged' } }))).toBeGreaterThan(V(board({})))
        expect(V(board({ tiles: { 2: 'gone' } }))).toBeGreaterThan(V(board({ tiles: { 2: 'damaged' } })))
    })

    it('crew wounds are worth more, an eliminated crew member most', () => {
        expect(V(board({ wounds: { quint: 2 } }))).toBeGreaterThan(V(board({})))
        expect(V(board({ wounds: { quint: 4 } }))).toBeGreaterThan(V(board({ wounds: { quint: 2 } })))
        const dead = board({ wounds: { quint: 6 } })
        const gone = Object.assign({}, dead, { crew: Object.assign({}, dead.crew, { quint: Object.assign({}, dead.crew.quint, { space: null, gear: [] }) }) })
        expect(V(gone)).toBeGreaterThan(V(board({ wounds: { quint: 5 } })))
    })

    it('wounds to the shark lower the value', () => {
        expect(V(board({ sharkWounds: 6 }))).toBeLessThan(V(board({})))
        expect(V(board({ sharkWounds: 12 }))).toBeLessThan(V(board({ sharkWounds: 6 })))
    })

    it('a smaller crew arsenal is better for the shark; gear stuck on it is worse', () => {
        const s = board({})
        expect(V(withGear(s, 'hooper', ['hammer']))).toBeGreaterThan(V(s)) // Rifle and Canister gone
        // the same Flare: in Quint's hand it may attach later; stuck on the shark it burns every round
        const stuck = withGear(board({ attached: ['flare'] }), 'quint', ['machete', 'harpoonGun', 'chum'])
        expect(V(stuck)).toBeLessThan(V(s))
    })
})

describe('Act II AI valuation: shape', () => {
    it('finishing off a crew member is worth more than wounding a healthy one (convex f)', () => {
        const finish = V(board({ wounds: { quint: 6 } })) - V(board({ wounds: { quint: 5 } }))
        const first = V(board({ wounds: { quint: 1 } })) - V(board({}))
        expect(finish).toBeGreaterThan(first)
    })

    it('progress on one front beats the same progress spread over both (max + 0.25 min)', () => {
        // 4 damaged tiles = 0.25 of the boat; vs 2 damaged tiles + crew wounds of similar weight
        const focused = evaluateParts(board({ tiles: { 1: 'gone', 2: 'gone', 3: 'gone', 4: 'gone' } }), DEFAULT_PARAMS)
        const spread = evaluateParts(board({ tiles: { 1: 'gone', 2: 'gone' }, wounds: { brody: 6, quint: 0 } }), DEFAULT_PARAMS)
        expect(focused.boat).toBeCloseTo(0.5, 10)
        expect(focused.progress).toBeGreaterThan(spread.progress)
    })

    it('the weight of risk (λ) grows as the shark loses health', () => {
        expect(lambda(0, DEFAULT_PARAMS)).toBeLessThan(lambda(9, DEFAULT_PARAMS))
        expect(lambda(9, DEFAULT_PARAMS)).toBeLessThan(lambda(17, DEFAULT_PARAMS))
    })

    it('risk is convex: the last wounds weigh more than the first', () => {
        const first = V(board({})) - V(board({ sharkWounds: 3 }))
        const last = V(board({ sharkWounds: 14 })) - V(board({ sharkWounds: 17 }))
        expect(last).toBeGreaterThan(first)
    })

    it('g itself is convex: with λ held constant, half the wounds is less than half the risk', () => {
        const flat = Object.assign({}, DEFAULT_PARAMS, { lambdaGrowth: 0 })
        const half = evaluateParts(board({ sharkWounds: 9 }), flat).risk
        const full = evaluateParts(board({ sharkWounds: 18 }), flat).risk
        expect(half).toBeLessThan(full / 2)
    })

    it('a crew member out of the game counts as fully eliminated, whatever the track says', () => {
        const s = board({})
        const out = Object.assign({}, s, { crew: Object.assign({}, s.crew, { quint: Object.assign({}, s.crew.quint, { space: null }) }) })
        expect(evaluateParts(out, DEFAULT_PARAMS).crew).toBeCloseTo(1 / 3, 12)
    })

    it('a finished game is worth ±WIN_VALUE whatever else', () => {
        const s = board({})
        expect(V(Object.assign({}, s, { winner: 'shark' }))).toBe(WIN_VALUE)
        expect(V(Object.assign({}, s, { winner: 'crew' }))).toBe(-WIN_VALUE)
    })

    it('the parts add up, and the starting position is close to 0', () => {
        const p = evaluateParts(board({ tiles: { 3: 'damaged' }, wounds: { hooper: 3 }, sharkWounds: 5, at: { hooper: water(3) } }), DEFAULT_PARAMS)
        expect(p.value).toBeCloseTo(p.progress - p.risk - p.threat, 12)
        const start = evaluateParts(board({}), DEFAULT_PARAMS)
        expect(start.progress).toBe(0)
        expect(start.risk).toBe(0)
        expect(Math.abs(start.value)).toBeLessThan(0.5)
    })

    it('every part is finite, even past 18 shark wounds', () => {
        const p = evaluateParts(board({ sharkWounds: 25 }), DEFAULT_PARAMS)
        for (const k of Object.keys(p) as (keyof typeof p)[]) expect(Number.isFinite(p[k])).toBe(true)
    })
})
