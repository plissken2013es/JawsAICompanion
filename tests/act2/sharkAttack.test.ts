import { describe, it, expect } from 'vitest'
import {
    sharkTargets, mainAttackDice, bonusAttackDice, bonusAttackTargets, attackHits,
    attackBoat, attackCrew, bonusAttacks, playSharkCage, woundCrew, rollDice,
} from '~/act2/core/sharkAttack'
import { createRng } from '~/act2/core/rng'
import { R01, R02, R03, R04, boat, water, game, board } from './helpers'

describe('Act II shark targets [M p.10]', () => {
    it('a boat space next to its water, or a crew member in the water of its space or next to it', () => {
        const s = board({ shark: 2, at: { quint: water(3), brody: water(4), hooper: boat(2) } })
        expect(sharkTargets(s)).toEqual([{ kind: 'boat', zone: 2 }, { kind: 'crew', crew: 'quint' }])
    })

    it('never a crew member on the boat, never one far away', () => {
        const s = board({ shark: 2, at: { brody: water(4) } })
        expect(sharkTargets(s).filter(t => t.kind === 'crew')).toEqual([])
    })

    it('a damaged tile lets the shark reach the intact decks next to it', () => {
        expect(sharkTargets(board({ shark: 2, tiles: { 2: 'damaged' } }))).toEqual(
            [{ kind: 'boat', zone: 1 }, { kind: 'boat', zone: 2 }, { kind: 'boat', zone: 3 }])
    })

    it('an eliminated crew member is not a target; nothing before the shark resurfaces', () => {
        const s = board({ shark: 2, at: { quint: water(2) } })
        const dead = Object.assign({}, s, { crew: Object.assign({}, s.crew, { quint: Object.assign({}, s.crew.quint, { space: null }) }) })
        expect(sharkTargets(dead)).toEqual([{ kind: 'boat', zone: 2 }])
        expect(sharkTargets(game())).toEqual([])
    })
})

describe('Act II shark dice', () => {
    it('main attack: the card dice, or 1 after a Tranq Spear wound [C]', () => {
        expect(mainAttackDice(board({ shark: 2 }), R03)).toBe(3)
        expect(mainAttackDice(board({ shark: 2, tranquilized: true }), R03)).toBe(1)
    })

    it('bonus attacks: 1 die; the unofficial variant uses the card dice (D-3); tranquilized always 1', () => {
        expect(bonusAttackDice(board({ shark: 2 }), R03, false)).toBe(1)
        expect(bonusAttackDice(board({ shark: 2 }), R03, true)).toBe(3)
        expect(bonusAttackDice(board({ shark: 2, tranquilized: true }), R03, true)).toBe(1)
    })

    it('hits add up the faces; with the Fishing Pole attached a 2 counts as 1 [C]', () => {
        expect(attackHits([2, 2, 1], [])).toBe(5)
        expect(attackHits([2, 2, 1], ['fishingPole'])).toBe(3)
        expect(attackHits([2, 0], [], 2)).toBe(4) // Ramming Speed's +2
    })

    it('the app can roll them itself (D-1): seeded, and the state remembers where the RNG is', () => {
        const s0 = board({ shark: 2 })
        const a = rollDice(s0, 3)
        expect(a.faces).toHaveLength(3)
        for (const f of a.faces) expect([0, 1, 2]).toContain(f)
        expect(rollDice(s0, 3).faces).toEqual(a.faces)
        expect(a.state.rngState).not.toBe(s0.rngState)
        expect(a.state.rngState).toBe((() => { const r = createRng(s0.rngState); r.next(); r.next(); r.next(); return r.state() })())
    })
})

describe('Act II shark attacks the boat: thresholds [M p.10, C]', () => {
    it('corner tile (1|3, damaged 1): 0 misses, 1 damages, 3 destroys', () => {
        expect(attackBoat(board({ shark: 1 }), R02, 1, [0, 0]).tile).toBe('ok')
        expect(attackBoat(board({ shark: 1 }), R02, 1, [1, 0]).tile).toBe('damaged')
        expect(attackBoat(board({ shark: 1 }), R02, 1, [2, 1]).tile).toBe('gone')
        expect(attackBoat(board({ shark: 1, tiles: { 1: 'damaged' } }), R01, 1, [1]).tile).toBe('gone')
    })

    it('middle tile (2|4, damaged 2)', () => {
        expect(attackBoat(board({ shark: 2 }), R03, 2, [1, 0, 0]).tile).toBe('ok')
        expect(attackBoat(board({ shark: 2 }), R03, 2, [1, 1, 0]).tile).toBe('damaged')
        expect(attackBoat(board({ shark: 2 }), R03, 2, [2, 1, 1]).tile).toBe('gone')
        expect(attackBoat(board({ shark: 2, tiles: { 2: 'damaged' } }), R03, 2, [1, 0, 0]).tile).toBe('damaged')
        expect(attackBoat(board({ shark: 2, tiles: { 2: 'damaged' } }), R03, 2, [1, 1, 0]).tile).toBe('gone')
    })

    it('the new tile state is in the game state, and the old state is untouched', () => {
        const s0 = board({ shark: 2 })
        const r = attackBoat(s0, R04, 2, [2, 0])
        expect(r.state.tiles[2]).toBe('damaged')
        expect(s0.tiles[2]).toBe('ok')
        expect(r.hits).toBe(2)
        expect(r.state.log[r.state.log.length - 1]).toEqual({ round: 1, event: 'sharkAttackBoat', args: [2, 2, 'damaged'] })
    })

    it('crew on a space that is damaged or destroyed fall into its water [M p.10, thread 2370787]', () => {
        const damaged = attackBoat(board({ shark: 2, at: { hooper: boat(2), brody: boat(2) } }), R04, 2, [2, 0])
        expect(damaged.fell).toEqual(['brody', 'hooper'])
        expect(damaged.state.crew.hooper.space).toEqual(water(2))
        const gone = attackBoat(board({ shark: 2, at: { hooper: boat(2) } }), R03, 2, [2, 2, 0])
        expect(gone.state.crew.hooper.space).toEqual(water(2))
    })

    it('a miss moves nobody', () => {
        const r = attackBoat(board({ shark: 2, at: { hooper: boat(2) } }), R04, 2, [1, 0])
        expect(r.fell).toEqual([])
        expect(r.state.crew.hooper.space).toEqual(boat(2))
    })

    it('Ramming Speed\'s +2 reaches the main attack', () => {
        expect(attackBoat(board({ shark: 2 }), R04, 2, [2, 0], 2).tile).toBe('gone')
    })

    it('refuses an illegal attack: a deck not next to its water, a missing deck, the wrong number of dice', () => {
        expect(() => attackBoat(board({ shark: 2 }), R04, 3, [2, 2])).toThrow()
        expect(() => attackBoat(board({ shark: 2, tiles: { 2: 'gone' } }), R04, 2, [2, 2])).toThrow()
        expect(() => attackBoat(board({ shark: 2 }), R04, 2, [2])).toThrow()
        expect(() => attackBoat(board({ shark: 2, tranquilized: true }), R04, 2, [2, 2])).toThrow()
        expect(() => attackBoat(game(), R04, 2, [2, 2])).toThrow()
    })
})

describe('Act II shark attacks a crew member in the water [M p.10]', () => {
    it('one wound per hit', () => {
        const r = attackCrew(board({ shark: 2, at: { quint: water(3) } }), R04, 'quint', [2, 1])
        expect(r.crew.quint.wounds).toBe(3)
        expect(r.log[r.log.length - 1]).toEqual({ round: 1, event: 'sharkAttackCrew', args: ['quint', 3] })
    })

    it('the Fishing Pole softens it', () => {
        expect(attackCrew(board({ shark: 2, at: { quint: water(2) }, attached: ['fishingPole'] }), R04, 'quint', [2, 2]).crew.quint.wounds).toBe(2)
    })

    it('refuses a crew member on the boat or out of reach', () => {
        expect(() => attackCrew(board({ shark: 2 }), R04, 'brody', [2, 2])).toThrow()
        expect(() => attackCrew(board({ shark: 2, at: { brody: water(4) } }), R04, 'brody', [2, 2])).toThrow()
    })

    it('6 wounds eliminate: off the board, gear discarded; what they attached stays on the shark [M p.11]', () => {
        const r = attackCrew(board({ shark: 2, at: { quint: water(2) }, wounds: { quint: 4 }, attached: ['flare'] }), R04, 'quint', [2, 2])
        expect(r.crew.quint).toEqual(expect.objectContaining({ wounds: 6, space: null, gear: [] }))
        expect(r.shark.attached).toEqual(['flare'])
    })
})

describe('Act II Shark Cage: no wounds this round for whoever plays it [C]', () => {
    it('is discarded and protects from every attack of the round', () => {
        const s = playSharkCage(board({ shark: 2, at: { brody: water(2) } }), 'brody')
        expect(s.crew.brody.caged).toBe(true)
        expect(s.crew.brody.gear).not.toContain('sharkCage')
        const hit = attackCrew(s, R04, 'brody', [2, 2])
        expect(hit.crew.brody.wounds).toBe(0)
        expect(bonusAttacks(hit, R04, false, { brody: [2] }).crew.brody.wounds).toBe(0)
        expect(woundCrew(hit, 'brody', 1).crew.brody.wounds).toBe(0)
    })

    it('only someone holding it can play it', () => {
        expect(() => playSharkCage(board({ shark: 2 }), 'quint')).toThrow()
    })
})

describe('Act II bonus attacks: 1 die against each crew member in the water nearby [M p.11]', () => {
    it('targets everyone in the water of its space or next to it, main target included', () => {
        const s = board({ shark: 2, at: { quint: water(2), brody: water(3), hooper: water(4) } })
        expect(bonusAttackTargets(s)).toEqual(['brody', 'quint'])
    })

    it('someone knocked into the water by the main attack is a target too', () => {
        const r = attackBoat(board({ shark: 2, at: { hooper: boat(2), brody: boat(1) } }), R04, 2, [2, 0])
        expect(bonusAttackTargets(r.state)).toEqual(['hooper'])
    })

    it('one roll per target, each wounding separately', () => {
        const s = board({ shark: 2, at: { quint: water(2), brody: water(3) } })
        const after = bonusAttacks(s, R04, false, { brody: [1], quint: [2] })
        expect(after.crew.brody.wounds).toBe(1)
        expect(after.crew.quint.wounds).toBe(2)
    })

    it('the unofficial variant rolls the card dice (D-3)', () => {
        const s = board({ shark: 2, at: { quint: water(2) } })
        expect(bonusAttacks(s, R03, true, { quint: [2, 2, 1] }).crew.quint.wounds).toBe(5)
        expect(() => bonusAttacks(s, R03, false, { quint: [2, 2, 1] })).toThrow()
    })

    it('refuses rolls against someone who is not a target', () => {
        expect(() => bonusAttacks(board({ shark: 2 }), R04, false, { brody: [1] })).toThrow()
    })
})
