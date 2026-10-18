/**
 * D4, Ramming Speed after the crew attacks (SPECS §4.6): the real positions are known now. Staying
 * gives no bonus; moving to an adjacent water gives +2 on the main attack. Picks the best expected
 * attack, staying on ties.
 */
import type { Zone, ResurfaceCard, Space } from '../types'
import { adjacentSpaces } from '../adjacency'
import { GameState, deepFreeze } from '../state'
import { sharkTargets, mainAttackDice } from '../sharkAttack'
import { AiParams } from './params'
import { hitValues, expectOver } from './attackModel'

const RAMMING_BONUS = 2

export interface RammingOption {
    /** Water to move to, null to stay. */
    readonly zone: Zone | null
    readonly value: number
}

function bestFrom(state: GameState, dice: number, bonusHits: number, p: AiParams): number {
    let best = 0
    for (const t of sharkTargets(state)) best = Math.max(best, expectOver(hitValues(state, t, dice, p, { bonusHits }), dice, state.shark.attached))
    return best
}

export function rammingOptions(state: GameState, card: ResurfaceCard, p: AiParams): RammingOption[] {
    const here = state.shark.space as Space
    const dice = mainAttackDice(state, card)
    const out: RammingOption[] = [{ zone: null, value: bestFrom(state, dice, 0, p) }]
    for (const w of adjacentSpaces(state.tiles, here)) {
        if (w.kind !== 'water') continue
        const moved = deepFreeze(Object.assign({}, state, { shark: Object.assign({}, state.shark, { space: w }) }))
        out.push({ zone: w.zone, value: bestFrom(moved, dice, RAMMING_BONUS, p) })
    }
    return out
}

export function decideRammingMove(state: GameState, card: ResurfaceCard, p: AiParams): Zone | null {
    if (state.shark.ability !== 'rammingSpeed' || state.shark.abilityUsed || !state.shark.space) return null
    let best: RammingOption = { zone: null, value: -Infinity }
    for (const o of rammingOptions(state, card, p)) if (o.value > best.value + 1e-12) best = o
    return best.zone
}
