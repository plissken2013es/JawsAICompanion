import { describe, it, expect } from 'vitest'
import { createSharkBrain } from '~/act2/core/ai/sharkBrain'
import { DEFAULT_PARAMS } from '~/act2/core/ai/params'
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

describe('Act II: a single shark, the strongest measured (docs/acto2/04-ajuste.md)', () => {
    it('keeps every option alive (p_min 20 %): the hardest to read', () => {
        expect(DEFAULT_PARAMS.pMin).toBe(0.2)
        const probs = analyzeResurface(setOptions(game(), ['R03', 'R07', 'R13']), DEFAULT_PARAMS).probs
        expect(Math.min(...probs)).toBeGreaterThanOrEqual(0.2 - 1e-12)
    })

    it('anticipates the Shark Cage and keeps its reserves', () => {
        expect(DEFAULT_PARAMS.cageDiscount).toBeGreaterThan(0)
        expect(DEFAULT_PARAMS.rammingReserve).toBeGreaterThan(0)
    })

    it('a brain without arguments is that shark', () => {
        expect(createSharkBrain().params).toEqual(DEFAULT_PARAMS)
    })
})

describe('Act II SharkBrain: one call per decision, never changing the state it is given', () => {
    const brain = createSharkBrain()

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
    })
})

function toAttack(hand: AbilityId[], ability: AbilityId): GameState {
    const s = sharkChoose(setOptions(withHand(game(), hand), ['R03', 'R04', 'R13']), 0, ability)
    return endCrewAttacks(reveal(crewPrepare(s, {})))
}
