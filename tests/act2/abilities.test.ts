import { describe, it, expect } from 'vitest'
import {
    playAbility, retireAbility, hardTargetActive, sharkAttackBoat, sharkAttackCrew,
    rammingMove, secondHelping, secondHelpingDice, maulAgain,
} from '~/act2/core/abilities'
import { bonusAttacks, playSharkCage } from '~/act2/core/sharkAttack'
import { ABILITY_IDS } from '~/act2/core/data'
import type { GameState } from '~/act2/core/state'
import type { AbilityId } from '~/act2/core/types'
import { R04, boat, water, game, board } from './helpers'

// Default crew positions: Brody deck 2, Quint deck 6, Hooper deck 3.
const withHand = (s: GameState, hand: AbilityId[]): GameState =>
    Object.assign({}, s, { shark: Object.assign({}, s.shark, { hand }) })

describe('Act II playing an ability [M p.8, D-5]', () => {
    it('one card from the hidden hand, face down: the log says one was played, not which', () => {
        const s0 = withHand(game(), ['bigMouth', 'hardTarget', 'bigMouth'])
        const s1 = playAbility(s0, 'bigMouth')
        expect(s1.shark.ability).toBe('bigMouth')
        expect(s1.shark.hand).toEqual(['hardTarget', 'bigMouth'])
        const last = s1.log[s1.log.length - 1]
        expect(last.event).toBe('abilityPlayed')
        for (const id of ABILITY_IDS) expect(JSON.stringify(last)).not.toContain(id)
    })

    it('at most one per round, and only from the hand', () => {
        const s0 = withHand(game(), ['bigMouth', 'hardTarget'])
        expect(() => playAbility(playAbility(s0, 'bigMouth'), 'hardTarget')).toThrow()
        expect(() => playAbility(s0, 'rammingSpeed')).toThrow()
    })

    it('leaves the game at the end of the round, used or not', () => {
        const s = retireAbility(playAbility(withHand(game(), ['makingWaves']), 'makingWaves'))
        expect(s.shark).toEqual(expect.objectContaining({ ability: null, abilityUsed: false, played: ['makingWaves'], hand: [] }))
        expect(retireAbility(game()).shark.played).toEqual([]) // nothing played: nothing to retire
    })
})

describe('Act II Hard Target: Evade 3 [C]', () => {
    it('is active once played', () => {
        expect(hardTargetActive(board({ shark: 2, ability: 'hardTarget' }))).toBe(true)
        expect(hardTargetActive(board({ shark: 2, ability: 'bigMouth' }))).toBe(false)
    })
})

describe('Act II Extra Strength: damaging a deck destroys it [C]', () => {
    it('a damaging roll destroys, a miss still misses', () => {
        const r = sharkAttackBoat(board({ shark: 2, ability: 'extraStrength' }), R04, 2, [2, 0])
        expect(r.tile).toBe('gone')
        expect(r.state.crew.brody.space).toEqual(water(2))
        expect(sharkAttackBoat(board({ shark: 2, ability: 'extraStrength' }), R04, 2, [1, 0]).tile).toBe('ok')
        expect(sharkAttackBoat(board({ shark: 2 }), R04, 2, [2, 0]).tile).toBe('damaged')
    })
})

describe('Act II Big Mouth: 1 wound to each crew member who was on the deck it damages [C]', () => {
    it('wounds whoever was there, nobody else', () => {
        const r = sharkAttackBoat(board({ shark: 2, ability: 'bigMouth', at: { hooper: boat(2) } }), R04, 2, [2, 0])
        expect(r.state.crew.brody.wounds).toBe(1)
        expect(r.state.crew.hooper.wounds).toBe(1)
        expect(r.state.crew.quint.wounds).toBe(0)
    })

    it('nothing on a miss; the Shark Cage still protects', () => {
        const miss = sharkAttackBoat(board({ shark: 2, ability: 'bigMouth' }), R04, 2, [1, 0]).state
        expect(miss.crew.brody.wounds).toBe(0)
        expect(miss.log.map(e => e.event)).not.toContain('bigMouth')
        const caged = playSharkCage(board({ shark: 2, ability: 'bigMouth' }), 'brody')
        expect(sharkAttackBoat(caged, R04, 2, [2, 0]).state.crew.brody.wounds).toBe(0)
    })
})

describe('Act II Making Waves: damaging a deck throws everyone on the boat into the water [C]', () => {
    it('every crew member on any deck falls into the water of their zone', () => {
        const r = sharkAttackBoat(board({ shark: 2, ability: 'makingWaves' }), R04, 2, [2, 0])
        expect(r.state.crew.brody.space).toEqual(water(2))
        expect(r.state.crew.quint.space).toEqual(water(6))
        expect(r.state.crew.hooper.space).toEqual(water(3))
    })

    it('nothing on a miss', () => {
        expect(sharkAttackBoat(board({ shark: 2, ability: 'makingWaves' }), R04, 2, [0, 0]).state.crew.quint.space).toEqual(boat(6))
    })
})

describe('Act II Domino Effect: 2 hits on a deck next to the one it damages [C]', () => {
    const domino = (zone: 1 | 3 | 4 | 6, faces = [2, 0]) =>
        sharkAttackBoat(board({ shark: 2, ability: 'dominoEffect' }), R04, 2, faces, { domino: zone })

    it('the neighbour takes 2 hits (and its crew fall in if it breaks)', () => {
        const r = domino(3)
        expect(r.state.tiles[2]).toBe('damaged')
        expect(r.state.tiles[3]).toBe('damaged')
        expect(r.state.crew.hooper.space).toEqual(water(3))
        expect(r.state.shark.abilityUsed).toBe(true)
        expect(domino(6).state.tiles[6]).toBe('damaged')
        expect(domino(1).state.tiles[1]).toBe('damaged') // corner: 2 hits damage, 3 destroy
    })

    it('only a neighbouring deck that still exists, only after damaging, only with the card', () => {
        expect(() => domino(4)).toThrow()
        expect(() => domino(3, [1, 0])).toThrow()
        expect(() => sharkAttackBoat(board({ shark: 2 }), R04, 2, [2, 0], { domino: 3 })).toThrow()
        expect(() => sharkAttackBoat(board({ shark: 2, ability: 'dominoEffect', tiles: { 3: 'gone' } }), R04, 2, [2, 0], { domino: 3 })).toThrow()
    })
})

describe('Act II Second Helping: after attacking the boat, a second boat attack with 2 dice [C, FW 2230631, 2231476]', () => {
    const first = () => sharkAttackBoat(board({ shark: 2, ability: 'secondHelping' }), R04, 2, [2, 0])

    it('the same deck or another one next to its water', () => {
        expect(secondHelping(first().state, 2, [1, 1]).tile).toBe('gone')
        // deck 2 is now damaged, so the water of 2 reaches decks 1 and 3
        expect(secondHelping(first().state, 1, [1, 0]).tile).toBe('damaged')
        expect(secondHelping(first().state, 2, [1, 1]).state.shark.abilityUsed).toBe(true)
    })

    it('1 die when tranquilized', () => {
        const s = Object.assign({}, first().state)
        const tranq = Object.assign({}, s, { shark: Object.assign({}, s.shark, { tranquilized: true }) })
        expect(secondHelpingDice(tranq)).toBe(1)
        expect(() => secondHelping(tranq, 2, [1, 1])).toThrow()
        expect(secondHelping(tranq, 2, [2]).tile).toBe('gone')
    })

    it('only after a boat attack this round, only once, only within reach, only with the card', () => {
        const atCrew = sharkAttackCrew(board({ shark: 2, ability: 'secondHelping', at: { quint: water(2) } }), R04, 'quint', [1, 0])
        expect(() => secondHelping(atCrew, 2, [1, 1])).toThrow()
        expect(() => secondHelping(secondHelping(first().state, 1, [0, 0]).state, 2, [1, 1])).toThrow()
        expect(() => secondHelping(first().state, 4, [1, 1])).toThrow()
        expect(() => secondHelping(sharkAttackBoat(board({ shark: 2 }), R04, 2, [2, 0]).state, 2, [1, 1])).toThrow()
    })
})

describe('Act II Maul Again: reroll the chosen dice once, the new result stands [C, FW 2236208]', () => {
    it('replaces only the dice chosen', () => {
        const r = maulAgain(board({ shark: 2, ability: 'maulAgain' }), [0, 1, 2], [0], [2])
        expect(r.faces).toEqual([2, 1, 2])
        expect(r.state.shark.abilityUsed).toBe(true)
        expect(maulAgain(board({ shark: 2, ability: 'maulAgain' }), [0, 0], [0, 1], [0, 1]).faces).toEqual([0, 1])
    })

    it('a single attack only, valid dice only, only with the card', () => {
        const once = maulAgain(board({ shark: 2, ability: 'maulAgain' }), [0, 1], [0], [1]).state
        expect(() => maulAgain(once, [0, 0], [0], [2])).toThrow()
        const s = board({ shark: 2, ability: 'maulAgain' })
        expect(() => maulAgain(s, [0, 1], [2], [1])).toThrow()
        expect(() => maulAgain(s, [0, 1], [0, 0], [1, 1])).toThrow()
        expect(() => maulAgain(s, [0, 1], [0], [1, 2])).toThrow()
        expect(() => maulAgain(s, [0, 1], [0], [3])).toThrow()
        expect(() => maulAgain(board({ shark: 2 }), [0, 1], [0], [1])).toThrow()
    })
})

describe('Act II Ramming Speed: after the crew attacks, move to an adjacent water; if it moves, +2 [C, FW 2232426]', () => {
    const rammed = () => rammingMove(board({ shark: 2, ability: 'rammingSpeed', at: { quint: water(4) } }), 3)

    it('moves to an adjacent water and adds 2 hits to the main attack', () => {
        const s = rammed()
        expect(s.shark.space).toEqual(water(3))
        expect(s.shark.abilityUsed).toBe(true)
        expect(sharkAttackBoat(s, R04, 3, [0, 0]).tile).toBe('damaged') // 0 + 2 on a middle deck
        expect(sharkAttackCrew(s, R04, 'quint', [1, 0]).crew.quint.wounds).toBe(3)
    })

    it('no move, no +2', () => {
        expect(sharkAttackBoat(board({ shark: 2, ability: 'rammingSpeed' }), R04, 2, [0, 0]).tile).toBe('ok')
    })

    it('the +2 never reaches the bonus attacks', () => {
        expect(bonusAttacks(rammed(), R04, false, { quint: [1] }).crew.quint.wounds).toBe(1)
    })

    it('only to an adjacent water, only once, only with the card', () => {
        expect(() => rammingMove(board({ shark: 2, ability: 'rammingSpeed' }), 4)).toThrow()
        expect(() => rammingMove(rammed(), 4)).toThrow()
        expect(() => rammingMove(board({ shark: 2 }), 3)).toThrow()
    })
})
