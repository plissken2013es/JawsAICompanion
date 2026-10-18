/**
 * How much each crew member could hurt the shark if it resurfaces on a given option and they aim
 * there (SPECS §4.3.1). Exact expected wounds from the dice maths, with each crew member's best
 * weapon among those that reach the zone this round (firearms anywhere; melee and attachables
 * where they can get after moving up to 2). The guessing game (P-14) weighs it by where they aim.
 */
import type { CrewId, GearId, ResurfaceCard } from '../types'
import { GEAR } from '../data'
import { GameState, CREW_IDS } from '../state'
import { reachableTargets } from '../movement'
import { effectiveEvade } from '../crewAttack'
import { woundsDistribution, rerollIfZero, expectedValue } from '../dice'
import { AiParams } from './params'

const CANISTER_WOUNDS = 3

export interface ThreatOptions {
    /** The shark plans to play Hard Target this round. */
    readonly hardTarget?: boolean
}

export interface CrewThreat {
    readonly crew: CrewId
    /** Best weapon for this option, null if none reaches it. */
    readonly weapon: GearId | null
    /** Expected wounds (attachables: their wound-equivalent value). */
    readonly wounds: number
}

/** Expected wounds of one dice weapon against a card Evade. */
export function expectedWounds(weapon: GearId, cardEvade: number, hardTarget: boolean, attached: readonly GearId[]): number {
    const g = GEAR[weapon]
    const evade = effectiveEvade(weapon, cardEvade, hardTarget, attached)
    let dist = woundsDistribution(g.dice, { bonus: g.bonus, evade })
    if (weapon === 'bat') dist = rerollIfZero(dist)
    const canister = (weapon === 'pistol' || weapon === 'rifle') && attached.indexOf('canister') >= 0
    return expectedValue(dist) + (canister ? CANISTER_WOUNDS * (1 - dist[0]) : 0)
}

/** Expected wounds (or wound-equivalent, for attachables) of one weapon if the shark surfaces on `card`. */
export function weaponWounds(state: GameState, weapon: GearId, card: ResurfaceCard, hardTarget: boolean, p: AiParams): number {
    const g = GEAR[weapon]
    if (g.kind === 'accessory') return 0
    if (g.kind === 'attachable') return state.shark.attached.indexOf(weapon) >= 0 ? 0 : (p.attachValue[weapon] || 0)
    return expectedWounds(weapon, card.evade, hardTarget, state.shark.attached)
}

export function crewThreats(state: GameState, card: ResurfaceCard, opts: ThreatOptions, p: AiParams): CrewThreat[] {
    const hardTarget = !!opts.hardTarget || state.shark.ability === 'hardTarget'
    const out: CrewThreat[] = []
    for (const id of CREW_IDS) {
        const member = state.crew[id]
        if (!member.space) continue
        let best: CrewThreat = { crew: id, weapon: null, wounds: 0 }
        for (const weapon of member.gear) {
            if (reachableTargets(state.tiles, member.space, weapon).indexOf(card.zone) < 0) continue
            const wounds = weaponWounds(state, weapon, card, hardTarget, p)
            if (wounds > best.wounds) best = { crew: id, weapon, wounds }
        }
        out.push(best)
    }
    return out
}

/** Total expected wounds if every crew member aims at this option (an upper bound). */
export function optionThreat(state: GameState, card: ResurfaceCard, opts: ThreatOptions, p: AiParams): number {
    return crewThreats(state, card, opts, p).reduce((s, t) => s + t.wounds, 0)
}
