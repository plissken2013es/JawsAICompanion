/**
 * D2, play or keep an ability (SPECS §4.4). For the option already chosen, each card in the hand is
 * valued as the expected value of the round's attacks with it minus without it (positions as they
 * are now: the card goes down before the crew moves). The best one is played if its gain, minus a
 * reserve for Ramming Speed (late game) and Hard Target (high risk), beats a threshold that drops
 * with a bigger hand and as the game goes on.
 */
import type { AbilityId, ResurfaceCard, Space } from '../types'
import { SHARK_HEALTH } from '../data'
import { TILE_ADJ, adjacentSpaces } from '../adjacency'
import { GameState, deepFreeze } from '../state'
import { SharkTarget, sharkTargets, mainAttackDice, damageTile } from '../sharkAttack'
import { AiParams } from './params'
import { evaluate, evaluateParts } from './evaluate'
import { atOption } from './offense'
import { optionThreat } from './threat'
import { hitValues, expectOver, maulExpected, HitValueOptions } from './attackModel'

const SECOND_HELPING_DICE = 2
const DOMINO_HITS = 2
const RAMMING_BONUS = 2

export interface AbilityOptions {
    /** Expected wounds the shark takes on this option (from D1); default: threat × hitShare. */
    readonly damage?: number
}

export interface AbilityDecision {
    readonly ability: AbilityId | null
    readonly gains: Readonly<Partial<Record<AbilityId, number>>>
    readonly threshold: number
}

/** Best expected value of the round's attacks from where the shark is, over its targets. */
function bestAttack(at: GameState, dice: number, p: AiParams, opts: (t: SharkTarget) => HitValueOptions,
    expect: (vh: number[]) => number = vh => expectOver(vh, dice, at.shark.attached)): number {
    let best = 0
    for (const t of sharkTargets(at)) best = Math.max(best, expect(hitValues(at, t, dice, p, opts(t))))
    return best
}

/** Expected ΔV of a 2-dice boat attack on the best deck within reach (Second Helping). */
function secondAttack(after: GameState, p: AiParams): number {
    const from = after.shark.space as Space
    const v0 = evaluate(after, p)
    let best = 0
    for (const s of adjacentSpaces(after.tiles, from)) {
        if (s.kind !== 'boat') continue
        const vh: number[] = []
        for (let h = 0; h <= 2 * SECOND_HELPING_DICE; h++) vh.push(evaluate(damageTile(after, s.zone, h, 'ai').state, p) - v0)
        best = Math.max(best, expectOver(vh, SECOND_HELPING_DICE, after.shark.attached))
    }
    return best
}

/** Best 2-hit Domino Effect on a deck next to `zone`, if the main attack broke it. */
function domino(before: GameState, zone: number, after: GameState, p: AiParams): number {
    const z = zone as keyof typeof TILE_ADJ
    if (after.tiles[z] === before.tiles[z]) return 0
    const v0 = evaluate(after, p)
    let best = 0
    for (const n of TILE_ADJ[z]) {
        if (after.tiles[n] !== 'gone') best = Math.max(best, evaluate(damageTile(after, n, DOMINO_HITS, 'ai').state, p) - v0)
    }
    return best
}

/** Second Helping only follows an attack on the boat: nothing extra after biting a crew member. */
export function secondHelpingExtra(target: SharkTarget, p: AiParams): HitValueOptions {
    return target.kind === 'boat' ? { extra: after => secondAttack(after, p) } : {}
}

function costOf(state: GameState, wounds: number, p: AiParams): number {
    const hurt = Object.assign({}, state, { shark: Object.assign({}, state.shark, { wounds: state.shark.wounds + wounds }) })
    return evaluate(state, p) - evaluate(hurt, p)
}

export function abilityGains(state: GameState, card: ResurfaceCard, p: AiParams, opts: AbilityOptions = {}): Partial<Record<AbilityId, number>> {
    const at = atOption(state, card)
    const dice = mainAttackDice(at, card)
    const plain = bestAttack(at, dice, p, () => ({}))
    const gains: Partial<Record<AbilityId, number>> = {}
    const hand = state.shark.hand.filter((id, i) => state.shark.hand.indexOf(id) === i)

    for (const id of hand) {
        let withIt = plain
        if (id === 'extraStrength' || id === 'bigMouth' || id === 'makingWaves') {
            withIt = bestAttack(at, dice, p, () => ({ ability: id }))
        } else if (id === 'dominoEffect') {
            withIt = bestAttack(at, dice, p, t => (t.kind === 'boat' ? { extra: after => domino(at, t.zone, after, p) } : {}))
        } else if (id === 'secondHelping') {
            withIt = bestAttack(at, dice, p, t => secondHelpingExtra(t, p))
        } else if (id === 'maulAgain') {
            withIt = bestAttack(at, dice, p, () => ({}), vh => maulExpected(vh, dice, at.shark.attached))
        } else if (id === 'rammingSpeed') {
            for (const w of adjacentSpaces(at.tiles, at.shark.space as Space)) {
                if (w.kind !== 'water') continue
                const moved = deepFreeze(Object.assign({}, at, { shark: Object.assign({}, at.shark, { space: w }) }))
                withIt = Math.max(withIt, bestAttack(moved, dice, p, () => ({ bonusHits: RAMMING_BONUS })))
            }
        } else if (id === 'hardTarget') {
            const threat = optionThreat(state, card, {}, p)
            const damage = opts.damage === undefined ? threat * p.hitShare : opts.damage
            const ratio = threat > 0 ? optionThreat(state, card, { hardTarget: true }, p) / threat : 1
            withIt = plain + costOf(state, damage, p) - costOf(state, damage * ratio, p)
        }
        gains[id] = Math.max(0, withIt - plain)
    }
    return gains
}

function reserve(state: GameState, id: AbilityId, p: AiParams): number {
    const health = state.shark.wounds / SHARK_HEALTH
    if (id === 'rammingSpeed') {
        const parts = evaluateParts(state, p)
        return p.rammingReserve * Math.max(0, 1 - Math.max(parts.boat, parts.crew, health))
    }
    if (id === 'hardTarget') return p.hardTargetReserve * Math.max(0, 1 - health)
    return 0
}

export function abilityThreshold(state: GameState, p: AiParams): number {
    const roundsLeft = Math.max(1, p.expectedRounds - state.round + 1)
    return p.abilityBase * (1 + roundsLeft / Math.max(1, state.shark.hand.length))
}

export function decideAbility(state: GameState, card: ResurfaceCard, p: AiParams, opts: AbilityOptions = {}): AbilityDecision {
    const gains = abilityGains(state, card, p, opts)
    const threshold = abilityThreshold(state, p)
    let ability: AbilityId | null = null
    let bestNet = threshold
    for (const id of Object.keys(gains) as AbilityId[]) {
        const net = (gains[id] || 0) - reserve(state, id, p)
        if (net > bestNet) { bestNet = net; ability = id }
    }
    return { ability, gains, threshold }
}
