import { describe, it, expect } from 'vitest'
import {
    setOptions, sharkChoose, playChum, crewPrepare, reveal, shiftPistol, crewAttack, endCrewAttacks,
    ram, cage, sharkMain, sharkSecondHelping, sharkBonus, endRound, currentCard, canAttack, PrepareInput,
} from '~/act2/core/round'
import { mainAttackDice, rollDice } from '~/act2/core/sharkAttack'
import { setupGame } from '~/act2/core/setup'
import { serialize } from '~/act2/core/state'
import type { GameState } from '~/act2/core/state'
import type { AbilityId, ResurfaceId } from '~/act2/core/types'
import { boat, water, game, board, Tweak } from './helpers'

// Default crew: Brody deck 2 (bat, pistol, ammo, cage), Quint deck 6 (machete, flare, harpoon gun, chum),
// Hooper deck 3 (hammer, rifle, canister).
// R03 = zone 2, Evade 1, 3 dice, shakes off. R04 = zone 2, Evade 2, 2 dice. R05 = zone 3, Evade 2, 2 dice, shakes off.
const R345: ResurfaceId[] = ['R03', 'R04', 'R05']

const withHand = (s: GameState, hand: AbilityId[]): GameState =>
    Object.assign({}, s, { shark: Object.assign({}, s.shark, { hand }) })

/** Everyone to deck 2 with a melee weapon aimed at zone 2. */
const ALL_AT_2: PrepareInput = {
    brody: { weapon: 'bat', target: 2 },
    quint: { to: boat(2), weapon: 'machete', target: 2 },
    hooper: { to: boat(2), weapon: 'hammer', target: 2 },
}

/** Drives a round up to the shark's attack. */
function toSharkAttacks(s: GameState, choice = 0, plans: PrepareInput = {}, options = R345, ability?: AbilityId): GameState {
    return endCrewAttacks(reveal(crewPrepare(sharkChoose(setOptions(s, options), choice, ability), plans)))
}
const tweaked = (t: Tweak) => board(t) // shark not placed: the round places it

describe('Act II round: the steps come in order [M p.8]', () => {
    it('starts at step 1, and an action out of turn is refused', () => {
        const s = game()
        expect(s.turn.step).toBe('options')
        expect(s.winner).toBe(null)
        expect(() => reveal(s)).toThrow()
        expect(() => sharkChoose(s, 0)).toThrow()
        const s1 = setOptions(s, R345)
        expect(s1.turn.step).toBe('choose')
        expect(() => setOptions(s1, R345)).toThrow()
    })

    it('step 1: three different Resurface cards, logged publicly', () => {
        const s = setOptions(game(), R345)
        expect(s.turn.options).toEqual(R345)
        expect(s.log[s.log.length - 1]).toEqual({ round: 1, event: 'options', args: R345 })
        expect(() => setOptions(game(), ['R03', 'R03', 'R04'])).toThrow()
        expect(() => setOptions(game(), ['R03', 'R04'])).toThrow()
    })

    it('step 2: the choice is secret (not logged); an ability can go with it', () => {
        const s = sharkChoose(setOptions(withHand(game(), ['bigMouth']), R345), 1, 'bigMouth')
        expect(s.turn.step).toBe('prepare')
        expect(s.turn.choice).toBe(1)
        expect(s.shark.ability).toBe('bigMouth')
        expect(s.log[s.log.length - 1]).toEqual({ round: 1, event: 'sharkChose', args: [] }) // which one: secret
        expect(() => sharkChoose(setOptions(game(), R345), 3)).toThrow()
    })
})

describe('Act II Chum: the shark reveals one option it did NOT choose [M p.9]', () => {
    const chosen = () => sharkChoose(setOptions(game(), R345), 0)

    it('is discarded and records which option was shown', () => {
        const s = playChum(chosen(), 'quint', 2)
        expect(s.turn.chum).toEqual({ by: 'quint', revealed: 2 })
        expect(s.crew.quint.gear).not.toContain('chum')
        expect(s.log[s.log.length - 1]).toEqual({ round: 1, event: 'chum', args: ['quint', 'R05'] })
    })

    it('one per round, never the chosen option, only from someone holding it', () => {
        expect(() => playChum(playChum(chosen(), 'quint', 2), 'quint', 1)).toThrow()
        expect(() => playChum(chosen(), 'quint', 0)).toThrow()
        expect(() => playChum(chosen(), 'brody', 2)).toThrow()
    })
})

describe('Act II step 3: the crew prepares [M p.8-9]', () => {
    const chosen = () => sharkChoose(setOptions(game(), R345), 0)

    it('moves, weapons and targets are checked', () => {
        const s = crewPrepare(chosen(), ALL_AT_2)
        expect(s.turn.step).toBe('reveal')
        expect(s.crew.quint.space).toEqual(boat(2))
        expect(s.turn.plans.quint).toEqual(expect.objectContaining({ weapon: 'machete', target: 2 }))
        expect(() => crewPrepare(chosen(), { quint: { to: boat(4) } })).toThrow()                   // 3 spaces away
        expect(() => crewPrepare(chosen(), { quint: { weapon: 'rifle', target: 2 } })).toThrow()    // not his
        expect(() => crewPrepare(chosen(), { brody: { weapon: 'bat', target: 4 } })).toThrow()      // out of melee reach
        expect(() => crewPrepare(chosen(), { brody: { weapon: 'ammo', target: 2 } })).toThrow()     // not a weapon
    })

    it('firearms aim anywhere; staying put without a weapon is fine', () => {
        const s = crewPrepare(chosen(), { hooper: { weapon: 'rifle', target: 8 } })
        expect(s.turn.plans.hooper).toEqual(expect.objectContaining({ weapon: 'rifle', target: 8 }))
        expect(s.turn.plans.brody).toBe(undefined)
        expect(s.crew.brody.space).toEqual(boat(2))
    })
})

describe('Act II step 4: the shark reveals [M p.9]', () => {
    it('surfaces in the water of the chosen card; the other two go to the discard; the ability shows', () => {
        const s = reveal(crewPrepare(sharkChoose(setOptions(withHand(game(), ['hardTarget']), R345), 2, 'hardTarget'), {}))
        expect(s.turn.step).toBe('crewAttacks')
        expect(currentCard(s).id).toBe('R05')
        expect(s.shark.space).toEqual(water(3))
        expect(s.resurfaceDiscard).toEqual(['R03', 'R04'])
        expect(s.log.map(e => e.event)).toContain('abilityRevealed')
        expect(s.log[s.log.length - 1].args).toEqual(expect.arrayContaining(['R05']))
    })

    it('a shake-off card throws off everything attached (out of the game) [FW 2227783]', () => {
        const shaken = reveal(crewPrepare(sharkChoose(setOptions(tweaked({ attached: ['flare', 'fishingNet'] }), R345), 0), {}))
        expect(shaken.shark.attached).toEqual([])
        expect(shaken.log.map(e => e.event)).toContain('shakeOff')
        const kept = reveal(crewPrepare(sharkChoose(setOptions(tweaked({ attached: ['flare'] }), R345), 1), {}))
        expect(kept.shark.attached).toEqual(['flare'])
    })

    it('a card already in the discard means the deck was reshuffled: the discard starts again', () => {
        const s = reveal(crewPrepare(sharkChoose(setOptions(game(), R345), 0), {}))
        const next = setOptions(endRound(sharkBonus(sharkMain(endCrewAttacks(s), null, []), {})), ['R03', 'R06', 'R07'])
        expect(next.resurfaceDiscard).toEqual([])
    })
})

describe('Act II step 5: the crew attacks [M p.10]', () => {
    const revealed = (plans: PrepareInput, choice = 0) => reveal(crewPrepare(sharkChoose(setOptions(game(), R345), choice), plans))

    it('only those who targeted the right zone, once each, against the card Evade', () => {
        const s = revealed({ brody: { weapon: 'bat', target: 2 }, hooper: { weapon: 'rifle', target: 3 } })
        expect(canAttack(s, 'brody')).toBe(true)
        expect(canAttack(s, 'hooper')).toBe(false)
        expect(() => crewAttack(s, 'hooper', [[2, 2]])).toThrow()
        const hit = crewAttack(s, 'brody', [[2, 1]])
        expect(hit.shark.wounds).toBe(2) // 3 hits - Evade 1
        expect(() => crewAttack(hit, 'brody', [[2, 1]])).toThrow()
    })

    it('Hard Target raises the Evade to 3', () => {
        const s = reveal(crewPrepare(sharkChoose(setOptions(withHand(game(), ['hardTarget']), R345), 0, 'hardTarget'),
            { brody: { weapon: 'bat', target: 2 } }))
        // 3 hits against Evade 3 miss, so the Bat rolls again: 4 hits - 3 = 1 (Evade 1 would have given 3)
        expect(crewAttack(s, 'brody', [[2, 1], [2, 2]]).shark.wounds).toBe(1)
    })

    it('the Pistol may shift its token to an adjacent water after the reveal', () => {
        const s = revealed({ brody: { weapon: 'pistol', target: 3 } })
        expect(canAttack(s, 'brody')).toBe(false)
        const shifted = shiftPistol(s, 'brody', 2)
        expect(canAttack(shifted, 'brody')).toBe(true)
        expect(crewAttack(shifted, 'brody', [[1, 1]]).crew.brody.gear).not.toContain('ammo')
        expect(() => shiftPistol(shifted, 'brody', 1)).toThrow()                       // once
        expect(() => shiftPistol(revealed({ brody: { weapon: 'pistol', target: 4 } }), 'brody', 2)).toThrow() // not adjacent
        expect(() => shiftPistol(revealed({ hooper: { weapon: 'rifle', target: 3 } }), 'hooper', 2)).toThrow() // not a Pistol
    })

    it('the crew wins the moment the shark reaches 18 wounds, before it attacks [M p.11]', () => {
        const s = reveal(crewPrepare(sharkChoose(setOptions(tweaked({ sharkWounds: 16 }), R345), 0), ALL_AT_2))
        const won = crewAttack(s, 'quint', [[1, 1]]) // 3 - 1 = 2
        expect(won.winner).toBe('crew')
        expect(won.turn.step).toBe('over')
        expect(() => crewAttack(won, 'brody', [[2, 2]])).toThrow()
        expect(() => endCrewAttacks(won)).toThrow()
    })
})

describe('Act II step 6: the shark attacks [M p.10-11]', () => {
    it('Ramming Speed moves before the main attack, which gets +2', () => {
        const s = toSharkAttacks(withHand(game(), ['rammingSpeed']), 0, {}, R345, 'rammingSpeed')
        const moved = ram(s, 3)
        expect(moved.shark.space).toEqual(water(3))
        const hit = sharkMain(moved, { kind: 'boat', zone: 3 }, [0, 0, 0])
        expect(hit.tiles[3]).toBe('damaged')
        expect(() => ram(hit, 4)).toThrow() // after the main attack
    })

    it('a Shark Cage played before the roll saves its owner', () => {
        const s = toSharkAttacks(tweaked({ at: { brody: water(2) } }))
        const safe = sharkMain(cage(s, 'brody'), { kind: 'crew', crew: 'brody' }, [2, 2, 2])
        expect(safe.crew.brody.wounds).toBe(0)
    })

    it('main attack, Second Helping, then the bonus attacks; one main attack only', () => {
        const s = toSharkAttacks(withHand(game(), ['secondHelping']), 0, {}, R345, 'secondHelping')
        const main = sharkMain(s, { kind: 'boat', zone: 2 }, [1, 1, 0])
        expect(main.tiles[2]).toBe('damaged')
        expect(main.crew.brody.space).toEqual(water(2))
        expect(() => sharkMain(main, { kind: 'boat', zone: 2 }, [1, 1, 0])).toThrow()
        const second = sharkSecondHelping(main, 1, [1, 0])
        expect(second.tiles[1]).toBe('damaged')
        const bonus = sharkBonus(second, { brody: [2] })
        expect(bonus.crew.brody.wounds).toBe(2)
        expect(bonus.turn.step).toBe('endRound')
        expect(() => sharkSecondHelping(bonus, 2, [1, 1])).toThrow()
    })

    it('the bonus attacks need the main attack (or its skipping) first', () => {
        const s = toSharkAttacks(game())
        expect(() => sharkBonus(s, {})).toThrow()
        expect(sharkBonus(sharkMain(s, null, []), {}).turn.step).toBe('endRound')
    })

    it('the shark wins when the last tile goes', () => {
        const gone = { 1: 'gone', 3: 'gone', 4: 'gone', 5: 'gone', 6: 'gone', 7: 'gone', 8: 'gone' } as const
        const s = toSharkAttacks(tweaked({ tiles: gone, at: { brody: water(2), quint: water(6), hooper: water(3) } }))
        const won = sharkMain(s, { kind: 'boat', zone: 2 }, [2, 2, 0])
        expect(won.winner).toBe('shark')
        expect(won.turn.step).toBe('over')
        expect(() => sharkBonus(won, {})).toThrow()
    })

    it('the shark wins when the last crew member is eliminated', () => {
        const s = toSharkAttacks(tweaked({ at: { brody: water(2), quint: water(2), hooper: water(3) }, wounds: { brody: 5, quint: 5, hooper: 5 } }))
        const main = sharkMain(s, { kind: 'crew', crew: 'brody' }, [1, 0, 0])
        expect(main.crew.brody.space).toBe(null)
        expect(main.winner).toBe(null)
        const won = sharkBonus(main, { quint: [1], hooper: [2] })
        expect(won.winner).toBe('shark')
    })
})

describe('Act II step 7: end of the round [M p.11]', () => {
    const atEnd = (t: Tweak, choice = 1, ability?: AbilityId) => {
        const base = ability ? withHand(tweaked(t), [ability]) : tweaked(t)
        return sharkBonus(sharkMain(toSharkAttacks(base, choice, {}, R345, ability), null, []), {})
    }

    it('an attached Flare burns: the shark rolls 1 die and takes that many wounds', () => {
        const s = endRound(atEnd({ attached: ['flare'] }), [2])
        expect(s.shark.wounds).toBe(2)
        expect(() => endRound(atEnd({ attached: ['flare'] }))).toThrow()
        expect(() => endRound(atEnd({}), [1])).toThrow()
    })

    it('the Flare can win the game for the crew', () => {
        const s = endRound(atEnd({ attached: ['flare'], sharkWounds: 17 }), [1])
        expect(s.winner).toBe('crew')
    })

    it('what a crew member attached stays on the shark after they die [M p.11, thread 2370787]', () => {
        const base = tweaked({ attached: ['flare'], at: { quint: water(2) }, wounds: { quint: 5 } })
        const killed = sharkBonus(sharkMain(toSharkAttacks(base, 1), { kind: 'crew', crew: 'quint' }, [1, 0]), {})
        expect(killed.crew.quint.space).toBe(null)
        expect(endRound(killed, [1]).shark.wounds).toBe(1)
    })

    it('cleans up: ability out of the game, card to the discard, cage and tranquilizer over, next round', () => {
        const before = atEnd({ at: { brody: water(2) } }, 1, 'bigMouth')
        const caged = Object.assign({}, before, {
            crew: Object.assign({}, before.crew, { brody: Object.assign({}, before.crew.brody, { caged: true }) }),
            shark: Object.assign({}, before.shark, { tranquilized: true }),
        })
        const s = endRound(caged)
        expect(s.round).toBe(2)
        expect(s.turn.step).toBe('options')
        expect(s.turn.options).toEqual([])
        expect(s.resurfaceDiscard).toEqual(['R03', 'R05', 'R04'])
        expect(s.shark).toEqual(expect.objectContaining({ space: null, ability: null, played: ['bigMouth'], tranquilized: false }))
        expect(s.crew.brody.caged).toBe(false)
    })
})

describe('Act II a whole scripted game', () => {
    it('two rounds: the crew wins on the last hit of round 2', () => {
        let s = game()
        // Round 1: shark at zone 2 (R03: Evade 1, 3 dice, shakes off).
        s = crewPrepare(sharkChoose(setOptions(s, R345), 0), ALL_AT_2)
        s = reveal(s)
        s = crewAttack(s, 'brody', [[2, 2]])   // 4 - 1 = 3
        s = crewAttack(s, 'quint', [[2, 2]])   // 5 - 1 = 4
        s = crewAttack(s, 'hooper', [[2]])     // Hammer: 2 - 0 = 2
        expect(s.shark.wounds).toBe(9)
        s = sharkMain(endCrewAttacks(s), { kind: 'boat', zone: 2 }, [2, 2, 0]) // 4 hits: deck 2 destroyed
        expect(s.tiles[2]).toBe('gone')
        expect(s.crew.hooper.space).toEqual(water(2))
        s = endRound(sharkBonus(s, { brody: [1], quint: [0], hooper: [2] }))
        expect([s.crew.brody.wounds, s.crew.quint.wounds, s.crew.hooper.wounds]).toEqual([1, 0, 2])

        // Round 2: shark at zone 6 (R12: Evade 1, 3 dice). The crew climbs onto deck 6 from the water of 2.
        s = sharkChoose(setOptions(s, ['R12', 'R13', 'R14']), 0)
        s = crewPrepare(s, {
            brody: { to: boat(6), weapon: 'bat', target: 6 },
            quint: { to: boat(6), weapon: 'machete', target: 6 },
            hooper: { to: boat(6), weapon: 'hammer', target: 6 },
        })
        s = reveal(s)
        s = crewAttack(crewAttack(s, 'brody', [[2, 2]]), 'quint', [[2, 2]])
        expect(s.winner).toBe(null)
        s = crewAttack(s, 'hooper', [[2]])
        expect(s.shark.wounds).toBe(18)
        expect(s.winner).toBe('crew')
        expect(s.log[s.log.length - 1]).toEqual({ round: 2, event: 'gameOver', args: ['crew'] })
    })

    it('with the app rolling the shark dice, the same seed plays the same two rounds', () => {
        const play = (seed: number) => {
            let s = setupGame({
                seed, swimmersEaten: 7,
                commonGear: { brody: ['ammo', 'sharkCage'], quint: ['harpoonGun', 'chum'], hooper: ['canister'] },
                positions: { brody: 2, quint: 6, hooper: 3 },
            })
            for (const options of [R345, ['R12', 'R13', 'R14'] as ResurfaceId[]]) {
                s = endCrewAttacks(reveal(crewPrepare(sharkChoose(setOptions(s, options), 0), {})))
                const zone = s.shark.space ? s.shark.space.zone : 2
                const roll = rollDice(s, mainAttackDice(s, currentCard(s)))
                s = endRound(sharkBonus(sharkMain(roll.state, { kind: 'boat', zone }, roll.faces), {}))
            }
            return s
        }
        expect(serialize(play(11))).toBe(serialize(play(11)))
        expect(serialize(play(11))).not.toBe(serialize(play(12)))
    })
})
