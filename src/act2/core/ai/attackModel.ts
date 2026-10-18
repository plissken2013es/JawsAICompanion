/**
 * The shark's attack as a function of the dice: for each number of hits, what the round's attacks
 * are worth (main attack with an ability's effect, then the bonus attacks it opens up). Shared by
 * the ability choice (D2) and the attack choice (D5), including Maul Again's best reroll.
 */
import type { AbilityId, CrewId, GearId } from '../types'
import { GameState, CrewState, CREW_IDS } from '../state'
import { SharkTarget, bonusAttackTargets, damageTile, woundCrew } from '../sharkAttack'
import { hitsDistribution } from '../dice'
import { evaluate } from './evaluate'
import { attackValue, canClimbAboard } from './offense'
import { AiParams } from './params'

/** Probability of a die showing 0, 1 or 2 hits (the Fishing Pole turns 2 into 1). */
export function faceProbs(attached: readonly GearId[]): number[] {
    return attached.indexOf('fishingPole') >= 0 ? [1 / 6, 5 / 6, 0] : [1 / 6, 3 / 6, 2 / 6]
}

const effective = (face: number, attached: readonly GearId[]): number =>
    attached.indexOf('fishingPole') >= 0 && face === 2 ? 1 : face

/** The main attack lands `hits` hits (bonus included), with Extra Strength, Big Mouth or Making Waves. */
export function afterMainAttack(state: GameState, target: SharkTarget, hits: number, ability: AbilityId | null): GameState {
    if (target.kind === 'crew') return woundCrew(state, target.crew, hits)
    const before = state.tiles[target.zone]
    const r = damageTile(state, target.zone, hits, 'ai')
    let s = r.state
    if (r.tile === before) return s
    if (ability === 'extraStrength' && r.tile === 'damaged') s = damageTile(s, target.zone, Infinity, 'ai').state
    if (ability === 'bigMouth') for (const id of r.fell) s = woundCrew(s, id, 1)
    if (ability === 'makingWaves') {
        const crew: Record<CrewId, CrewState> = Object.assign({}, s.crew)
        for (const id of CREW_IDS) {
            const sp = crew[id].space
            if (sp && sp.kind === 'boat') crew[id] = Object.assign({}, crew[id], { space: { kind: 'water', zone: sp.zone } })
        }
        s = Object.assign({}, s, { crew })
    }
    return s
}

const holdsCage = (state: GameState, id: CrewId): boolean =>
    !state.crew[id].caged && state.crew[id].gear.indexOf('sharkCage') >= 0

/** One die against each crew member in the water nearby (the Shark Cage protects from these too). */
export function bonusValue(state: GameState, p: AiParams, planning = true, cageDiscount = 0): number {
    return bonusAttackTargets(state).reduce((s, id) =>
        s + attackValue(state, { kind: 'crew', crew: id }, 1, p, 0, planning) * (holdsCage(state, id) ? 1 - cageDiscount : 1), 0)
}

export interface HitValueOptions {
    readonly bonusHits?: number
    readonly ability?: AbilityId | null
    /** Extra value after the main attack (Domino Effect, Second Helping). */
    readonly extra?: (after: GameState) => number
    /** Step 6: positions are real, nobody gets out of the water before the roll. */
    readonly real?: boolean
    /** Share of the value lost on a crew member who may play the Shark Cage first. */
    readonly cageDiscount?: number
}

/** vh[h] = value of the round's attacks when the main attack's dice show h hits. */
export function hitValues(state: GameState, target: SharkTarget, dice: number, p: AiParams, opts: HitValueOptions = {}): number[] {
    const v0 = evaluate(state, p)
    const planning = !opts.real
    const climbs = planning && target.kind === 'crew' && canClimbAboard(state, target.crew)
    const cage = opts.cageDiscount || 0
    const caged = target.kind === 'crew' && holdsCage(state, target.crew)
    const discount = (climbs ? 1 - p.climbDiscount : 1) * (caged ? 1 - cage : 1)
    const out: number[] = []
    for (let h = 0; h <= 2 * dice; h++) {
        const s = afterMainAttack(state, target, h + (opts.bonusHits || 0), opts.ability || null)
        out.push(discount * (evaluate(s, p) - v0) + bonusValue(s, p, planning, cage) + (opts.extra ? opts.extra(s) : 0))
    }
    return out
}

export function expectOver(vh: readonly number[], dice: number, attached: readonly GearId[]): number {
    const fishingPole = attached.indexOf('fishingPole') >= 0
    return hitsDistribution(dice, { fishingPole }).reduce((s, prob, h) => s + prob * vh[h], 0)
}

/** Maul Again: which dice to roll again to maximise the expected value (fewest dice on ties). */
export function bestReroll(faces: readonly number[], vh: readonly number[], attached: readonly GearId[]): { reroll: number[]; value: number } {
    const fishingPole = attached.indexOf('fishingPole') >= 0
    let best = { reroll: [] as number[], value: -Infinity }
    const n = faces.length
    const subsets: number[][] = []
    for (let mask = 0; mask < (1 << n); mask++) subsets.push(faces.map((_, i) => i).filter(i => mask & (1 << i)))
    subsets.sort((a, b) => a.length - b.length)
    for (const reroll of subsets) {
        const kept = faces.reduce((s, f, i) => s + (reroll.indexOf(i) >= 0 ? 0 : effective(f, attached)), 0)
        const value = hitsDistribution(reroll.length, { fishingPole }).reduce((s, prob, r) => s + prob * vh[kept + r], 0)
        if (value > best.value + 1e-12) best = { reroll, value }
    }
    return best
}

/** Expected value of an attack with `dice` dice when Maul Again rerolls optimally. */
export function maulExpected(vh: readonly number[], dice: number, attached: readonly GearId[]): number {
    const probs = faceProbs(attached)
    let total = 0
    const walk = (faces: number[], prob: number): void => {
        if (faces.length === dice) { total += prob * bestReroll(faces, vh, attached).value; return }
        for (let f = 0; f <= 2; f++) if (probs[f] > 0) walk(faces.concat(f), prob * probs[f])
    }
    walk([], 1)
    return total
}
