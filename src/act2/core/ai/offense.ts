/**
 * What the shark can expect to gain from an option (SPECS §4.3.2): its best main attack from the
 * water of the card zone, the bonus attacks, and shaking off. Every attack is valued as the exact
 * expected change in V over all rolls. Crew positions are today's; a crew member in the water who
 * can climb back aboard in step 3 is discounted (AiParams.climbDiscount).
 */
import type { CrewId, ResurfaceCard } from '../types'
import { GameState, deepFreeze } from '../state'
import { adjacentSpaces } from '../adjacency'
import { hitsDistribution } from '../dice'
import { SharkTarget, sharkTargets, bonusAttackTargets, damageTile, woundCrew, mainAttackDice } from '../sharkAttack'
import { evaluate } from './evaluate'
import { AiParams } from './params'

export interface OffenseEstimate {
    /** Best main attack, null when there is nothing to attack. */
    readonly target: SharkTarget | null
    readonly main: number
    readonly bonus: number
    readonly shakeOff: number
    readonly total: number
}

/** The state as if the shark had resurfaced on this option. */
export function atOption(state: GameState, card: ResurfaceCard): GameState {
    return deepFreeze(Object.assign({}, state, {
        shark: Object.assign({}, state.shark, { space: { kind: 'water', zone: card.zone } }),
    }))
}

/** In the water next to a deck it could climb onto (which takes both moves of step 3). */
export function canClimbAboard(state: GameState, crewId: CrewId): boolean {
    const sp = state.crew[crewId].space
    return !!sp && sp.kind === 'water' && adjacentSpaces(state.tiles, sp).some(s => s.kind === 'boat')
}

function hitTarget(state: GameState, target: SharkTarget, hits: number): GameState {
    return target.kind === 'boat' ? damageTile(state, target.zone, hits, 'ai').state : woundCrew(state, target.crew, hits)
}

/** Expected ΔV of one attack with `dice` dice (+bonus hits) on a target, from a placed shark. */
export function attackValue(state: GameState, target: SharkTarget, dice: number, p: AiParams, bonusHits = 0): number {
    const before = evaluate(state, p)
    const fishingPole = state.shark.attached.indexOf('fishingPole') >= 0
    let gain = 0
    hitsDistribution(dice, { fishingPole }).forEach((prob, hits) => {
        if (prob > 0) gain += prob * (evaluate(hitTarget(state, target, hits + bonusHits), p) - before)
    })
    const climbs = target.kind === 'crew' && canClimbAboard(state, target.crew)
    return climbs ? gain * (1 - p.climbDiscount) : gain
}

export function expectedAttack(state: GameState, card: ResurfaceCard, p: AiParams): OffenseEstimate {
    const at = atOption(state, card)
    const dice = mainAttackDice(at, card)

    let target: SharkTarget | null = null
    let main = 0
    for (const t of sharkTargets(at)) {
        const v = attackValue(at, t, dice, p)
        if (v > main) { main = v; target = t }
    }

    // One die against each crew member in the water nearby (main target included) [M p.11].
    const bonus = bonusAttackTargets(at).reduce((s, id) => s + attackValue(at, { kind: 'crew', crew: id }, 1, p), 0)

    const stuck = card.shakeOff && at.shark.attached.length > 0
    const shaken = stuck ? deepFreeze(Object.assign({}, at, { shark: Object.assign({}, at.shark, { attached: [] }) })) : at
    const shakeOff = stuck ? evaluate(shaken, p) - evaluate(at, p) : 0

    return { target, main, bonus, shakeOff, total: main + bonus + shakeOff }
}
