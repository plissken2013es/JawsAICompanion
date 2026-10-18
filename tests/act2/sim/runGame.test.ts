import { describe, it, expect } from 'vitest'
import { runGame, createResurfaceDeck, dealCommonGear } from '../../../tools/act2/runGame'
import { botPrepare, botSetupGear, publicView, CREW_MODEL } from '../../../tools/act2/crewBot'
import { COMMON_GEAR_DECK, RESURFACE_CARDS } from '~/act2/core/data'
import { createRng } from '~/act2/core/rng'
import { setOptions, sharkChoose } from '~/act2/core/round'
import { serialize } from '~/act2/core/state'
import { DEFAULT_PARAMS } from '~/act2/core/ai/params'
import { game, water } from '../helpers'
import { board } from '../helpers'

const count = <T>(xs: readonly T[], x: T) => xs.filter(y => y === x).length

describe('Act II simulator: the table', () => {
    it('the Resurface deck deals all 16 cards before reshuffling', () => {
        const deck = createResurfaceDeck(createRng(5))
        const drawn: string[] = []
        for (let i = 0; i < 5; i++) drawn.push(...deck.draw3())
        expect(new Set(drawn).size).toBe(15)
        const sixth = deck.draw3()
        expect(new Set(sixth).size).toBe(3) // the last card plus two from the reshuffled discard
        for (const id of sixth) expect(RESURFACE_CARDS.map(c => c.id)).toContain(id)
    })

    it('common gear is dealt from the real deck, then shared out among the crew', () => {
        const dealt = dealCommonGear(createRng(9), 7)
        expect(dealt).toHaveLength(7)
        for (const id of dealt) expect(count(dealt, id)).toBeLessThanOrEqual(count(COMMON_GEAR_DECK, id))
        const hands = botSetupGear(dealt)
        expect(hands.brody.length + hands.quint.length + hands.hooper.length).toBe(7)
    })
})

describe('Act II simulator: the crew bot only uses public information', () => {
    it('the same decisions whatever the shark holds or chose', () => {
        const a = sharkChoose(setOptions(game(), ['R03', 'R07', 'R13']), 0)
        const b = Object.assign({}, sharkChoose(setOptions(game(), ['R03', 'R07', 'R13']), 2), {
            shark: Object.assign({}, a.shark, { hand: ['hardTarget'] }),
        })
        expect(botPrepare(a, DEFAULT_PARAMS)).toEqual(botPrepare(b, DEFAULT_PARAMS))
        expect(publicView(a).shark.hand).toEqual([])
        expect(publicView(a).turn.choice).toBe(null)
    })

    it('its model of the shark is its own: retuning the shark does not teach the bot', () => {
        // A full literal with the pre-tuning values: inheriting from DEFAULT_PARAMS once let the bot
        // follow the shark's p_min and read it better (17 % -> 14 % shark wins).
        expect(CREW_MODEL.pMin).toBe(0.05)
        expect(CREW_MODEL.temperature).toBe(0.02)
        expect(CREW_MODEL).not.toEqual(DEFAULT_PARAMS)
    })

    it('a badly wounded crew member in the water climbs back aboard', () => {
        const s = sharkChoose(setOptions(board({ at: { quint: water(2) }, wounds: { quint: 4 } }), ['R03', 'R07', 'R13']), 0)
        const plan = botPrepare(s, DEFAULT_PARAMS).quint
        expect(plan && plan.to && plan.to.kind).toBe('boat')
    })
})

describe('Act II simulator: whole games', () => {
    it('games end with a winner, every action legal', () => {
        for (let seed = 1; seed <= 12; seed++) {
            const r = runGame(seed)
            expect(['shark', 'crew']).toContain(r.winner)
            expect(r.rounds).toBeLessThan(60)
        }
    })

    it('a game is reproducible from its seed', () => {
        expect(serialize(runGame(42).state)).toBe(serialize(runGame(42).state))
        expect(serialize(runGame(42).state)).not.toBe(serialize(runGame(43).state))
    })

    it('runs from an Act I result and with the unofficial variant too', () => {
        expect(['shark', 'crew']).toContain(runGame(3, { swimmersEaten: 2 }).winner)
        expect(['shark', 'crew']).toContain(runGame(3, { variant: true }).winner)
    })
})
