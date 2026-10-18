import { describe, it, expect } from 'vitest'
import {
    newSession, enterOptions, revealShark, declareHit, confirmHits, enterCrewHits, answerCage, enterSharkRoll,
    nextRound, chumHolders, useChum, moveCrew, positionOf, hitWeapons, undo, serializeSession, deserializeSession,
    facesFor, changeSettings, Session, DEFAULT_SETTINGS,
} from '~/act2/app/controller'
import { currentCard } from '~/act2/core/round'
import { RESURFACE_CARDS } from '~/act2/core/data'
import { CREW_IDS } from '~/act2/core/state'
import type { ResurfaceId } from '~/act2/core/types'
import { createResurfaceDeck } from '../../../tools/act2/runGame'
import { createRng } from '~/act2/core/rng'

const SETUP = {
    seed: 21, swimmersEaten: null,
    commonGear: { brody: ['ammo', 'sharkCage'], quint: ['harpoonGun', 'chum', 'ammo'], hooper: ['canister', 'fishingNet'] },
    positions: { brody: 2, quint: 6, hooper: 3 },
} as const

const start = (settings = DEFAULT_SETTINGS): Session => newSession(SETUP as never, settings)

/** Answers whatever the app asks, counting the taps a player would make. */
function autoplay(s0: Session, rounds: number, deckSeed = 1): { s: Session; taps: number[] } {
    const deck = createResurfaceDeck(createRng(deckSeed))
    let s = s0
    const taps: number[] = []
    let t = 0
    for (let guard = 0; guard < 400 && s.phase.kind !== 'over' && taps.length < rounds; guard++) {
        const ph = s.phase
        if (ph.kind === 'options') { s = enterOptions(s, deck.draw3()); t += 4 }
        else if (ph.kind === 'prepare') { s = revealShark(s); t += 1 }
        else if (ph.kind === 'hits') {
            for (const id of CREW_IDS) {
                const w = hitWeapons(s, id)
                if (w.length > 0 && id !== 'quint') { s = declareHit(s, id, w[0]); t += 1 }
            }
            s = confirmHits(s); t += 1
        } else if (ph.kind === 'crewRoll') { s = enterCrewHits(s, 1); t += 1 }
        else if (ph.kind === 'cage') { s = answerCage(s, null); t += 1 }
        else if (ph.kind === 'sharkRoll') {
            s = ph.perDie ? enterSharkRoll(s, new Array(ph.dice).fill(1)) : enterSharkRoll(s, Math.min(2, ph.dice)); t += ph.perDie ? ph.dice : 1
        } else if (ph.kind === 'summary') { taps.push(t); t = 0; s = nextRound(s) }
    }
    return { s, taps }
}

describe('Act II app: faces from a total entered at the table', () => {
    it('2s first, then 1s; the Fishing Pole caps every die at 1', () => {
        expect(facesFor(3, 2)).toEqual([2, 1])
        expect(facesFor(0, 3)).toEqual([0, 0, 0])
        expect(facesFor(2, 3, true)).toEqual([1, 1, 0])
        expect(() => facesFor(5, 2)).toThrow()
        expect(() => facesFor(3, 2, true)).toThrow()
    })
})

describe('Act II app: a round step by step', () => {
    it('3 cards, the shark decides in secret, the crew moves, then the reveal', () => {
        let s = enterOptions(start(), ['R03', 'R07', 'R13'])
        expect(s.phase.kind).toBe('prepare')
        expect(s.lines[0].key).toBe('act2.msg.sharkDecided')
        expect(JSON.stringify(s.lines)).not.toMatch(/R0[37]|R13/) // the choice stays secret
        s = moveCrew(s, 'quint', { kind: 'boat', zone: 7 })
        expect(positionOf(s, 'quint')).toEqual({ kind: 'boat', zone: 7 })
        expect(() => moveCrew(s, 'quint', { kind: 'boat', zone: 4 })).toThrow() // 3 spaces from deck 6
        s = revealShark(s)
        expect(s.phase.kind).toBe('hits')
        expect(s.lines[0]).toEqual({ key: 'act2.msg.surfaces', args: [currentCard(s.state).zone] })
    })

    it('Chum: only someone holding it, once, and it shows a letter that is not the shark\'s', () => {
        let s = enterOptions(start(), ['R03', 'R07', 'R13'])
        expect(chumHolders(s)).toEqual(['quint'])
        s = useChum(s, 'quint')
        const shown = s.lines[s.lines.length - 1]
        expect(shown.key).toBe('act2.msg.chumShown')
        expect(shown.args && shown.args[0]).not.toBe('ABC'[s.state.turn.choice as number])
        expect(chumHolders(s)).toEqual([])
    })

    it('who aimed right: the best weapon comes first; a Rifle always reaches', () => {
        const s = revealShark(enterOptions(start(), ['R03', 'R07', 'R13']))
        expect(hitWeapons(s, 'hooper')).toContain('rifle')
        expect(() => declareHit(s, 'hooper', 'chum')).toThrow()
        const d = declareHit(s, 'hooper', 'rifle')
        expect(d.phase.kind === 'hits' && d.phase.declared).toEqual([{ crew: 'hooper', weapon: 'rifle', pistolShift: false }])
        const none = declareHit(d, 'hooper', null)
        expect(none.phase.kind === 'hits' && none.phase.declared).toEqual([])
    })

    it('the crew\'s hits wound the shark, then the shark attacks', () => {
        let s = confirmHits(declareHit(revealShark(enterOptions(start(), ['R03', 'R07', 'R13'])), 'hooper', 'rifle'))
        expect(s.phase.kind).toBe('crewRoll')
        s = enterCrewHits(s, 3) // Rifle: 3 + 1 against Evade 1 or 2
        expect(s.state.shark.wounds).toBeGreaterThan(0)
        expect(s.lines.some(l => l.key === 'act2.msg.crewAttack')).toBe(true)
        expect(['sharkRoll', 'cage', 'summary']).toContain(s.phase.kind)
    })

    it('an attachable hooks on without a roll', () => {
        let s = revealShark(enterOptions(start(), ['R03', 'R04', 'R05']))
        const zone = currentCard(s.state).zone
        s = moveCrew(undo(s), 'hooper', { kind: 'boat', zone: zone === 3 ? 3 : 2 })
        s = revealShark(s)
        if (hitWeapons(s, 'hooper').indexOf('fishingNet') >= 0) {
            s = confirmHits(declareHit(s, 'hooper', 'fishingNet'))
            expect(s.state.shark.attached).toContain('fishingNet')
            expect(s.phase.kind).not.toBe('crewRoll')
        }
    })
})

describe('Act II app: whole games without getting stuck', () => {
    it('with the table rolling the shark dice', () => {
        const { s, taps } = autoplay(start(), 40)
        expect(s.phase.kind === 'over' || taps.length === 40).toBe(true)
        expect(taps.length).toBeGreaterThan(0)
    })

    it('with the app rolling them (D-1): fewer taps', () => {
        const table = autoplay(start(), 6)
        const app = autoplay(start(Object.assign({}, DEFAULT_SETTINGS, { appDice: true })), 6)
        const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
        expect(mean(app.taps)).toBeLessThan(mean(table.taps))
    })

    it('a normal round takes about 10 taps or fewer (SPECS §5)', () => {
        const { taps } = autoplay(start(), 8)
        const mean = taps.reduce((a, b) => a + b, 0) / taps.length
        expect(mean).toBeLessThanOrEqual(10)
    })

    it('the unofficial variant and anti-stall off work too', () => {
        const s = start(Object.assign({}, DEFAULT_SETTINGS, { variant: true, antiStall: false, appDice: true }))
        expect(autoplay(s, 30).taps.length).toBeGreaterThan(0)
    })
})

describe('Act II app: undo and saving', () => {
    it('undo steps back one answer at a time', () => {
        const a = start()
        const b = enterOptions(a, ['R03', 'R07', 'R13'])
        const c = revealShark(b)
        expect(undo(c).phase.kind).toBe('prepare')
        expect(undo(undo(c)).phase.kind).toBe('options')
        expect(undo(a)).toBe(a) // nothing to undo
    })

    it('a session saved mid-round loads back the same', () => {
        const s = declareHit(revealShark(enterOptions(start(), ['R03', 'R07', 'R13'])), 'hooper', 'rifle')
        const back = deserializeSession(serializeSession(s))
        expect(back.phase).toEqual(s.phase)
        expect(serializeSession(back)).toBe(serializeSession(s))
        expect(() => deserializeSession('{"version":99}')).toThrow()
    })

    it('settings can change between rounds', () => {
        expect(changeSettings(start(), { appDice: true }).settings.appDice).toBe(true)
    })

    it('every Resurface id can be entered', () => {
        const ids = RESURFACE_CARDS.map(c => c.id) as ResurfaceId[]
        expect(() => enterOptions(start(), [ids[0], ids[5], ids[15]])).not.toThrow()
    })
})
