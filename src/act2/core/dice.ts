/**
 * Exact dice maths for Act II (SPECS §3.3, §6). No simulation: integer counts over 6^n, turned into
 * probabilities only at the end. A distribution is an array indexed by value (hits or wounds).
 */
import { DIE_FACES } from './data'

export type Dist = readonly number[]

export interface DiceOptions {
    /** Fishing Pole attached to the shark: faces showing 2 hits count as 1 (gear card). */
    readonly fishingPole?: boolean
}

export interface WoundOptions extends DiceOptions {
    /** "+burst" on the weapon card, or Ramming Speed's +2. */
    readonly bonus: number
    /** Effective Evade (card, Hard Target, Fishing Net, Hammer...). Negative is treated as 0. */
    readonly evade: number
}

function faces(opts: DiceOptions): number[] {
    return DIE_FACES.map(f => (opts.fishingPole && f === 2 ? 1 : f))
}

/** How many of the 6^n outcomes give each number of hits. */
export function hitCounts(n: number, opts: DiceOptions = {}): number[] {
    if (!Number.isInteger(n) || n < 0) throw new RangeError(`number of dice must be a non-negative integer, got ${n}`)
    const f = faces(opts)
    const maxFace = Math.max(...f)
    let counts = [1]
    for (let i = 0; i < n; i++) {
        const next = new Array<number>(counts.length + maxFace).fill(0)
        counts.forEach((c, value) => { for (const face of f) next[value + face] += c })
        counts = next
    }
    while (counts.length > 1 && counts[counts.length - 1] === 0) counts.pop()
    return counts
}

export function hitsDistribution(n: number, opts: DiceOptions = {}): Dist {
    const total = Math.pow(6, n)
    return hitCounts(n, opts).map(c => c / total)
}

/** Distribution of value + k (e.g. +2 hits from Ramming Speed). */
export function addHits(dist: Dist, k: number): Dist {
    if (!Number.isInteger(k) || k < 0) throw new RangeError(`can only add a non-negative integer, got ${k}`)
    return new Array<number>(k).fill(0).concat(dist)
}

/** Wounds dealt by n dice: max(0, hits + bonus - evade). */
export function woundsDistribution(n: number, opts: WoundOptions): Dist {
    const evade = Math.max(0, opts.evade)
    const out: number[] = [0]
    hitsDistribution(n, opts).forEach((p, hits) => {
        const w = Math.max(0, hits + opts.bonus - evade)
        while (out.length <= w) out.push(0)
        out[w] += p
    })
    return out
}

/** Roll again once if the first result is 0 (Baseball Bat: "if your attack misses"). */
export function rerollIfZero(dist: Dist): Dist {
    const miss = dist[0] || 0
    return dist.map((p, v) => (v === 0 ? miss * miss : p + miss * p))
}

export function probAtLeast(dist: Dist, k: number): number {
    let p = 0
    for (let v = Math.max(0, k); v < dist.length; v++) p += dist[v]
    return p
}

export function expectedValue(dist: Dist): number {
    return dist.reduce((s, p, v) => s + p * v, 0)
}
