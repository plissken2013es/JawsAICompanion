import { describe, it, expect } from 'vitest'
import {
    ZONES, columnOf, isCorner, TILE_THRESHOLDS,
    RESURFACE_CARDS, ABILITY_IDS, ABILITY_DECK,
    GEAR, PERSONAL_GEAR, COMMON_GEAR_DECK,
    DIE_FACES, CREW_HEALTH, SHARK_HEALTH,
    setupFromSwimmersEaten, STANDALONE_SETUP,
    abilityNameKey, gearNameKey, resurfaceQuoteKey,
} from '~/act2/core/data'
import type { Zone, GearId } from '~/act2/core/types'

const count = <T>(items: readonly T[], value: T): number => items.filter(x => x === value).length

describe('Act II data: the Orca (catalog §2)', () => {
    it('has 8 zones, 1-4 top row and 5-8 bottom row, stern (1/5) to bow (4/8)', () => {
        expect(ZONES).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
        expect(ZONES.map(columnOf)).toEqual([1, 2, 3, 4, 1, 2, 3, 4])
        expect(ZONES.filter(isCorner)).toEqual([1, 4, 5, 8])
    })

    it('tile thresholds: corners 1|3 (damaged 1), middles 2|4 (damaged 2)', () => {
        for (const z of ZONES) {
            const expected = isCorner(z) ? { damage: 1, destroy: 3, destroyDamaged: 1 } : { damage: 2, destroy: 4, destroyDamaged: 2 }
            expect(TILE_THRESHOLDS[z]).toEqual(expected)
        }
    })
})

describe('Act II data: Resurface cards (catalog §3)', () => {
    it('has 16 cards with unique ids R01..R16', () => {
        expect(RESURFACE_CARDS.map(c => c.id)).toEqual(
            Array.from({ length: 16 }, (_, i) => `R${String(i + 1).padStart(2, '0')}`))
    })

    it('has exactly 2 cards per zone [FW 2231479]', () => {
        for (const z of ZONES) expect(RESURFACE_CARDS.filter(c => c.zone === z)).toHaveLength(2)
    })

    it('each zone has one card with Evade 1 and one with Evade 2', () => {
        for (const z of ZONES) {
            expect(RESURFACE_CARDS.filter(c => c.zone === z).map(c => c.evade).sort()).toEqual([1, 2])
        }
    })

    it('corners never give 3 dice [FW 2232371]: Evade 1 -> 2 dice, Evade 2 -> 1 die', () => {
        for (const c of RESURFACE_CARDS.filter(c => isCorner(c.zone))) {
            expect(c.dice).toBe(c.evade === 1 ? 2 : 1)
        }
    })

    it('dice are always 1 to 3', () => {
        for (const c of RESURFACE_CARDS) expect([1, 2, 3]).toContain(c.dice)
    })

    it('exactly 4 cards shake off, one in each middle zone (2, 3, 6, 7)', () => {
        const shaking = RESURFACE_CARDS.filter(c => c.shakeOff).map(c => c.zone).sort()
        expect(shaking).toEqual([2, 3, 6, 7])
    })

    it('"You\'re gonna need a bigger boat" (R03) is the 3-dice card in zone 2 [FW 2232371]', () => {
        expect(RESURFACE_CARDS[2]).toMatchObject({ id: 'R03', zone: 2, dice: 3 })
    })
})

describe('Act II data: Shark abilities (catalog §4)', () => {
    it('has 8 abilities, 2 copies each, 16 cards in total', () => {
        expect(ABILITY_IDS).toHaveLength(8)
        expect(ABILITY_DECK).toHaveLength(16)
        for (const id of ABILITY_IDS) expect(count(ABILITY_DECK, id)).toBe(2)
    })
})

describe('Act II data: gear (catalog §5)', () => {
    it('each crew member has 2 personal cards', () => {
        expect(PERSONAL_GEAR).toEqual({
            brody: ['bat', 'pistol'],
            quint: ['machete', 'flare'],
            hooper: ['hammer', 'rifle'],
        })
    })

    it('the common deck has 16 cards: 5 Ammo, 3 Chum and one of each other', () => {
        expect(COMMON_GEAR_DECK).toHaveLength(16)
        expect(count(COMMON_GEAR_DECK, 'ammo')).toBe(5)
        expect(count(COMMON_GEAR_DECK, 'chum')).toBe(3)
        for (const id of ['sharkCage', 'pistol', 'harpoonGun', 'hook', 'tranqSpear', 'fishingNet', 'fishingPole', 'canister'] as GearId[]) {
            expect(count(COMMON_GEAR_DECK, id)).toBe(1)
        }
    })

    it('22 gear cards in total', () => {
        const personal = Object.values(PERSONAL_GEAR).reduce((n, list) => n + list.length, 0)
        expect(personal + COMMON_GEAR_DECK.length).toBe(22)
    })

    it('types, dice and bonuses match the cards', () => {
        const summary = (id: GearId) => [GEAR[id].kind, GEAR[id].dice, GEAR[id].bonus]
        expect(summary('bat')).toEqual(['melee', 2, 0])
        expect(summary('machete')).toEqual(['melee', 2, 1])
        expect(summary('hammer')).toEqual(['melee', 1, 0])
        expect(summary('hook')).toEqual(['melee', 3, 0])
        expect(summary('tranqSpear')).toEqual(['melee', 3, 0])
        expect(summary('pistol')).toEqual(['firearm', 2, 0])
        expect(summary('rifle')).toEqual(['firearm', 2, 1])
        expect(summary('harpoonGun')).toEqual(['firearm', 3, 1])
        for (const id of ['flare', 'fishingNet', 'fishingPole', 'canister'] as GearId[]) expect(summary(id)).toEqual(['attachable', 0, 0])
        for (const id of ['ammo', 'chum', 'sharkCage'] as GearId[]) expect(summary(id)).toEqual(['accessory', 0, 0])
    })
})

describe('Act II data: dice and health', () => {
    it('one blank face, three 1-hit faces and two 2-hit faces', () => {
        expect(DIE_FACES.slice().sort()).toEqual([0, 1, 1, 1, 2, 2])
    })

    it('a crew member is eliminated at 6 wounds and the shark at 18', () => {
        expect(CREW_HEALTH).toBe(6)
        expect(SHARK_HEALTH).toBe(18)
    })
})

describe('Act II data: setup (catalog §1, rulebook p.7 and p.12)', () => {
    it('swimmers eaten b gives b+1 abilities and 12-b common gear cards', () => {
        for (let b = 0; b <= 9; b++) expect(setupFromSwimmersEaten(b)).toEqual({ abilities: b + 1, commonGear: 12 - b })
    })

    it('matches the rulebook example: 7 eaten -> 8 abilities and 5 gear', () => {
        expect(setupFromSwimmersEaten(7)).toEqual({ abilities: 8, commonGear: 5 })
    })

    it('rejects values outside 0..9', () => {
        expect(() => setupFromSwimmersEaten(-1)).toThrow()
        expect(() => setupFromSwimmersEaten(10)).toThrow()
        expect(() => setupFromSwimmersEaten(2.5)).toThrow()
    })

    it('standalone Act II deals 6 abilities and 7 gear cards', () => {
        expect(STANDALONE_SETUP).toEqual({ abilities: 6, commonGear: 7 })
    })

    it('the decks are big enough for the worst case', () => {
        expect(ABILITY_DECK.length).toBeGreaterThanOrEqual(setupFromSwimmersEaten(9).abilities)
        expect(COMMON_GEAR_DECK.length).toBeGreaterThanOrEqual(setupFromSwimmersEaten(0).commonGear)
    })
})

describe('Act II data: names live in LocaleManager, not in the core', () => {
    it('builds stable locale keys', () => {
        expect(abilityNameKey('rammingSpeed')).toBe('act2.ability.rammingSpeed')
        expect(gearNameKey('fishingNet')).toBe('act2.gear.fishingNet')
        expect(resurfaceQuoteKey('R03')).toBe('act2.resurface.R03')
    })

    it('every zone is a valid Zone value', () => {
        const zones: Zone[] = RESURFACE_CARDS.map(c => c.zone)
        expect(new Set(zones).size).toBe(8)
    })
})
