import { describe, it, expect } from 'vitest'
import { reachableSpaces, canMoveTo, targetableZones, reachableTargets, coveredZones } from '~/act2/core/movement'
import { ALL_OK } from '~/act2/core/adjacency'
import type { Zone, TileState, Space } from '~/act2/core/types'

type Tiles = Record<Zone, TileState>
const tiles = (overrides: Partial<Tiles> = {}): Tiles => Object.assign({}, ALL_OK, overrides)
const boat = (zone: Zone): Space => ({ kind: 'boat', zone })
const water = (zone: Zone): Space => ({ kind: 'water', zone })
const keys = (list: Space[]) => list.map(s => `${s.kind[0]}${s.zone}`).sort()

// Expected sets below are worked out by hand from the rules and the adjacency model (catalog §2).
describe('Act II crew movement: up to 2 spaces [M p.8]', () => {
    it('from an intact middle deck: two steps over decks and water, staying put included', () => {
        expect(keys(reachableSpaces(tiles(), boat(2)))).toEqual(
            ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'w1', 'w2', 'w3', 'w6'])
    })

    it('jumping into the water costs 1, so deck -> water -> water is fine', () => {
        expect(canMoveTo(tiles(), boat(1), water(1))).toBe(true)
        expect(canMoveTo(tiles(), boat(1), water(2))).toBe(true)
        expect(canMoveTo(tiles(), boat(1), water(3))).toBe(false)
    })

    it('climbing back aboard takes both moves [FW 2228838]', () => {
        expect(keys(reachableSpaces(tiles(), water(2)))).toEqual(['b2', 'w1', 'w2', 'w3', 'w4'])
        expect(canMoveTo(tiles(), water(2), boat(2))).toBe(true)
        expect(canMoveTo(tiles(), water(1), boat(2))).toBe(false) // water -> water -> boat would need 3
        expect(canMoveTo(tiles(), boat(1), boat(1))).toBe(true)
    })

    it('deck -> water -> deck is not allowed (climbing needs both moves)', () => {
        expect(canMoveTo(tiles({ 2: 'gone' }), boat(1), boat(3))).toBe(false)
        expect(canMoveTo(tiles(), boat(1), boat(3))).toBe(true) // over the intact deck 2
    })

    it('swims through the water of a destroyed zone', () => {
        expect(canMoveTo(tiles(), boat(1), water(3))).toBe(false)
        expect(canMoveTo(tiles({ 2: 'gone' }), boat(1), water(3))).toBe(true) // 1 -> water 2 -> water 3
    })

    it('stern waters only connect once neither tile is intact', () => {
        expect(canMoveTo(tiles(), water(1), water(5))).toBe(false)
        expect(canMoveTo(tiles({ 1: 'damaged', 5: 'damaged' }), water(1), water(5))).toBe(true)
    })

    it('a space that does not exist goes nowhere', () => {
        expect(reachableSpaces(tiles({ 3: 'gone' }), boat(3))).toEqual([])
        expect(canMoveTo(tiles({ 3: 'gone' }), boat(2), boat(3))).toBe(false)
    })
})

describe('Act II crew targeting from where they stand [M p.9]', () => {
    it('melee / attachable from a deck: only the waters next to it', () => {
        expect(targetableZones(tiles(), boat(2), 'machete')).toEqual([2])
        expect(targetableZones(tiles(), boat(2), 'fishingNet')).toEqual([2])
    })

    it('rulebook adjacency example #2: deck 1 destroyed, deck 3 damaged -> Hooper reaches all three waters', () => {
        expect(targetableZones(tiles({ 1: 'gone', 3: 'damaged' }), boat(2), 'hammer')).toEqual([1, 2, 3])
    })

    it('melee from the water: its own water and the waters next to it', () => {
        expect(targetableZones(tiles(), water(2), 'bat')).toEqual([1, 2, 3])
        expect(targetableZones(tiles(), water(4), 'hook')).toEqual([3, 4])
    })

    it('firearms reach any water', () => {
        expect(targetableZones(tiles(), boat(1), 'rifle')).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    })

    it('accessories are not weapons, and nobody targets from a missing space', () => {
        expect(targetableZones(tiles(), boat(2), 'chum')).toEqual([])
        expect(targetableZones(tiles({ 2: 'gone' }), boat(2), 'machete')).toEqual([])
    })
})

describe('Act II crew threat this round: move, then target', () => {
    it('melee from deck 2 can cover zones 1-7 but not the far bow 8', () => {
        expect(reachableTargets(tiles(), boat(2), 'machete')).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it('melee from the water reaches less: swim 2 (water 3 covers 2-4) or climb aboard and stop', () => {
        expect(reachableTargets(tiles(), water(1), 'bat')).toEqual([1, 2, 3, 4])
    })

    it('firearms cover the whole Orca, accessories nothing', () => {
        expect(reachableTargets(tiles(), water(8), 'pistol')).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
        expect(reachableTargets(tiles(), boat(2), 'sharkCage')).toEqual([])
    })
})

describe('Act II Pistol: may shift its Target Token to an adjacent water after the reveal [C]', () => {
    it('a Pistol token covers its water and the waters next to it', () => {
        expect(coveredZones(tiles(), 'pistol', 2)).toEqual([1, 2, 3])
        expect(coveredZones(tiles(), 'pistol', 1)).toEqual([1, 2])
        expect(coveredZones(tiles({ 1: 'damaged', 5: 'gone' }), 'pistol', 1)).toEqual([1, 2, 5])
    })

    it('any other weapon only covers the water it targets', () => {
        expect(coveredZones(tiles(), 'rifle', 2)).toEqual([2])
        expect(coveredZones(tiles(), 'hammer', 6)).toEqual([6])
    })
})
