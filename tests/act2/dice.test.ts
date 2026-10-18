import { describe, it, expect } from 'vitest'
import {
    hitCounts, hitsDistribution, woundsDistribution, rerollIfZero,
    probAtLeast, expectedValue, addHits,
} from '~/act2/core/dice'

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 12)
const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0)

// Expected values below are worked out by hand from the die faces [0,1,1,1,2,2].
describe('Act II dice: exact hit counts (die faces 0,1,1,1,2,2)', () => {
    it('0 dice: always 0 hits', () => expect(hitCounts(0)).toEqual([1]))
    it('1 die: 1 blank, 3 ones, 2 twos', () => expect(hitCounts(1)).toEqual([1, 3, 2]))
    it('2 dice over 36 outcomes', () => expect(hitCounts(2)).toEqual([1, 6, 13, 12, 4]))
    it('3 dice over 216 outcomes', () => expect(hitCounts(3)).toEqual([1, 9, 33, 63, 66, 36, 8]))
    it('with the Fishing Pole attached, 2-hit faces count as 1', () => {
        expect(hitCounts(1, { fishingPole: true })).toEqual([1, 5])
        expect(hitCounts(2, { fishingPole: true })).toEqual([1, 10, 25])
    })
    it('rejects a negative or fractional number of dice', () => {
        expect(() => hitCounts(-1)).toThrow()
        expect(() => hitCounts(1.5)).toThrow()
    })
})

describe('Act II dice: probabilities', () => {
    it('distributions sum to 1 and the mean is n x 7/6', () => {
        for (const n of [1, 2, 3, 4]) {
            const d = hitsDistribution(n)
            close(sum(d), 1)
            close(expectedValue(d), n * 7 / 6)
        }
    })

    it('the Fishing Pole lowers the mean to 5/6 per die', () => {
        close(expectedValue(hitsDistribution(3, { fishingPole: true })), 3 * 5 / 6)
    })

    it('probAtLeast: 2 dice reach 3 hits in 16 of 36 outcomes', () => {
        close(probAtLeast(hitsDistribution(2), 3), 16 / 36)
        close(probAtLeast(hitsDistribution(2), 0), 1)
        close(probAtLeast(hitsDistribution(2), 5), 0)
    })

    it('addHits shifts a distribution (Ramming Speed +2)', () => {
        const d = addHits(hitsDistribution(1), 2)
        expect(d.length).toBe(5)
        close(d[0] + d[1], 0)
        close(d[2], 1 / 6)
        close(d[4], 2 / 6)
    })
})

describe('Act II dice: wounds = max(0, hits + bonus - evade)', () => {
    it('Rifle (2 dice +1) against Evade 2', () => {
        const w = woundsDistribution(2, { bonus: 1, evade: 2 })
        close(w[0], 7 / 36)   // 0 or 1 hit
        close(w[1], 13 / 36)  // 2 hits
        close(w[2], 12 / 36)  // 3 hits
        close(w[3], 4 / 36)   // 4 hits
        close(sum(w), 1)
    })

    it('Hammer: the shark Evade is 0, so it wounds unless the die is blank (5 in 6)', () => {
        const w = woundsDistribution(1, { bonus: 0, evade: 0 })
        close(1 - w[0], 5 / 6)
    })

    it('Hard Target (Evade 3) against 2 dice +1', () => {
        const w = woundsDistribution(2, { bonus: 1, evade: 3 })
        close(w[0], 20 / 36) // 0, 1 or 2 hits
        close(w[2], 4 / 36)  // 4 hits + 1 - 3
    })

    it('Evade below zero is treated as zero (Fishing Net on Evade 0)', () => {
        expect(woundsDistribution(1, { bonus: 0, evade: -1 })).toEqual(woundsDistribution(1, { bonus: 0, evade: 0 }))
    })

    it('the Fishing Pole option reaches the shark attack too', () => {
        const w = woundsDistribution(2, { bonus: 0, evade: 0, fishingPole: true })
        close(w[2], 25 / 36)
    })
})

describe('Act II dice: reroll once if the attack misses (Baseball Bat)', () => {
    it('the chance of missing twice is the square of missing once', () => {
        const once = woundsDistribution(2, { bonus: 0, evade: 2 })
        const bat = rerollIfZero(once)
        close(once[0], 20 / 36)
        close(bat[0], (20 / 36) * (20 / 36))
        close(sum(bat), 1)
    })

    it('a hit on the first roll is kept as it is', () => {
        const once = woundsDistribution(2, { bonus: 0, evade: 2 })
        const bat = rerollIfZero(once)
        close(bat[2], once[2] + once[0] * once[2])
    })
})
