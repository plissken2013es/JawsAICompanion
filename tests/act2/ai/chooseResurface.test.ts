import { describe, it, expect } from 'vitest'
import { analyzeResurface, chooseResurface, stallRounds } from '~/act2/core/ai/chooseResurface'
import { DEFAULT_PARAMS } from '~/act2/core/ai/params'
import { setOptions } from '~/act2/core/round'
import type { GameState } from '~/act2/core/state'
import type { CrewId, GearId, ResurfaceId } from '~/act2/core/types'
import { board, boat, water, Tweak } from '../helpers'

const p = DEFAULT_PARAMS
const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0)

function at(t: Tweak, options: ResurfaceId[], gear?: Partial<Record<CrewId, GearId[]>>): GameState {
    const s = board(t)
    const crew = Object.assign({}, s.crew)
    if (gear) for (const id of Object.keys(gear) as CrewId[]) crew[id] = Object.assign({}, crew[id], { gear: gear[id] })
    return setOptions(Object.assign({}, s, { crew }), options)
}

const UNARMED = { brody: [], quint: [], hooper: [] }
const RIFLES = { brody: ['rifle'], quint: ['rifle'], hooper: ['rifle'] } as Partial<Record<CrewId, GearId[]>>
// Quint in the water of zone 2 one wound from death: R03 (zone 2, 3 dice) is by far the juiciest option.
const JUICY = { at: { quint: water(2) }, wounds: { quint: 5 } }
const JUICY_OPTIONS: ResurfaceId[] = ['R03', 'R09', 'R16'] // zones 2, 5, 8

describe('Act II AI Resurface: a mixed strategy (SPECS §4.3)', () => {
    it('probabilities over A, B, C that sum to 1, each at least p_min', () => {
        const a = analyzeResurface(at({}, ['R03', 'R07', 'R13']), p)
        expect(a.probs).toHaveLength(3)
        expect(sum(a.probs)).toBeCloseTo(1, 12)
        for (const x of a.probs) expect(x).toBeGreaterThanOrEqual(p.pMin - 1e-12)
    })

    it('prefers the clearly better option, but never always', () => {
        const a = analyzeResurface(at(JUICY, JUICY_OPTIONS, UNARMED), p)
        expect(a.probs[0]).toBeGreaterThan(a.probs[1])
        expect(a.probs[0]).toBeGreaterThan(a.probs[2])
        expect(a.probs[0]).toBeLessThan(1)
        // the others would be ~0.003 by the softmax alone: the floor keeps them at p_min
        expect(a.probs[1]).toBeGreaterThanOrEqual(p.pMin - 1e-12)
        expect(a.probs[2]).toBeGreaterThanOrEqual(p.pMin - 1e-12)
        const picks = new Set<number>()
        for (let seed = 0; seed < 300; seed++) {
            const s = at(JUICY, JUICY_OPTIONS, UNARMED)
            picks.add(chooseResurface(Object.assign({}, s, { rngState: seed }), p).choice)
        }
        expect(picks.size).toBeGreaterThan(1)
    })

    it('the guessing game: an armed crew who would aim at the obvious option makes it less likely', () => {
        const calm = analyzeResurface(at(JUICY, JUICY_OPTIONS, UNARMED), p)
        const armed = analyzeResurface(at(Object.assign({ sharkWounds: 12 }, JUICY), JUICY_OPTIONS, RIFLES), p)
        expect(armed.probs[0]).toBeLessThan(calm.probs[0])
        expect(armed.damage[0]).toBeGreaterThan(0)
    })

    // One fictitious-play round: against the uniform mix each crew member aims at a single zone.
    const once = Object.assign({}, p, { fpIterations: 1 })

    it('two options in the same zone fall under the same Target Token', () => {
        // R03 and R04 are both zone 2: one rifle aimed there covers both
        const a = analyzeResurface(at({}, ['R03', 'R04', 'R16'], { brody: ['rifle'], quint: [], hooper: [] }), once)
        expect(a.damage[0]).toBeGreaterThan(0)
        expect(a.damage[1]).toBeGreaterThan(0)
        expect(a.damage[2]).toBe(0)
    })

    it('a Pistol token also covers the waters next to it', () => {
        // R03 zone 2, R05 zone 3: a Pistol aimed at either covers both
        const a = analyzeResurface(at({}, ['R03', 'R05', 'R16'], { brody: ['pistol'], quint: [], hooper: [] }), once)
        expect(a.damage[0]).toBeGreaterThan(0)
        expect(a.damage[1]).toBeGreaterThan(0)
        expect(a.damage[2]).toBe(0)
    })
})

// Decks 1, 2 and 5 destroyed: water 1 touches no deck, so R01 (zone 1) has nothing to attack.
// Everyone on deck 8: moving up to 2, no melee weapon reaches the water of zone 1 (checked by hand).
const SAFE_TILES = { 1: 'gone', 2: 'gone', 5: 'gone' } as const
const AT_BOW = { brody: boat(8), quint: boat(8), hooper: boat(8) }
const SAFE_OPTIONS: ResurfaceId[] = ['R01', 'R13', 'R15'] // zones 1, 7, 8
const MELEE = { brody: ['bat'], quint: ['machete'], hooper: ['hammer'] } as Partial<Record<CrewId, GearId[]>>

describe('Act II AI Resurface: never a pointless option (SPECS §4.3.6)', () => {
    it('an option with no target is never chosen if another has one at no more risk', () => {
        const a = analyzeResurface(at({ tiles: SAFE_TILES, at: AT_BOW }, SAFE_OPTIONS, UNARMED), p)
        expect(a.offense[0].target).toBe(null)
        expect(a.probs[0]).toBe(0)
        expect(sum(a.probs)).toBeCloseTo(1, 12)
        expect(a.probs[1]).toBeGreaterThanOrEqual(p.pMin)
    })

    it('waiting out of reach stays possible when every option with a target is riskier', () => {
        const a = analyzeResurface(at({ tiles: SAFE_TILES, at: AT_BOW, sharkWounds: 14 }, SAFE_OPTIONS, MELEE), p)
        expect(a.damage[0]).toBe(0)
        expect(a.damage[1] + a.damage[2]).toBeGreaterThan(0)
        expect(a.probs[0]).toBeGreaterThan(0)
    })
})

describe('Act II AI Resurface: anti-stall (D-4)', () => {
    const risky = () => at({ tiles: SAFE_TILES, at: AT_BOW, sharkWounds: 14 }, SAFE_OPTIONS, MELEE)

    it('counts the rounds in a row the shark held back', () => {
        const s = board({})
        const log = (events: [number, string][]) => Object.assign({}, s, { round: 4, log: events.map(([round, event]) => ({ round, event })) })
        expect(stallRounds(log([[1, 'sharkHolds'], [2, 'sharkHolds'], [3, 'sharkHolds']]))).toBe(3)
        expect(stallRounds(log([[1, 'sharkHolds'], [2, 'sharkAttackBoat'], [3, 'sharkHolds']]))).toBe(1)
        expect(stallRounds(log([[3, 'sharkAttackCrew']]))).toBe(0)
    })

    it('each round without attacking makes the options with a target more likely', () => {
        const calm = analyzeResurface(risky(), p, { stall: 0 })
        const restless = analyzeResurface(risky(), p, { stall: 4 })
        expect(restless.probs[1] + restless.probs[2]).toBeGreaterThan(calm.probs[1] + calm.probs[2])
        const off = analyzeResurface(risky(), Object.assign({}, p, { stallFactor: 1 }), { stall: 4 })
        expect(off.probs).toEqual(calm.probs) // anti-stall switched off
    })
})

describe('Act II AI Resurface: the draw', () => {
    it('same seed, same choice; the RNG moves on', () => {
        const s = at({}, ['R03', 'R07', 'R13'])
        const a = chooseResurface(s, p)
        const b = chooseResurface(s, p)
        expect(a.choice).toBe(b.choice)
        expect([0, 1, 2]).toContain(a.choice)
        expect(a.state.rngState).not.toBe(s.rngState)
        expect(a.probs).toEqual(analyzeResurface(s, p).probs)
    })

    it('only while the shark is choosing; it does not change the game otherwise', () => {
        expect(() => analyzeResurface(board({}), p)).toThrow()
        const s = at({}, ['R03', 'R07', 'R13'])
        const r = chooseResurface(s, p)
        expect(Object.assign({}, r.state, { rngState: s.rngState })).toEqual(s)
    })
})
