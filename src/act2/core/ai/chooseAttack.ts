/**
 * D5, the shark's attack in step 6 (SPECS §4.7), with the real positions: the target of highest
 * expected value given the ability in play (a crew member who still holds the Shark Cage is
 * discounted: they may play it before the roll), Maul Again's best reroll, and the second targets
 * of Second Helping and Domino Effect.
 */
import type { Zone, ResurfaceCard, Space } from '../types'
import { TILE_ADJ, adjacentSpaces } from '../adjacency'
import { GameState } from '../state'
import { SharkTarget, sharkTargets, mainAttackDice, damageTile } from '../sharkAttack'
import { secondHelpingDice } from '../abilities'
import { AiParams } from './params'
import { evaluate } from './evaluate'
import { HitValueOptions, hitValues, expectOver, maulExpected, bestReroll, bonusValue } from './attackModel'

const RAMMING_BONUS = 2
const DOMINO_HITS = 2

export interface AttackOption {
    readonly target: SharkTarget
    readonly value: number
}

export interface ZoneOption {
    readonly zone: Zone
    readonly value: number
}

const unused = (state: GameState, id: string): boolean => state.shark.ability === id && !state.shark.abilityUsed

/** ΔV of 2 hits on a deck, plus the bonus attacks it opens up. */
function dominoValue(state: GameState, zone: Zone, p: AiParams): number {
    const after = damageTile(state, zone, DOMINO_HITS, 'ai').state
    return evaluate(after, p) - evaluate(state, p) + bonusValue(after, p, false)
}

export function dominoTargets(state: GameState, zone: Zone, p: AiParams): ZoneOption[] {
    return TILE_ADJ[zone].filter(n => state.tiles[n] !== 'gone').map(n => ({ zone: n, value: dominoValue(state, n, p) }))
}

export function secondHelpingTargets(state: GameState, p: AiParams): ZoneOption[] {
    const from = state.shark.space as Space
    const dice = secondHelpingDice(state)
    const v0 = evaluate(state, p)
    return adjacentSpaces(state.tiles, from).filter(s => s.kind === 'boat').map(s => {
        const vh: number[] = []
        for (let h = 0; h <= 2 * dice; h++) {
            const after = damageTile(state, s.zone, h, 'ai').state
            vh.push(evaluate(after, p) - v0 + bonusValue(after, p, false))
        }
        return { zone: s.zone, value: expectOver(vh, dice, state.shark.attached) }
    })
}

const best = (list: readonly ZoneOption[]): Zone | null =>
    list.length === 0 ? null : list.reduce((a, b) => (b.value > a.value + 1e-12 ? b : a)).zone

function optionsFor(state: GameState, target: SharkTarget, p: AiParams): HitValueOptions {
    const ability = state.shark.ability
    const bonusHits = ability === 'rammingSpeed' && state.shark.abilityUsed ? RAMMING_BONUS : 0
    let extra: HitValueOptions['extra']
    if (target.kind === 'boat' && unused(state, 'dominoEffect')) {
        extra = after => (after.tiles[target.zone] === state.tiles[target.zone] ? 0 : Math.max(0, ...dominoTargets(after, target.zone, p).map(o => o.value)))
    }
    if (target.kind === 'boat' && unused(state, 'secondHelping')) {
        extra = after => Math.max(0, ...secondHelpingTargets(after, p).map(o => o.value))
    }
    return { ability, bonusHits, extra, real: true, cageDiscount: p.cageDiscount }
}

export function attackOptions(state: GameState, card: ResurfaceCard, p: AiParams): AttackOption[] {
    const dice = mainAttackDice(state, card)
    const maul = unused(state, 'maulAgain')
    return sharkTargets(state).map(target => {
        const vh = hitValues(state, target, dice, p, optionsFor(state, target, p))
        return { target, value: maul ? maulExpected(vh, dice, state.shark.attached) : expectOver(vh, dice, state.shark.attached) }
    })
}

/** The main attack's target, null only when there is nothing to attack. */
export function decideAttack(state: GameState, card: ResurfaceCard, p: AiParams): SharkTarget | null {
    const list = attackOptions(state, card, p)
    if (list.length === 0) return null
    return list.reduce((a, b) => (b.value > a.value + 1e-12 ? b : a)).target
}

/** Maul Again: which dice of this roll to roll again ([] to keep it). */
export function decideRerolls(state: GameState, target: SharkTarget, faces: readonly number[], p: AiParams): number[] {
    if (!unused(state, 'maulAgain')) return []
    const vh = hitValues(state, target, faces.length, p, Object.assign({}, optionsFor(state, target, p), { ability: state.shark.ability }))
    return bestReroll(faces, vh, state.shark.attached).reroll
}

export function decideSecondHelping(state: GameState, p: AiParams): Zone | null {
    return best(secondHelpingTargets(state, p))
}

export function decideDomino(state: GameState, zone: Zone, p: AiParams): Zone | null {
    return best(dominoTargets(state, zone, p))
}
