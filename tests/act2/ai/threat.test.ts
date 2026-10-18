import { describe, it, expect } from 'vitest'
import { crewThreats, optionThreat, expectedWounds } from '~/act2/core/ai/threat'
import { DEFAULT_PARAMS } from '~/act2/core/ai/params'
import { RESURFACE_CARDS } from '~/act2/core/data'
import type { GameState } from '~/act2/core/state'
import type { CrewId, GearId } from '~/act2/core/types'
import { board, card, boat, water, Tweak } from '../helpers'

const p = DEFAULT_PARAMS
// R01 zone 1 Evade 2 · R02 zone 1 Evade 1 · R07 zone 4 Evade 1 · R08 zone 4 Evade 2 · R04 zone 2 Evade 2 · R03 zone 2 Evade 1
const [R01, R02, R03, R04, R07, R08] = ['R01', 'R02', 'R03', 'R04', 'R07', 'R08'].map(id => card(id as 'R01'))

function armed(t: Tweak, gear: Partial<Record<CrewId, GearId[]>>): GameState {
    const s = board(t)
    const crew = Object.assign({}, s.crew)
    for (const id of Object.keys(gear) as CrewId[]) crew[id] = Object.assign({}, crew[id], { gear: gear[id] })
    return Object.assign({}, s, { crew })
}

/** Melee only, everyone at the stern. */
const MELEE_AT_STERN = armed({ at: { brody: boat(1), quint: boat(5), hooper: boat(1) } },
    { brody: ['bat'], quint: ['machete'], hooper: ['hammer'] })

describe('Act II AI threat: who can reach the option (SPECS §4.3.1)', () => {
    it('a zone out of everyone\'s melee reach, with no firearms, is no threat', () => {
        expect(optionThreat(MELEE_AT_STERN, R07, {}, p)).toBe(0)
        expect(optionThreat(MELEE_AT_STERN, R08, {}, p)).toBe(0)
        expect(optionThreat(MELEE_AT_STERN, R02, {}, p)).toBeGreaterThan(0)
    })

    it('a Rifle anywhere makes every option a threat', () => {
        const s = armed({ at: { hooper: boat(1) } }, { brody: [], quint: [], hooper: ['rifle'] })
        for (const c of RESURFACE_CARDS) expect(optionThreat(s, c, {}, p)).toBeGreaterThan(0)
    })

    it('eliminated crew threaten nothing', () => {
        const s = armed({}, { brody: [], quint: [], hooper: ['rifle'] })
        const dead = Object.assign({}, s, { crew: Object.assign({}, s.crew, { hooper: Object.assign({}, s.crew.hooper, { space: null }) }) })
        expect(optionThreat(dead, R03, {}, p)).toBe(0)
    })

    it('reports the best weapon of each crew member for that option', () => {
        const s = armed({ at: { hooper: boat(1) } }, { brody: [], quint: [], hooper: ['hammer', 'rifle'] })
        const hooper = crewThreats(s, R01, {}, p).filter(t => t.crew === 'hooper')[0]
        expect(hooper.weapon).toBe('rifle')               // 2 dice +1 vs Evade 2: 49/36 > Hammer 7/6
        expect(hooper.wounds).toBeCloseTo(49 / 36, 12)
        const none = crewThreats(MELEE_AT_STERN, R07, {}, p)
        expect(none.every(t => t.weapon === null && t.wounds === 0)).toBe(true)
    })
})

describe('Act II AI threat: exact expected wounds', () => {
    it('Evade 2 hurts the crew less than Evade 1', () => {
        expect(optionThreat(MELEE_AT_STERN, R01, {}, p)).toBeLessThan(optionThreat(MELEE_AT_STERN, R02, {}, p))
    })

    it('the Hammer ignores the Evade: 7/6 expected wounds against any card', () => {
        expect(expectedWounds('hammer', 1, false, [])).toBeCloseTo(7 / 6, 12)
        expect(expectedWounds('hammer', 2, true, [])).toBeCloseTo(7 / 6, 12)
    })

    it('the Baseball Bat counts its reroll after a miss', () => {
        // 2 dice vs Evade 1: wounds 0..3 with 7, 13, 12, 4 in 36; a miss is rolled again once
        expect(expectedWounds('bat', 1, false, [])).toBeCloseTo((49 / 36) * (1 + 7 / 36), 12)
    })

    it('the Fishing Net lowers the Evade; an attached Canister adds 3 when a Pistol or Rifle wounds', () => {
        expect(expectedWounds('machete', 2, false, ['fishingNet'])).toBeCloseTo(expectedWounds('machete', 1, false, []), 12)
        const pWound = 1 - 7 / 36 // Rifle 2 dice +1 vs Evade 2 misses only on 0 or 1 hit
        expect(expectedWounds('rifle', 2, false, ['canister'])).toBeCloseTo(49 / 36 + 3 * pWound, 12)
        expect(expectedWounds('harpoonGun', 2, false, ['canister'])).toBeCloseTo(expectedWounds('harpoonGun', 2, false, []), 12)
    })

    it('attachables count as their wound-equivalent value, once each', () => {
        const s = armed({ at: { quint: boat(1) } }, { brody: [], quint: ['flare'], hooper: [] })
        expect(optionThreat(s, R02, {}, p)).toBeCloseTo(p.attachValue.flare || 0, 12)
        const stuck = armed({ at: { quint: boat(1) }, attached: ['flare'] }, { brody: [], quint: ['flare'], hooper: [] })
        expect(optionThreat(stuck, R02, {}, p)).toBe(0) // already on the shark: cannot attach twice
    })
})

describe('Act II AI threat: playing Hard Target', () => {
    it('lowers the threat of dice weapons, never the Hammer', () => {
        expect(optionThreat(MELEE_AT_STERN, R02, { hardTarget: true }, p)).toBeLessThan(optionThreat(MELEE_AT_STERN, R02, {}, p))
        const hammer = armed({ at: { hooper: boat(1) } }, { brody: [], quint: [], hooper: ['hammer'] })
        expect(optionThreat(hammer, R02, { hardTarget: true }, p)).toBeCloseTo(optionThreat(hammer, R02, {}, p), 12)
    })

    it('a Hard Target already in play counts by itself', () => {
        const s = Object.assign({}, MELEE_AT_STERN, { shark: Object.assign({}, MELEE_AT_STERN.shark, { ability: 'hardTarget' }) })
        expect(optionThreat(s, R02, {}, p)).toBeCloseTo(optionThreat(MELEE_AT_STERN, R02, { hardTarget: true }, p), 12)
    })

    it('crew in the water reach as far as the rules let them', () => {
        const s = armed({ at: { brody: water(3) } }, { brody: ['bat'], quint: [], hooper: [] })
        expect(optionThreat(s, R07, {}, p)).toBeGreaterThan(0) // water 3 -> water 4 is one move
        expect(optionThreat(s, R03, {}, p)).toBeGreaterThan(0)
    })
})
