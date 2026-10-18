/**
 * D3, answering Chum (SPECS §4.5): the shark must show one of the two options it did not choose.
 * If one shares the chosen zone, showing it tells the crew nothing [FW 2231479]; otherwise it shows
 * the least believable decoy (lowest probability in the crew's model of its choice) and keeps the
 * more credible one hidden.
 */
import { RESURFACE_CARDS } from '../data'
import { GameState } from '../state'
import { AiParams } from './params'
import { analyzeResurface } from './chooseResurface'

const zoneOf = (state: GameState, i: number): number => RESURFACE_CARDS.filter(c => c.id === state.turn.options[i])[0].zone

/** `probs`: the crew's model of the shark's choice (default: the D1 mix from this position). */
export function respondChum(state: GameState, p: AiParams, probs?: readonly number[]): number {
    const choice = state.turn.choice
    if (choice === null) throw new RangeError('Chum comes after the shark has chosen')
    const decoys = [0, 1, 2].filter(i => i !== choice)
    const twin = decoys.filter(i => zoneOf(state, i) === zoneOf(state, choice))
    if (twin.length > 0) return twin[0]
    const model = probs || analyzeResurface(Object.assign({}, state, { turn: Object.assign({}, state.turn, { step: 'choose' }) }), p).probs
    return model[decoys[0]] <= model[decoys[1]] ? decoys[0] : decoys[1]
}
