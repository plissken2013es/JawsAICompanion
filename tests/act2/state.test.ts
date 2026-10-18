import { describe, it, expect } from 'vitest'
import { setupGame, SetupInput } from '~/act2/core/setup'
import { serialize, deserialize, STATE_VERSION, CREW_IDS } from '~/act2/core/state'
import { ABILITY_IDS, PERSONAL_GEAR } from '~/act2/core/data'
import { ALL_OK } from '~/act2/core/adjacency'
import { createRng } from '~/act2/core/rng'
import type { GearId } from '~/act2/core/types'

const count = <T>(items: readonly T[], value: T): number => items.filter(x => x === value).length

/** 7 swimmers eaten (rulebook example): 8 abilities, 5 common gear cards. */
const base = (overrides: Partial<SetupInput> = {}): SetupInput => Object.assign({
    seed: 42,
    swimmersEaten: 7,
    commonGear: { brody: ['ammo', 'sharkCage'], quint: ['harpoonGun', 'chum'], hooper: ['ammo'] },
    positions: { brody: 2, quint: 6, hooper: 3 },
}, overrides)

const STANDALONE_GEAR: SetupInput['commonGear'] = {
    brody: ['ammo', 'ammo', 'chum'], quint: ['hook', 'fishingNet'], hooper: ['canister', 'tranqSpear'],
}

describe('Act II setup: how many cards (SPECS §3.2)', () => {
    it('7 swimmers eaten: 8 abilities and 5 common gear (rulebook example)', () => {
        const s = setupGame(base())
        expect(s.shark.hand).toHaveLength(8)
        expect(s.setup).toEqual({ swimmersEaten: 7, abilities: 8, commonGear: 5 })
    })

    it('standalone Act II: 6 abilities and 7 common gear', () => {
        const s = setupGame(base({ swimmersEaten: null, commonGear: STANDALONE_GEAR }))
        expect(s.shark.hand).toHaveLength(6)
        expect(s.setup).toEqual({ swimmersEaten: null, abilities: 6, commonGear: 7 })
    })

    it('the 0-9 range: 0 eaten -> 1 ability, 9 eaten -> 10 abilities', () => {
        const twelve: GearId[] = ['ammo', 'ammo', 'ammo', 'ammo', 'ammo', 'chum', 'chum', 'chum', 'sharkCage', 'pistol', 'hook', 'canister']
        expect(setupGame(base({ swimmersEaten: 0, commonGear: { brody: twelve } })).shark.hand).toHaveLength(1)
        expect(setupGame(base({ swimmersEaten: 9, commonGear: { quint: ['chum', 'ammo', 'hook'] } })).shark.hand).toHaveLength(10)
        expect(() => setupGame(base({ swimmersEaten: 10 }))).toThrow()
    })
})

describe('Act II setup: the hidden ability hand (D-5)', () => {
    it('is drawn from the 16-card deck: at most 2 of each ability', () => {
        for (let seed = 0; seed < 50; seed++) {
            const hand = setupGame(base({ seed, swimmersEaten: 9, commonGear: { quint: ['chum', 'ammo', 'hook'] } })).shark.hand
            for (const id of hand) expect(ABILITY_IDS).toContain(id)
            for (const id of ABILITY_IDS) expect(count(hand, id)).toBeLessThanOrEqual(2)
        }
    })

    it('same seed, same hand; different seeds give different hands', () => {
        expect(setupGame(base()).shark.hand).toEqual(setupGame(base()).shark.hand)
        const hands = new Set<string>()
        for (let seed = 0; seed < 20; seed++) hands.add(setupGame(base({ seed })).shark.hand.slice().sort().join())
        expect(hands.size).toBeGreaterThan(1)
    })

    it('saves the RNG where the draw left it, so a resumed game continues the same sequence', () => {
        const s = setupGame(base())
        const direct = createRng(42)
        direct.shuffle(new Array(16).fill(0))
        expect(createRng(s.rngState).next()).toBe(direct.next())
    })

    it('the log says how many abilities the shark has, never which ones', () => {
        const s = setupGame(base())
        const text = JSON.stringify(s.log)
        expect(s.log[0]).toEqual({ round: 0, event: 'setup', args: [8, 5] })
        for (const id of ABILITY_IDS) expect(text).not.toContain(id)
    })
})

describe('Act II setup: crew', () => {
    it('everyone gets their personal gear automatically, plus the common cards handed to them', () => {
        const s = setupGame(base())
        expect(s.crew.brody.gear).toEqual(PERSONAL_GEAR.brody.concat(['ammo', 'sharkCage']))
        expect(s.crew.quint.gear).toEqual(PERSONAL_GEAR.quint.concat(['harpoonGun', 'chum']))
        expect(s.crew.hooper.gear).toEqual(PERSONAL_GEAR.hooper.concat(['ammo']))
    })

    it('a crew member with no common cards keeps just the personal ones', () => {
        const s = setupGame(base({ commonGear: { brody: ['ammo', 'ammo', 'chum', 'hook', 'pistol'] } }))
        expect(s.crew.hooper.gear).toEqual(PERSONAL_GEAR.hooper)
    })

    it('rejects a common gear hand of the wrong size', () => {
        expect(() => setupGame(base({ commonGear: { brody: ['ammo'] } }))).toThrow()
        expect(() => setupGame(base({ commonGear: { brody: ['ammo', 'ammo', 'ammo', 'chum', 'chum', 'hook'] } }))).toThrow()
    })

    it('rejects cards the common deck does not have (or not that many)', () => {
        expect(() => setupGame(base({ commonGear: { brody: ['sharkCage', 'sharkCage', 'ammo', 'ammo', 'ammo'] } }))).toThrow()
        expect(() => setupGame(base({ commonGear: { brody: ['bat', 'ammo', 'ammo', 'ammo', 'chum'] } }))).toThrow()
        expect(() => setupGame(base({ commonGear: { brody: ['chum', 'chum', 'chum', 'chum', 'ammo'] } }))).toThrow()
    })

    it('starts on boat spaces of the chosen zones, with no wounds', () => {
        const s = setupGame(base())
        expect(s.crew.brody.space).toEqual({ kind: 'boat', zone: 2 })
        expect(s.crew.quint.space).toEqual({ kind: 'boat', zone: 6 })
        expect(s.crew.hooper.space).toEqual({ kind: 'boat', zone: 3 })
        for (const id of CREW_IDS) expect(s.crew[id]).toEqual(expect.objectContaining({ wounds: 0, caged: false }))
    })

    it('two crew members may share a space', () => {
        expect(setupGame(base({ positions: { brody: 4, quint: 4, hooper: 4 } })).crew.quint.space).toEqual({ kind: 'boat', zone: 4 })
    })

    it('rejects a zone outside 1-8', () => {
        expect(() => setupGame(base({ positions: { brody: 9, quint: 6, hooper: 3 } as unknown as SetupInput['positions'] }))).toThrow()
    })
})

describe('Act II setup: the rest of the starting state', () => {
    it('intact Orca, round 1, unwounded shark not on the board yet, nothing attached or discarded', () => {
        const s = setupGame(base())
        expect(s.version).toBe(STATE_VERSION)
        expect(s.round).toBe(1)
        expect(s.tiles).toEqual(ALL_OK)
        expect(s.shark).toEqual(expect.objectContaining({ wounds: 0, space: null, attached: [], played: [], tranquilized: false, ability: null, abilityUsed: false }))
        expect(s.resurfaceDiscard).toEqual([])
    })

    it('the state is frozen, and the input is left untouched', () => {
        const input = base()
        const before = JSON.stringify(input)
        const s = setupGame(input)
        expect(JSON.stringify(input)).toBe(before)
        expect(Object.isFrozen(s)).toBe(true)
        expect(Object.isFrozen(s.crew.brody.gear)).toBe(true)
        expect(Object.isFrozen(s.shark.hand)).toBe(true)
        expect(Object.isFrozen(s.tiles)).toBe(true)
    })
})

describe('Act II state: saving and loading', () => {
    it('serialize -> deserialize gives the same state', () => {
        const s = setupGame(base())
        const back = deserialize(serialize(s))
        expect(back).toEqual(s)
        expect(Object.isFrozen(back.crew.quint)).toBe(true)
    })

    it('the saved text carries the format version', () => {
        expect(JSON.parse(serialize(setupGame(base()))).version).toBe(STATE_VERSION)
    })

    it('refuses another format version', () => {
        const saved = JSON.parse(serialize(setupGame(base())))
        saved.version = STATE_VERSION + 1
        expect(() => deserialize(JSON.stringify(saved))).toThrow(/version/)
    })

    it('refuses text that is not a saved game', () => {
        expect(() => deserialize('not json')).toThrow()
        expect(() => deserialize('null')).toThrow()
        expect(() => deserialize(JSON.stringify({ version: STATE_VERSION }))).toThrow()
    })
})
