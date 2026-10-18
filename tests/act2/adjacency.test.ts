import { describe, it, expect } from 'vitest'
import { adjacentSpaces, areAdjacent, spaceExists, allSpaces, ALL_OK } from '~/act2/core/adjacency'
import type { Zone, TileState, Space, SpaceKind } from '~/act2/core/types'

type Tiles = Record<Zone, TileState>
const ZONES: Zone[] = [1, 2, 3, 4, 5, 6, 7, 8]
const tiles = (overrides: Partial<Tiles> = {}): Tiles => Object.assign({}, ALL_OK, overrides)
const boat = (zone: Zone): Space => ({ kind: 'boat', zone })
const water = (zone: Zone): Space => ({ kind: 'water', zone })
const key = (s: Space) => `${s.kind[0]}${s.zone}`
const keys = (list: Space[]) => list.map(key).sort()

/** Grid neighbours (orthogonal): same row left/right, same column top/bottom. */
const GRID_NEIGHBOURS: Array<[Zone, Zone]> = [[1, 2], [2, 3], [3, 4], [5, 6], [6, 7], [7, 8], [1, 5], [2, 6], [3, 7], [4, 8]]
const isEndColumn = (z: Zone) => z === 1 || z === 4 || z === 5 || z === 8

/**
 * Canon written pair by pair (catalog §2), independent of how the module computes it.
 * For two neighbouring zones a, b with intact/damaged tiles (everything else intact):
 * - same row: boats touch, waters touch, and an intact deck touches the water of a damaged neighbour;
 * - same column: boats touch; only at stern/bow (1-5, 4-8) do the waters touch (both damaged) or an
 *   intact deck touch a damaged partner's water [FW 2229532]; middle columns: decks only.
 */
function expectedPair(a: Zone, b: Zone, sa: TileState, sb: TileState): Set<string> {
    const out = new Set<string>(['boat-boat'])
    const sameRow = Math.abs(a - b) === 1
    if (sameRow || isEndColumn(a)) {
        if (sameRow || (sa === 'damaged' && sb === 'damaged')) out.add('water-water')
        if (sa === 'ok' && sb === 'damaged') out.add('boat-water')
        if (sa === 'damaged' && sb === 'ok') out.add('water-boat')
    }
    return out
}

function actualPair(t: Tiles, a: Zone, b: Zone): Set<string> {
    const out = new Set<string>()
    const kinds: SpaceKind[] = ['boat', 'water']
    for (const ka of kinds) for (const kb of kinds) {
        if (areAdjacent(t, { kind: ka, zone: a }, { kind: kb, zone: b })) out.add(`${ka}-${kb}`)
    }
    return out
}

describe('Act II adjacency: the 40 validated combinations (catalog §2, Adjacency Checker)', () => {
    const states: TileState[] = ['ok', 'damaged']
    for (const [a, b] of GRID_NEIGHBOURS) {
        for (const sa of states) for (const sb of states) {
            it(`zones ${a}-${b} with ${sa}/${sb}`, () => {
                const t = tiles({ [a]: sa, [b]: sb } as Partial<Tiles>)
                expect([...actualPair(t, a, b)].sort()).toEqual([...expectedPair(a, b, sa, sb)].sort())
            })
        }
    }
})

describe('Act II adjacency: stern and bow waters [FW 2229532]', () => {
    for (const [top, bottom] of [[4, 8], [1, 5]] as Array<[Zone, Zone]>) {
        it(`waters ${top}-${bottom} are NOT adjacent while either tile is intact`, () => {
            expect(areAdjacent(tiles(), water(top), water(bottom))).toBe(false)
            expect(areAdjacent(tiles({ [top]: 'damaged' } as Partial<Tiles>), water(top), water(bottom))).toBe(false)
            expect(areAdjacent(tiles({ [bottom]: 'gone' } as Partial<Tiles>), water(top), water(bottom))).toBe(false)
        })
        it(`waters ${top}-${bottom} ARE adjacent once neither tile is intact`, () => {
            expect(areAdjacent(tiles({ [top]: 'damaged', [bottom]: 'damaged' } as Partial<Tiles>), water(top), water(bottom))).toBe(true)
            expect(areAdjacent(tiles({ [top]: 'damaged', [bottom]: 'gone' } as Partial<Tiles>), water(top), water(bottom))).toBe(true)
            expect(areAdjacent(tiles({ [top]: 'gone', [bottom]: 'gone' } as Partial<Tiles>), water(top), water(bottom))).toBe(true)
        })
    }
    it('middle columns never connect their waters across the boat', () => {
        expect(areAdjacent(tiles({ 2: 'gone', 6: 'damaged' }), water(2), water(6))).toBe(false)
        expect(areAdjacent(tiles({ 3: 'damaged', 7: 'damaged' }), water(3), water(7))).toBe(false)
    })
})

describe('Act II adjacency: destroyed tiles [FW 2229437, 2241185]', () => {
    it('a destroyed zone has no boat space, only its own water space', () => {
        const t = tiles({ 2: 'gone' })
        expect(spaceExists(t, boat(2))).toBe(false)
        expect(spaceExists(t, water(2))).toBe(true)
        expect(allSpaces(t)).toHaveLength(15)
    })

    it('BGG example: with B destroyed in "A B C / D E F", its water touches A, C and E', () => {
        // A B C = zones 1 2 3, D E F = 5 6 7; B = zone 2 destroyed
        const t = tiles({ 2: 'gone' })
        const around = keys(adjacentSpaces(t, water(2)))
        expect(around).toEqual(expect.arrayContaining(['b1', 'b3', 'b6']))
        expect(around).toEqual(expect.arrayContaining(['w1', 'w3']))
    })

    it('neighbouring destroyed zones stay separate spaces but touch each other', () => {
        const t = tiles({ 2: 'gone', 3: 'gone', 6: 'gone' })
        expect(areAdjacent(t, water(2), water(3))).toBe(true)
        expect(areAdjacent(t, water(2), water(6))).toBe(true)
        expect(areAdjacent(t, water(3), water(6))).toBe(false) // diagonal
    })

    it('an intact deck touches the water of a destroyed neighbour in its row or column', () => {
        const t = tiles({ 6: 'gone' })
        expect(areAdjacent(t, boat(2), water(6))).toBe(true)
        expect(areAdjacent(t, boat(5), water(6))).toBe(true)
        expect(areAdjacent(t, boat(7), water(6))).toBe(true)
        expect(areAdjacent(t, boat(3), water(6))).toBe(false) // diagonal
    })
})

describe('Act II adjacency: properties over every board state', () => {
    const allStates: Tiles[] = []
    const values: TileState[] = ['ok', 'damaged', 'gone']
    for (let n = 0; n < Math.pow(3, 8); n++) {
        const t = {} as Tiles
        let m = n
        for (const z of ZONES) { t[z] = values[m % 3]; m = Math.floor(m / 3) }
        allStates.push(t)
    }

    it('covers the 6561 possible boards', () => expect(allStates).toHaveLength(6561))

    // One expect per property (collecting violations): millions of expect() calls would take ~16 s.
    it('is symmetric, never diagonal, never self, and only between existing spaces', () => {
        const isNeighbour = (a: Zone, b: Zone) => GRID_NEIGHBOURS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
        const violations: string[] = []
        for (const t of allStates) {
            for (const s of allSpaces(t)) {
                for (const n of adjacentSpaces(t, s)) {
                    const where = `${JSON.stringify(t)} ${key(s)}->${key(n)}`
                    if (!spaceExists(t, n)) violations.push(`missing space ${where}`)
                    if (key(n) === key(s)) violations.push(`self ${where}`)
                    if (n.zone !== s.zone && !isNeighbour(s.zone, n.zone)) violations.push(`diagonal ${where}`)
                    if (!areAdjacent(t, n, s)) violations.push(`asymmetric ${where}`)
                }
            }
        }
        expect(violations.slice(0, 5)).toEqual([])
    })

    it('the boat and water spaces of a zone touch while the tile exists', () => {
        const violations: string[] = []
        for (const t of allStates) for (const z of ZONES) {
            if (t[z] !== 'gone' && !areAdjacent(t, boat(z), water(z))) violations.push(`${JSON.stringify(t)} zone ${z}`)
        }
        expect(violations.slice(0, 5)).toEqual([])
    })

    it('a missing space has no neighbours', () => {
        expect(adjacentSpaces(tiles({ 4: 'gone' }), boat(4))).toEqual([])
    })
})
