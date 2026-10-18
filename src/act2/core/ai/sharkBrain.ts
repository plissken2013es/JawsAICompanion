/**
 * The shark's mind as one object (SPECS §4): a call per decision of the round, each reading the
 * state and never changing it. Only public information and its own hand are used; there is no deck
 * in the state to read. Calls that draw from the RNG return the state with the RNG moved on.
 */
import type { Zone, AbilityId } from '../types'
import { GameState } from '../state'
import { SharkTarget } from '../sharkAttack'
import { currentCard } from '../round'
import { AiParams, Level, paramsFor } from './params'
import { chooseResurface, analyzeResurface } from './chooseResurface'
import { decideAbility } from './chooseAbility'
import { respondChum } from './respondChum'
import { decideRammingMove } from './rammingMove'
import { decideAttack, decideRerolls, decideSecondHelping, decideDomino } from './chooseAttack'
import { RESURFACE_CARDS } from '../data'

export interface Step2Decision {
    readonly choice: number
    readonly ability: AbilityId | null
    readonly probs: readonly number[]
    /** The state with the RNG moved on by the draw. */
    readonly state: GameState
}

export interface SharkBrain {
    readonly params: AiParams
    /** Step 2: where to resurface (D1) and whether to play an ability with it (D2). */
    decideStep2(state: GameState): Step2Decision
    /** Step 3, Chum: which unchosen option to show (D3). */
    onChum(state: GameState): number
    /** Step 6, Ramming Speed: water to move to, or null to stay (D4). */
    afterCrewAttacks(state: GameState): Zone | null
    /** Step 6: the main attack's target, null to hold back (D5). */
    decideAttack(state: GameState): SharkTarget | null
    /** Maul Again: which dice of this roll to roll again. */
    decideRerolls(state: GameState, target: SharkTarget, faces: readonly number[]): number[]
    decideSecondHelping(state: GameState): Zone | null
    decideDomino(state: GameState, damagedZone: Zone): Zone | null
}

export function createSharkBrain(levelOrParams: Level | AiParams): SharkBrain {
    const p = typeof levelOrParams === 'string' ? paramsFor(levelOrParams) : levelOrParams
    return {
        params: p,
        decideStep2(state) {
            const analysis = analyzeResurface(state, p)
            const drawn = chooseResurface(state, p, {}, analysis)
            const card = RESURFACE_CARDS.filter(c => c.id === state.turn.options[drawn.choice])[0]
            const ability = decideAbility(state, card, p, { damage: analysis.damage[drawn.choice] }).ability
            return { choice: drawn.choice, ability, probs: drawn.probs, state: drawn.state }
        },
        onChum: state => respondChum(state, p),
        afterCrewAttacks: state => decideRammingMove(state, currentCard(state), p),
        decideAttack: state => decideAttack(state, currentCard(state), p),
        decideRerolls: (state, target, faces) => decideRerolls(state, target, faces, p),
        decideSecondHelping: state => decideSecondHelping(state, p),
        decideDomino: (state, zone) => decideDomino(state, zone, p),
    }
}
