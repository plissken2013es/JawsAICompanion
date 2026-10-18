import { describe, it, expect } from 'vitest'
import { resolveCrewAttack, applyCrewAttack, effectiveEvade, needsReroll, CrewAttackInput } from '~/act2/core/crewAttack'
import { setupGame } from '~/act2/core/setup'
import type { GearId } from '~/act2/core/types'

const attack = (overrides: Partial<CrewAttackInput>): CrewAttackInput => Object.assign({
    weapon: 'machete' as GearId,
    gear: ['machete', 'flare'] as GearId[],
    rolls: [[1, 1]],
    evade: 1,
    hardTarget: false,
    attached: [] as GearId[],
}, overrides)

const game = () => setupGame({
    seed: 1,
    swimmersEaten: 7,
    commonGear: { brody: ['ammo', 'sharkCage'], quint: ['harpoonGun', 'chum'], hooper: ['canister'] },
    positions: { brody: 2, quint: 6, hooper: 3 },
})

describe('Act II effective Evade [C]', () => {
    it('is the card value, 3 with Hard Target, minus 1 with the Fishing Net attached (after Hard Target)', () => {
        expect(effectiveEvade('machete', 2, false, [])).toBe(2)
        expect(effectiveEvade('machete', 1, true, [])).toBe(3)
        expect(effectiveEvade('machete', 2, false, ['fishingNet'])).toBe(1)
        expect(effectiveEvade('machete', 1, true, ['fishingNet'])).toBe(2)
    })

    it('never below 0, and 0 against the Hammer whatever else', () => {
        expect(effectiveEvade('machete', 1, false, ['fishingNet', 'flare'])).toBe(0)
        expect(effectiveEvade('hammer', 2, true, [])).toBe(0)
    })
})

describe('Act II crew attack: wounds = max(0, hits + bonus - Evade) [M p.10]', () => {
    it('Machete (2 dice +1) rolling 2 + 1 against Evade 2: 2 wounds', () => {
        const r = resolveCrewAttack(attack({ rolls: [[2, 1]], evade: 2 }))
        expect(r.hits).toBe(3)
        expect(r.wounds).toBe(2)
    })

    it('a roll below the Evade deals nothing (never negative)', () => {
        expect(resolveCrewAttack(attack({ rolls: [[0, 0]], evade: 2 })).wounds).toBe(0)
    })

    it('two crew attacks are resolved one by one, never added up [thread 2370787]', () => {
        // 1 hit each (blank dice + 1) against Evade 1: added up they would wound, separately they do not
        const quint = resolveCrewAttack(attack({ weapon: 'machete', rolls: [[0, 0]], evade: 1 }))
        const hooper = resolveCrewAttack(attack({ weapon: 'rifle', gear: ['hammer', 'rifle'], rolls: [[0, 0]], evade: 1 }))
        expect(quint.wounds + hooper.wounds).toBe(0)
    })

    it('Hammer (1 die) ignores the Evade', () => {
        expect(resolveCrewAttack(attack({ weapon: 'hammer', gear: ['hammer', 'rifle'], rolls: [[1]], evade: 2, hardTarget: true })).wounds).toBe(1)
    })

    it('a miss with a melee weapon discards nothing', () => {
        const r = resolveCrewAttack(attack({ rolls: [[0, 0]], evade: 2 }))
        expect(r.discard).toEqual([])
    })

    it('checks the roll: one face 0-2 per die of the weapon, and the weapon must be held', () => {
        expect(() => resolveCrewAttack(attack({ rolls: [[1]] }))).toThrow()
        expect(() => resolveCrewAttack(attack({ rolls: [[1, 3]] }))).toThrow()
        expect(() => resolveCrewAttack(attack({ weapon: 'hook' }))).toThrow()
        expect(() => resolveCrewAttack(attack({ weapon: 'chum', gear: ['chum'], rolls: [] }))).toThrow()
    })
})

describe('Act II Baseball Bat: if the attack misses, roll both dice again once [C]', () => {
    const bat = (rolls: number[][]) => attack({ weapon: 'bat', gear: ['bat', 'pistol'], rolls, evade: 2 })

    it('asks for a reroll only after a miss', () => {
        expect(needsReroll(bat([[0, 1]]))).toBe(true)
        expect(needsReroll(bat([[2, 1]]))).toBe(false)
        expect(needsReroll(attack({ rolls: [[0, 0]], evade: 2 }))).toBe(false) // not a Bat
    })

    it('the second roll stands, even if it is worse', () => {
        const r = resolveCrewAttack(bat([[0, 1], [2, 2]]))
        expect(r.rerolled).toBe(true)
        expect(r.wounds).toBe(2)
        expect(resolveCrewAttack(bat([[1, 0], [0, 0]])).wounds).toBe(0)
    })

    it('a hit on the first roll is kept, and a missing or extra reroll is an error', () => {
        expect(resolveCrewAttack(bat([[2, 1]])).wounds).toBe(1)
        expect(() => resolveCrewAttack(bat([[0, 1]]))).toThrow()
        expect(() => resolveCrewAttack(bat([[2, 1], [2, 2]]))).toThrow()
        expect(() => resolveCrewAttack(attack({ rolls: [[0, 0], [2, 2]] }))).toThrow()
    })
})

describe('Act II Hook: 4 or more hits still wound, but the Hook breaks [C]', () => {
    const hook = (faces: number[]) => attack({ weapon: 'hook', gear: ['machete', 'hook'], rolls: [faces], evade: 2 })

    it('3 hits: wounds and stays', () => {
        const r = resolveCrewAttack(hook([1, 1, 1]))
        expect(r.wounds).toBe(1)
        expect(r.discard).toEqual([])
    })

    it('4 hits: wounds and breaks', () => {
        const r = resolveCrewAttack(hook([2, 2, 0]))
        expect(r.wounds).toBe(2)
        expect(r.discard).toEqual(['hook'])
    })
})

describe('Act II Tranq Spear: if it wounds, the shark rolls 1 die this round; discarded after attacking [C]', () => {
    const spear = (faces: number[]) => attack({ weapon: 'tranqSpear', gear: ['tranqSpear'], rolls: [faces], evade: 2 })

    it('wounding tranquilizes the shark', () => {
        const r = resolveCrewAttack(spear([2, 1, 0]))
        expect(r.tranquilized).toBe(true)
        expect(r.discard).toEqual(['tranqSpear'])
    })

    it('a miss does not tranquilize, and the spear is discarded anyway', () => {
        const r = resolveCrewAttack(spear([1, 0, 0]))
        expect(r.tranquilized).toBe(false)
        expect(r.discard).toEqual(['tranqSpear'])
    })
})

describe('Act II firearms [C]', () => {
    it('Pistol and Rifle spend one Ammo when the shooter has it, otherwise the weapon', () => {
        expect(resolveCrewAttack(attack({ weapon: 'rifle', gear: ['hammer', 'rifle', 'ammo'] })).discard).toEqual(['ammo'])
        expect(resolveCrewAttack(attack({ weapon: 'rifle', gear: ['hammer', 'rifle'] })).discard).toEqual(['rifle'])
        expect(resolveCrewAttack(attack({ weapon: 'pistol', gear: ['bat', 'pistol', 'ammo'], rolls: [[0, 0]] })).discard).toEqual(['ammo'])
    })

    it('the shooter may choose to discard the weapon and keep the Ammo', () => {
        expect(resolveCrewAttack(attack({ weapon: 'pistol', gear: ['bat', 'pistol', 'ammo'], spend: 'weapon' })).discard).toEqual(['pistol'])
        expect(() => resolveCrewAttack(attack({ weapon: 'pistol', gear: ['bat', 'pistol'], spend: 'ammo' }))).toThrow()
    })

    it('Harpoon Gun (3 dice +1) is discarded after firing, hit or miss', () => {
        const r = resolveCrewAttack(attack({ weapon: 'harpoonGun', gear: ['harpoonGun', 'ammo'], rolls: [[2, 2, 1]], evade: 2 }))
        expect(r.wounds).toBe(4)
        expect(r.discard).toEqual(['harpoonGun'])
    })

    it('an attached Canister explodes when a Pistol or Rifle wounds: +3 and it leaves the shark', () => {
        const r = resolveCrewAttack(attack({ weapon: 'rifle', gear: ['hammer', 'rifle'], rolls: [[1, 0]], evade: 1, attached: ['canister'] }))
        expect(r.wounds).toBe(1 + 3)
        expect(r.exploded).toBe(true)
        expect(r.sharkDiscard).toEqual(['canister'])
    })

    it('the Canister does not explode on a miss or with other weapons', () => {
        expect(resolveCrewAttack(attack({ weapon: 'rifle', gear: ['hammer', 'rifle'], rolls: [[0, 0]], evade: 2, attached: ['canister'] })).exploded).toBe(false)
        expect(resolveCrewAttack(attack({ weapon: 'harpoonGun', gear: ['harpoonGun'], rolls: [[2, 2, 2]], attached: ['canister'] })).exploded).toBe(false)
        expect(resolveCrewAttack(attack({ rolls: [[2, 2]], attached: ['canister'] })).exploded).toBe(false)
    })
})

describe('Act II attachable weapons: they hook on without rolling [M p.9]', () => {
    it('no dice, no wounds, the card goes onto the shark', () => {
        const r = resolveCrewAttack(attack({ weapon: 'flare', rolls: [] }))
        expect(r.wounds).toBe(0)
        expect(r.attach).toBe('flare')
        expect(r.discard).toEqual([])
        expect(() => resolveCrewAttack(attack({ weapon: 'flare', rolls: [[1]] }))).toThrow()
    })
})

describe('Act II applying a crew attack to the game state', () => {
    it('wounds the shark and spends the discarded gear', () => {
        const s0 = game()
        const r = resolveCrewAttack(attack({ weapon: 'harpoonGun', gear: s0.crew.quint.gear, rolls: [[1, 1, 1]], evade: 2 }))
        const s1 = applyCrewAttack(s0, 'quint', r)
        expect(s1.shark.wounds).toBe(2)
        expect(s1.crew.quint.gear).toEqual(['machete', 'flare', 'chum'])
        expect(s0.shark.wounds).toBe(0) // the old state is untouched
        expect(Object.isFrozen(s1)).toBe(true)
    })

    it('moves an attachable from the crew member to the shark', () => {
        const s0 = game()
        const s1 = applyCrewAttack(s0, 'hooper', resolveCrewAttack(attack({ weapon: 'canister', gear: s0.crew.hooper.gear, rolls: [] })))
        expect(s1.crew.hooper.gear).toEqual(['hammer', 'rifle'])
        expect(s1.shark.attached).toEqual(['canister'])
    })

    it('an exploding Canister leaves the shark; a Tranq Spear hit marks the round', () => {
        const s0 = game()
        const withCanister = applyCrewAttack(s0, 'hooper', resolveCrewAttack(attack({ weapon: 'canister', gear: s0.crew.hooper.gear, rolls: [] })))
        const boom = resolveCrewAttack(attack({ weapon: 'rifle', gear: withCanister.crew.hooper.gear, rolls: [[2, 0]], evade: 1, attached: withCanister.shark.attached }))
        const s2 = applyCrewAttack(withCanister, 'hooper', boom)
        expect(s2.shark.attached).toEqual([])
        expect(s2.shark.wounds).toBe(2 + 3)
        expect(s2.crew.hooper.gear).toEqual(['hammer']) // no Ammo: the Rifle goes

        const spear = resolveCrewAttack(attack({ weapon: 'tranqSpear', gear: ['tranqSpear'], rolls: [[2, 2, 2]], evade: 1 }))
        expect(applyCrewAttack(s0, 'brody', Object.assign({}, spear, { discard: [] })).shark.tranquilized).toBe(true)
    })

    it('logs the attack (public information)', () => {
        const s0 = game()
        const s1 = applyCrewAttack(s0, 'quint', resolveCrewAttack(attack({ rolls: [[2, 2]], evade: 1 })))
        expect(s1.log[s1.log.length - 1]).toEqual({ round: 1, event: 'crewAttack', args: ['quint', 'machete', 4] })
    })

    it('refuses to spend gear the crew member does not hold', () => {
        const s0 = game()
        const r = resolveCrewAttack(attack({ weapon: 'rifle', gear: ['hammer', 'rifle', 'ammo'] }))
        expect(() => applyCrewAttack(s0, 'hooper', r)).toThrow()
    })
})
