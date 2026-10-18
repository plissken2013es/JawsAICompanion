/**
 * Seedable RNG for the Act II core (SPECS §6). mulberry32, the same generator used across the
 * lab (40_Scavenger_remake/src/core/rng.ts). Its whole state is one 32-bit integer, so a saved
 * game stores `state()` and resumes with `createRng(state)` exactly where it left off.
 */
export interface Rng {
    /** Float in [0, 1). */
    next(): number
    /** Integer in [min, max], both inclusive. Throws if max < min. */
    int(min: number, max: number): number
    /** A random element. Throws on an empty array. */
    pick<T>(items: readonly T[]): T
    /** A shuffled copy (Fisher-Yates); the input is not modified. */
    shuffle<T>(items: readonly T[]): T[]
    /** Current internal state, to resume the same sequence later. */
    state(): number
}

export function createRng(seed: number): Rng {
    let a = seed >>> 0

    const next = (): number => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    const int = (min: number, max: number): number => {
        if (max < min) throw new RangeError(`empty range [${min}, ${max}]`)
        return min + Math.floor(next() * (max - min + 1))
    }

    return {
        next,
        int,
        pick<T>(items: readonly T[]): T {
            if (items.length === 0) throw new RangeError('pick() on an empty array')
            return items[int(0, items.length - 1)]
        },
        shuffle<T>(items: readonly T[]): T[] {
            const out = items.slice()
            for (let i = out.length - 1; i > 0; i--) {
                const j = int(0, i)
                const tmp = out[i]
                out[i] = out[j]
                out[j] = tmp
            }
            return out
        },
        state: () => a,
    }
}
