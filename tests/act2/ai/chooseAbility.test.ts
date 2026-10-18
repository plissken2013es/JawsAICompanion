import { describe, it, expect } from 'vitest'
import { decideAbility, abilityGains, abilityThreshold, secondHelpingExtra } from '~/act2/core/ai/chooseAbility'
import { DEFAULT_PARAMS } from '~/act2/core/ai/params'
import type { GameState } from '~/act2/core/state'
import type { AbilityId, CrewId, GearId } from '~/act2/core/types'
import { board, card, boat, water, Tweak } from '../helpers'

const p = DEFAULT_PARAMS
const R01 = card('R01') // zone 1, 1 die
const R03 = card('R03') // zone 2, 3 dice, Evade 1

function hand(t: Tweak, cards: AbilityId[], gear?: Partial<Record<CrewId, GearId[]>>, round = 1): GameState {
    const s = Object.assign({}, board(t), { round })
    const crew = Object.assign({}, s.crew)
    if (gear) for (const id of Object.keys(gear) as CrewId[]) crew[id] = Object.assign({}, crew[id], { gear: gear[id] })
    return Object.assign({}, s, { crew, shark: Object.assign({}, s.shark, { hand: cards }) })
}

// Nobody on deck 2 nor in the water next to it: only the deck matters on R03.
const AWAY = { brody: boat(4), quint: boat(8), hooper: boat(7) }
// Cards worth nothing in these positions (nobody near the attack), to give the hand a realistic size.
const FILLERS: AbilityId[] = ['bigMouth', 'bigMouth', 'makingWaves', 'makingWaves']

describe('Act II AI abilities: what each card would add (SPECS §4.4)', () => {
    it('Extra Strength with an intact middle deck in reach: worth playing (6 cards, mid game)', () => {
        const s = hand({ at: AWAY }, ['extraStrength', 'rammingSpeed'].concat(FILLERS) as AbilityId[], undefined, 5)
        expect(abilityGains(s, R03, p).extraStrength).toBeGreaterThan(0)
        expect(decideAbility(s, R03, p).ability).toBe('extraStrength')
    })

    it('Big Mouth and Making Waves add nothing when nobody is on the boat near the attack', () => {
        const g = abilityGains(hand({ at: AWAY }, ['bigMouth', 'makingWaves']), R03, p)
        expect(g.bigMouth).toBe(0)
        expect(g.makingWaves).toBe(0)
    })

    it('Big Mouth is worth something with crew on the deck it attacks', () => {
        const g = abilityGains(hand({ at: { brody: boat(2), quint: boat(2), hooper: boat(7) } }, ['bigMouth']), R03, p)
        expect(g.bigMouth).toBeGreaterThan(0)
    })

    it('Second Helping is not played with no deck in reach', () => {
        // decks 1, 2, 5 destroyed: from water 1 the shark can only bite Quint in the water
        const s = hand({ tiles: { 1: 'gone', 2: 'gone', 5: 'gone' }, at: { brody: boat(4), quint: water(1), hooper: boat(8) } }, ['secondHelping'])
        expect(abilityGains(s, R01, p).secondHelping).toBe(0)
        expect(decideAbility(s, R01, p).ability).toBe(null)
    })

    it('Second Helping adds nothing after biting a crew member, only after a boat attack', () => {
        const after = board({ shark: 2 })
        expect(secondHelpingExtra({ kind: 'crew', crew: 'quint' }, p).extra).toBe(undefined)
        const extra = secondHelpingExtra({ kind: 'boat', zone: 2 }, p).extra
        expect(extra && extra(after)).toBeGreaterThan(0)
    })

    it('Domino Effect is worth nothing if the main attack cannot break the deck', () => {
        // tranquilized (1 die) with the Fishing Pole on (at most 1 hit) against a middle deck that needs 2
        expect(abilityGains(hand({ at: AWAY, tranquilized: true, attached: ['fishingPole'] }, ['dominoEffect']), R03, p).dominoEffect).toBe(0)
    })

    it('Domino Effect, Second Helping and Maul Again add value when attacking a deck', () => {
        const g = abilityGains(hand({ at: AWAY }, ['dominoEffect', 'secondHelping', 'maulAgain']), R03, p)
        expect(g.dominoEffect).toBeGreaterThan(0)
        expect(g.secondHelping).toBeGreaterThan(0)
        expect(g.maulAgain).toBeGreaterThan(0)
    })
})

describe('Act II AI abilities: Ramming Speed is kept for the end [FW 2373621]', () => {
    it('held in the middle game', () => {
        expect(decideAbility(hand({ at: AWAY }, ['rammingSpeed'].concat(FILLERS) as AbilityId[]), R03, p).ability).toBe(null)
    })

    it('played late from a safe option far from the boat, to ram into reach', () => {
        // decks 1, 2, 5, 6 gone: water 1 touches no deck, water 2 (next to it) still touches deck 3
        const late: Tweak = { tiles: { 1: 'gone', 2: 'gone', 5: 'gone', 6: 'gone' }, sharkWounds: 12, at: { brody: boat(4), quint: boat(8), hooper: boat(7) } }
        const s = hand(late, ['rammingSpeed', 'bigMouth', 'makingWaves'], undefined, 8)
        expect(abilityGains(s, R01, p).rammingSpeed).toBeGreaterThan(0)
        expect(decideAbility(s, R01, p).ability).toBe('rammingSpeed')
    })
})

describe('Act II AI abilities: Hard Target when the risk is high', () => {
    const rifles = { brody: ['rifle'], quint: ['rifle'], hooper: ['rifle'] } as Partial<Record<CrewId, GearId[]>>

    it('played by a badly wounded shark facing firearms', () => {
        expect(decideAbility(hand({ at: AWAY, sharkWounds: 14 }, ['hardTarget'].concat(FILLERS) as AbilityId[], rifles), R03, p).ability).toBe('hardTarget')
    })

    it('is worth more the more wounded the shark is', () => {
        const gain = (w: number) => abilityGains(hand({ at: AWAY, sharkWounds: w }, ['hardTarget'], rifles), R03, p).hardTarget || 0
        expect(gain(8)).toBeGreaterThan(gain(0))
        expect(gain(14)).toBeGreaterThan(gain(8))
    })

    it('a big enough reserve keeps it while the shark is healthy (the tuned reserve is small: P-20)', () => {
        const keep = Object.assign({}, p, { hardTargetReserve: 0.15 })
        const cards = ['hardTarget', 'hardTarget'].concat(FILLERS, ['bigMouth']) as AbilityId[]
        expect(decideAbility(hand({ at: AWAY }, cards, rifles, 8), R03, keep).ability).toBe(null)
        expect(decideAbility(hand({ at: AWAY }, cards, rifles, 8), R03, Object.assign({}, keep, { hardTargetReserve: 0 })).ability).toBe('hardTarget')
        expect(decideAbility(hand({ at: AWAY, sharkWounds: 14 }, cards, rifles, 8), R03, keep).ability).toBe('hardTarget')
    })
})

describe('Act II AI abilities: the threshold', () => {
    it('drops with a bigger hand (do not die with cards unplayed)', () => {
        const big = hand({}, ['bigMouth', 'bigMouth', 'makingWaves', 'makingWaves', 'hardTarget', 'hardTarget', 'extraStrength'])
        const small = hand({}, ['extraStrength', 'bigMouth'])
        expect(abilityThreshold(big, p)).toBeLessThan(abilityThreshold(small, p))
    })

    it('a card worth just between the two thresholds is played from the big hand only', () => {
        // cards worth exactly 0 here (nobody near the attack), so only Extra Strength is in question
        const fillers: AbilityId[] = ['bigMouth', 'bigMouth', 'makingWaves', 'makingWaves', 'bigMouth', 'makingWaves']
        const g = abilityGains(hand({ at: AWAY }, ['extraStrength']), R03, p).extraStrength || 0
        const rounds = Math.max(1, p.expectedRounds - 1 + 1)
        // pick a base so that threshold(7 cards) < g < threshold(2 cards)
        const base = g / (1 + rounds / 4)
        const tuned = Object.assign({}, p, { abilityBase: base })
        expect(decideAbility(hand({ at: AWAY }, ['extraStrength'].concat(fillers) as AbilityId[]), R03, tuned).ability).toBe('extraStrength')
        expect(decideAbility(hand({ at: AWAY }, ['extraStrength', 'bigMouth']), R03, tuned).ability).toBe(null)
    })

    it('an empty hand plays nothing, and the state is left alone', () => {
        const s = hand({}, [])
        expect(decideAbility(s, R03, p).ability).toBe(null)
        const full = hand({ at: AWAY }, ['extraStrength'])
        const copy = JSON.stringify(full)
        decideAbility(full, R03, p)
        expect(JSON.stringify(full)).toBe(copy)
    })
})
