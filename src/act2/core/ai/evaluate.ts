/**
 * How good a position is for the shark (SPECS §4.2):
 *   V = max(boat, crew) + minWeight · min(boat, crew) − λ(h) · risk − threat
 * Rewarding the leading front more than the other keeps the shark focused on one way to win.
 * Only public information is used: no hand, no choice, no deck.
 */
import type { GearId } from '../types'
import { ZONES, CREW_HEALTH, SHARK_HEALTH, COMMON_GEAR_DECK, PERSONAL_GEAR } from '../data'
import { GameState, CREW_IDS } from '../state'
import { AiParams } from './params'

/** A finished game, beyond any position value. */
export const WIN_VALUE = 100

export interface ValueParts {
    /** Share of the boat broken: damaged 0.5, destroyed 1, over 8 tiles. */
    readonly boat: number
    /** Mean of f(wounds/6) over the crew, eliminated = 1. */
    readonly crew: number
    readonly progress: number
    /** λ(h) · g(h/18). */
    readonly risk: number
    readonly threat: number
    readonly value: number
}

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x))

export function lambda(sharkWounds: number, p: AiParams): number {
    return p.lambdaBase * (1 + p.lambdaGrowth * clamp01(sharkWounds / SHARK_HEALTH))
}

/** Every gear card in the game: the arsenal is measured against the whole box. */
const ALL_GEAR: readonly GearId[] = COMMON_GEAR_DECK.concat(PERSONAL_GEAR.brody, PERSONAL_GEAR.quint, PERSONAL_GEAR.hooper)

const threatOf = (cards: readonly GearId[], p: AiParams): number =>
    cards.reduce((s, id) => s + (p.gearThreat[id] || 0), 0)

export function evaluateParts(state: GameState, p: AiParams): ValueParts {
    const boat = ZONES.reduce((s, z) => s + (state.tiles[z] === 'gone' ? 1 : state.tiles[z] === 'damaged' ? 0.5 : 0), 0) / ZONES.length
    const crew = CREW_IDS.reduce((s, id) => {
        const m = state.crew[id]
        return s + (m.space ? Math.pow(clamp01(m.wounds / CREW_HEALTH), p.crewCurve) : 1)
    }, 0) / CREW_IDS.length
    const progress = Math.max(boat, crew) + p.minWeight * Math.min(boat, crew)

    const h = state.shark.wounds
    const risk = lambda(h, p) * Math.pow(clamp01(h / SHARK_HEALTH), p.riskCurve)

    const held = CREW_IDS.reduce((s, id) => s + (state.crew[id].space ? threatOf(state.crew[id].gear, p) : 0), 0)
    const stuck = p.attachedFactor * threatOf(state.shark.attached, p)
    const threat = p.threatWeight * (held + stuck) / threatOf(ALL_GEAR, p)

    return { boat, crew, progress, risk, threat, value: progress - risk - threat }
}

/** Who has won by the rules (SPECS §3.4), whether or not the engine has marked it yet. */
function winnerOf(state: GameState): GameState['winner'] {
    if (state.winner) return state.winner
    if (state.shark.wounds >= SHARK_HEALTH) return 'crew'
    if (CREW_IDS.every(id => !state.crew[id].space) || ZONES.every(z => state.tiles[z] === 'gone')) return 'shark'
    return null
}

export function evaluate(state: GameState, p: AiParams): number {
    const winner = winnerOf(state)
    if (winner === 'shark') return WIN_VALUE
    if (winner === 'crew') return -WIN_VALUE
    return evaluateParts(state, p).value
}
