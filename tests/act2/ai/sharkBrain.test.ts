import { describe, it, expect } from 'vitest'
import { createSharkBrain } from '~/act2/core/ai/sharkBrain'
import { paramsFor, LEVELS, DEFAULT_PARAMS } from '~/act2/core/ai/params'
import { analyzeResurface } from '~/act2/core/ai/chooseResurface'
import {
    setOptions, sharkChoose, crewPrepare, reveal, crewAttack, endCrewAttacks, ram, sharkMain, sharkBonus, endRound,
} from '~/act2/core/round'
import { bonusAttackTargets, mainAttackDice, rollDice } from '~/act2/core/sharkAttack'
import { currentCard } from '~/act2/core/round'
import type { GameState } from '~/act2/core/state'
import type { AbilityId } from '~/act2/core/types'
import { game, boat } from '../helpers'

const withHand = (s: GameState, hand: AbilityId[]): GameState =>
    Object.assign({}, s, { shark: Object.assign({}, s.shark, { hand }) })

describe('Act II difficulty levels (tuned in docs/acto2/04-ajuste.md, D-3)', () => {
    it('Normal is the default set', () => {
        expect(paramsFor('normal')).toEqual(DEFAULT_PARAMS)
        expect(LEVELS).toEqual(['easy', 'normal', 'hard'])
    })

    it('Easy plays its abilities reluctantly, ignores the Shark Cage and is predictable', () => {
        const e = paramsFor('easy')
        expect(e.abilityBase).toBeGreaterThan(DEFAULT_PARAMS.abilityBase)
        expect(e.cageDiscount).toBe(0)
        expect(e.pMin).toBeLessThan(DEFAULT_PARAMS.pMin)
    })

    it('Hard keeps every option alive: harder to read', () => {
        const h = paramsFor('hard')
        expect(h.pMin).toBeGreaterThan(DEFAULT_PARAMS.pMin)
        const s = setOptions(game(), ['R03', 'R07', 'R13'])
        expect(Math.min(...analyzeResurface(s, h).probs)).toBeGreaterThanOrEqual(h.pMin - 1e-12)
        expect(Math.max(...analyzeResurface(s, h).probs)).toBeLessThanOrEqual(Math.max(...analyzeResurface(s, paramsFor('easy')).probs) + 1e-12)
    })
})

describe('Act II SharkBrain: one call per decision, never changing the state it is given', () => {
    const brain = createSharkBrain('normal')

    it('step 2: picks an option and maybe an ability from its hand', () => {
        const s = setOptions(withHand(game(), ['extraStrength', 'hardTarget', 'bigMouth', 'bigMouth', 'makingWaves', 'makingWaves']), ['R03', 'R07', 'R13'])
        const before = JSON.stringify(s)
        const d = brain.decideStep2(s)
        expect(JSON.stringify(s)).toBe(before)
        expect([0, 1, 2]).toContain(d.choice)
        if (d.ability) expect(s.shark.hand).toContain(d.ability)
        expect(() => sharkChoose(d.state, d.choice, d.ability || undefined)).not.toThrow()
        expect(brain.decideStep2(s)).toEqual(d) // same state, same decision
    })

    it('answers Chum with an option it did not choose', () => {
        const s = sharkChoose(setOptions(game(), ['R03', 'R07', 'R13']), 1)
        const shown = brain.onChum(s)
        expect(shown).not.toBe(1)
    })

    it('plays a whole round with the engine: every decision is legal', () => {
        let s = setOptions(withHand(game(), ['rammingSpeed', 'maulAgain', 'secondHelping', 'dominoEffect']), ['R03', 'R04', 'R13'])
        const d = brain.decideStep2(s)
        s = sharkChoose(d.state, d.choice, d.ability || undefined)
        s = reveal(crewPrepare(s, { brody: { weapon: 'bat', target: 2 }, quint: { to: boat(2), weapon: 'machete', target: 2 } }))
        if (s.turn.plans.brody && s.shark.space && s.shark.space.zone === 2) s = crewAttack(s, 'brody', [[1, 1]])
        s = endCrewAttacks(s)
        const move = brain.afterCrewAttacks(s)
        if (move !== null) s = ram(s, move)
        const target = brain.decideAttack(s)
        let faces: number[] = []
        if (target) {
            const roll = rollDice(s, mainAttackDice(s, currentCard(s)))
            s = roll.state
            faces = roll.faces
            const rerolls = brain.decideRerolls(s, target, faces)
            for (const i of rerolls) expect(i).toBeLessThan(faces.length)
        }
        s = sharkMain(s, target, faces)
        const rolls: Record<string, number[]> = {}
        for (const id of bonusAttackTargets(s)) rolls[id] = [1]
        s = endRound(sharkBonus(s, rolls))
        expect(s.round).toBe(2)
    })

    it('Second Helping and Domino Effect targets come from the brain too', () => {
        const s = toAttack(['secondHelping', 'dominoEffect'], 'secondHelping')
        expect([1, 2, 3, null]).toContain(brain.decideSecondHelping(s))
        expect([1, 3, 6, null]).toContain(brain.decideDomino(s, 2))
    })

    it('a brain can also be built from explicit parameters (for the simulator)', () => {
        const custom = createSharkBrain(Object.assign({}, DEFAULT_PARAMS, { pMin: 0.3 }))
        expect(custom.params.pMin).toBe(0.3)
        expect(createSharkBrain('hard').params).toEqual(paramsFor('hard'))
    })
})

function toAttack(hand: AbilityId[], ability: AbilityId): GameState {
    const s = sharkChoose(setOptions(withHand(game(), hand), ['R03', 'R04', 'R13']), 0, ability)
    return endCrewAttacks(reveal(crewPrepare(s, {})))
}
