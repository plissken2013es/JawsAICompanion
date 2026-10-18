/**
 * D1, where to resurface (SPECS §4.3): a guessing game. The crew place their Target Tokens before
 * they know the choice, so the shark plays a mixed strategy over A, B, C. Fictitious play: the crew
 * best-respond (each member separately, so the 3³ allocations need no enumeration) to the shark's
 * average mix, and the shark answers with a softmax of its utility against the crew's average aim.
 * Then: pointless options are dropped, every remaining option keeps a floor, and the RNG draws.
 */
import type { ResurfaceCard } from '../types'
import { RESURFACE_CARDS } from '../data'
import { GameState, CREW_IDS, deepFreeze } from '../state'
import { coveredZones } from '../movement'
import { createRng } from '../rng'
import { AiParams } from './params'
import { evaluate } from './evaluate'
import { crewThreats, weaponWounds } from './threat'
import { OffenseEstimate, expectedAttack } from './offense'

export interface ResurfaceOptions {
    /** Rounds in a row without attacking (default: read from the log). */
    readonly stall?: number
    /** The shark plans to play Hard Target. */
    readonly hardTarget?: boolean
}

export interface ResurfaceAnalysis {
    readonly offense: readonly OffenseEstimate[]
    /** Expected wounds the shark takes on each option, given where the crew are expected to aim. */
    readonly damage: readonly number[]
    readonly utility: readonly number[]
    readonly probs: readonly number[]
}

const EPS = 1e-12

/** Rounds in a row, up to the last one, in which the shark did not attack (D-4). */
export function stallRounds(state: GameState): number {
    let n = 0
    for (let r = state.round - 1; r >= 1; r--) {
        if (!state.log.some(e => e.round === r && e.event === 'sharkHolds')) break
        n++
    }
    return n
}

function softmax(values: readonly number[], temperature: number, allowed: readonly boolean[]): number[] {
    const top = Math.max(...values.filter((_, i) => allowed[i]))
    const w = values.map((v, i) => (allowed[i] ? Math.exp((v - top) / temperature) : 0))
    const total = w.reduce((s, x) => s + x, 0)
    return w.map(x => x / total)
}

const argmax = (xs: readonly number[]): number => xs.reduce((best, x, i) => (x > xs[best] + EPS ? i : best), 0)

export function analyzeResurface(state: GameState, p: AiParams, opts: ResurfaceOptions = {}): ResurfaceAnalysis {
    if (state.turn.step !== 'choose') throw new RangeError('the shark chooses its Resurface option in step 2')
    const cards: ResurfaceCard[] = state.turn.options.map(id => RESURFACE_CARDS.filter(c => c.id === id)[0])
    const n = cards.length
    const hardTarget = !!opts.hardTarget
    const stall = opts.stall === undefined ? stallRounds(state) : opts.stall
    const riskWeight = Math.pow(p.stallFactor, stall)

    const offense = cards.map(c => expectedAttack(state, c, p))

    // dmg[c][j][o]: wounds crew member c deals aiming at option j's zone when the shark picks o.
    const living = CREW_IDS.filter(id => state.crew[id].space)
    const dmg = living.map(id => cards.map(aimCard => {
        const best = crewThreats(state, aimCard, { hardTarget }, p).filter(t => t.crew === id)[0]
        const weapon = best && best.weapon
        if (!weapon) return cards.map(() => 0)
        const covered = coveredZones(state.tiles, weapon, aimCard.zone)
        return cards.map(c => (covered.indexOf(c.zone) >= 0 ? weaponWounds(state, weapon, c, hardTarget, p) : 0))
    }))

    const base = evaluate(state, p)
    const costOf = (wounds: number): number => {
        if (wounds <= 0) return 0
        const hurt = Object.assign({}, state, { shark: Object.assign({}, state.shark, { wounds: state.shark.wounds + wounds }) })
        return riskWeight * (base - evaluate(hurt, p))
    }

    const counts = living.map(() => cards.map(() => 0))
    const sigmaSum = cards.map(() => 0)
    let sigma = cards.map(() => 1 / n)
    const damageUnder = (mix: number[][]): number[] =>
        cards.map((_, o) => living.reduce((s, _c, ci) => s + mix[ci].reduce((t, w, j) => t + w * dmg[ci][j][o], 0), 0))
    const all = cards.map(() => true)
    let damage = cards.map(() => 0)

    for (let t = 1; t <= p.fpIterations; t++) {
        sigma.forEach((x, o) => { sigmaSum[o] += x })
        const avg = sigmaSum.map(x => x / t)
        living.forEach((_, ci) => {
            counts[ci][argmax(cards.map((_c, j) => cards.reduce((s, _o, o) => s + avg[o] * dmg[ci][j][o], 0)))]++
        })
        damage = damageUnder(counts.map(row => row.map(k => k / t)))
        sigma = softmax(cards.map((_, o) => offense[o].total - costOf(damage[o])), p.temperature, all)
    }

    const utility = cards.map((_, o) => offense[o].total - costOf(damage[o]))

    // Never an option with nothing to attack if another has a target at no more risk (§4.3.6).
    const allowed = cards.map((_, o) => !(offense[o].target === null &&
        cards.some((_c, q) => offense[q].target !== null && damage[q] <= damage[o] + EPS)))
    const k = allowed.filter(Boolean).length
    const soft = softmax(utility, p.temperature, allowed)
    const probs = soft.map((x, o) => (allowed[o] ? p.pMin + (1 - k * p.pMin) * x : 0))

    return { offense, damage, utility, probs }
}

/** Draws the option with the game's RNG. The caller then plays it with round.sharkChoose. */
export function chooseResurface(state: GameState, p: AiParams, opts: ResurfaceOptions = {},
    analysis?: ResurfaceAnalysis): { choice: number; probs: readonly number[]; state: GameState } {
    const { probs } = analysis || analyzeResurface(state, p, opts)
    const rng = createRng(state.rngState)
    const r = rng.next()
    let acc = 0
    let choice = probs.length - 1
    for (let i = 0; i < probs.length; i++) {
        acc += probs[i]
        if (r < acc && probs[i] > 0) { choice = i; break }
    }
    while (probs[choice] === 0) choice--
    return { choice, probs, state: deepFreeze(Object.assign({}, state, { rngState: rng.state() })) }
}
