import { describe, it, expect } from 'vitest'
import { createRng } from '~/act2/core/rng'

const take = (n: number, f: () => number): number[] => Array.from({ length: n }, f)

describe('Act II RNG (mulberry32)', () => {
    it('is deterministic: same seed, same sequence', () => {
        const a = createRng(1234)
        const b = createRng(1234)
        expect(take(50, () => a.next())).toEqual(take(50, () => b.next()))
    })

    it('different seeds give different sequences', () => {
        const a = createRng(1)
        const b = createRng(2)
        expect(take(10, () => a.next())).not.toEqual(take(10, () => b.next()))
    })

    it('next() stays in [0, 1)', () => {
        const r = createRng(99)
        for (const x of take(10000, () => r.next())) {
            expect(x).toBeGreaterThanOrEqual(0)
            expect(x).toBeLessThan(1)
        }
    })

    it('int(min, max) is inclusive and reaches both ends', () => {
        const r = createRng(7)
        const seen = new Set(take(2000, () => r.int(1, 6)))
        expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('int(min, max) rejects an empty range', () => {
        expect(() => createRng(7).int(3, 2)).toThrow()
    })

    it('pick() returns an element and rejects an empty array', () => {
        const r = createRng(5)
        const items = ['a', 'b', 'c'] as const
        for (let i = 0; i < 100; i++) expect(items).toContain(r.pick(items))
        expect(() => r.pick([])).toThrow()
    })

    it('shuffle() returns a reproducible permutation without mutating the input', () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8]
        const copy = input.slice()
        const s1 = createRng(42).shuffle(input)
        const s2 = createRng(42).shuffle(input)
        expect(s1).toEqual(s2)
        expect(s1.slice().sort((x, y) => x - y)).toEqual(input)
        expect(input).toEqual(copy)
    })

    it('state() lets a saved game resume the exact same sequence', () => {
        const r = createRng(2026)
        take(17, () => r.next())
        const resumed = createRng(r.state())
        expect(take(20, () => resumed.next())).toEqual(take(20, () => r.next()))
    })
})
