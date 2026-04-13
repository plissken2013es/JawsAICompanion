import { describe, it, expect, beforeEach, vi } from 'vitest'
import JawsAI from '~/utils/JawsAI'
import DijkstraManager from '~/utils/DijkstraManager'
import LogManager from '~/utils/LogManager'

// ─── helpers ──────────────────────────────────────────────────────────────────

const ALL_ZONE_NAMES = ['1','2','3','4','5','6','7','8','N','S','E','W']

function makeStubZone(name: string, opts: {
    numSwimmers?: number
    isMichaelHere?: boolean
    hasBarrelsResult?: boolean
} = {}) {
    const swimmers = opts.numSwimmers ?? 0
    const michael = opts.isMichaelHere ?? false
    return {
        zoneName: name,
        numSwimmers: swimmers,
        isMichaelHere: michael,
        hasBarrels: vi.fn(() => opts.hasBarrelsResult ?? false),
        hasSomethingToEat: vi.fn(() => swimmers > 0 || michael),
        totalSwimmers: vi.fn(() => swimmers),
    }
}

function makeScene(zoneOverrides: Record<string, Parameters<typeof makeStubZone>[1]> = {}) {
    const zones = ALL_ZONE_NAMES.map(name => makeStubZone(name, zoneOverrides[name] ?? {}))
    return {
        logEnabled: false,
        getMap: () => ({ mapZones: zones }),
        getLocale: (w: any) => (Array.isArray(w) ? w : String(w)),
        findCharacterBy: (name: string) => ({
            currentZone: { zoneName: '1' },
            hunterName: name,
        }),
        updateBodyCount: vi.fn(),
        launchMessage: vi.fn(),
        findSwimmerAt: vi.fn(() => null),
        findBarrelAt: vi.fn(() => null),
        michael: { returnHome: vi.fn() },
        interactiveObjects: [],
        currentPhaseTitle: '',
        audioOn: false,
        boardCenter: { x: 0, y: 0 },
        isJawsVisible: vi.fn(),
        getJawsPosition: vi.fn(),
        attachBarrelToJaws: vi.fn(),
        numAttachedBarrelsToJaws: vi.fn(() => 0),
        numBarrelsObjetive: 3,
        enableInteractiveObjects: vi.fn(),
        disableInteractiveObjects: vi.fn(),
    }
}

function makeJawsAI(zoneOverrides: Record<string, Parameters<typeof makeStubZone>[1]> = {}) {
    ;(JawsAI as any).instance = undefined
    ;(DijkstraManager as any).instance = undefined
    ;(LogManager as any).instance = undefined
    return JawsAI.getInstance(makeScene(zoneOverrides) as any)
}

// ─── tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    ;(JawsAI as any).instance = undefined
    ;(DijkstraManager as any).instance = undefined
    ;(LogManager as any).instance = undefined
})

describe('JawsAI.isJawsAtBeach', () => {
    it('returns true when position is a beach', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.position = 'N'
        expect(ai.isJawsAtBeach()).toBe(true)
    })

    it('returns true for all four beaches', () => {
        const ai = makeJawsAI()
        for (const beach of ['N', 'S', 'E', 'W']) {
            ;(ai as any).jaws.position = beach
            expect(ai.isJawsAtBeach()).toBe(true)
        }
    })

    it('returns false when position is an ocean zone', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.position = '1'
        expect(ai.isJawsAtBeach()).toBe(false)
    })

    it('returns false for all ocean zones', () => {
        const ai = makeJawsAI()
        for (const zone of ['1','2','3','4','5','6','7','8']) {
            ;(ai as any).jaws.position = zone
            expect(ai.isJawsAtBeach()).toBe(false)
        }
    })
})

describe('JawsAI.oppositeBeachFromCurrent', () => {
    it('N → S', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.position = 'N'
        expect(ai.oppositeBeachFromCurrent()).toBe('S')
    })

    it('S → N', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.position = 'S'
        expect(ai.oppositeBeachFromCurrent()).toBe('N')
    })

    it('E → W', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.position = 'E'
        expect(ai.oppositeBeachFromCurrent()).toBe('W')
    })

    it('W → E', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.position = 'W'
        expect(ai.oppositeBeachFromCurrent()).toBe('E')
    })

    it('returns null when in an ocean zone', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.position = '1'
        expect(ai.oppositeBeachFromCurrent()).toBeNull()
    })
})

describe('JawsAI.getMissionDeckForJawsStatus', () => {
    it('HUNGRY returns hungryMissions (mostSwimmersBeach + nearestBeach)', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.status = 'hungry'
        const deck = ai.getMissionDeckForJawsStatus()
        expect(deck).toContain('mostSwimmersBeach')
        expect(deck).toContain('nearestBeach')
        expect(deck).toHaveLength(2)
    })

    it('NINJA returns standardMissions (the four beach names)', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.status = 'ninja'
        const deck = ai.getMissionDeckForJawsStatus()
        expect(deck).toContain('N')
        expect(deck).toContain('S')
        expect(deck).toContain('E')
        expect(deck).toContain('W')
    })

    it('NORMAL returns standardMissions', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.status = 'normal'
        const deck = ai.getMissionDeckForJawsStatus()
        expect(deck).toContain('N')
        expect(deck).toContain('S')
    })
})

describe('JawsAI.useJawsPower', () => {
    it('removes the power from powersAvailable', () => {
        const ai = makeJawsAI()
        expect((ai as any).jaws.powersAvailable).toContain('ff')
        ai.useJawsPower('ff')
        expect((ai as any).jaws.powersAvailable).not.toContain('ff')
    })

    it('sets powerEnabledThisTurn', () => {
        const ai = makeJawsAI()
        ai.useJawsPower('em')
        expect((ai as any).jaws.powerEnabledThisTurn).toBe('em')
    })

    it('is idempotent — using a power twice does not throw and does not re-remove', () => {
        const ai = makeJawsAI()
        ai.useJawsPower('ff')
        expect(() => ai.useJawsPower('ff')).not.toThrow()
        // powerEnabledThisTurn still holds the first use
        expect((ai as any).jaws.powerEnabledThisTurn).toBe('ff')
    })

    it('does not throw for a non-existent power', () => {
        const ai = makeJawsAI()
        expect(() => ai.useJawsPower('nonexistent')).not.toThrow()
    })

    it('does not change powersAvailable for a non-existent power', () => {
        const ai = makeJawsAI()
        const before = [...(ai as any).jaws.powersAvailable]
        ai.useJawsPower('nonexistent')
        expect((ai as any).jaws.powersAvailable).toEqual(before)
    })
})

describe('JawsAI.isJawsVisible', () => {
    it('returns true when no power is active', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.powerEnabledThisTurn = null
        expect(ai.isJawsVisible()).toBe(true)
    })

    it('returns false when OUT_OF_SIGHT is active', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.powerEnabledThisTurn = 'oos'
        expect(ai.isJawsVisible()).toBe(false)
    })

    it('returns true when a different power is active', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.powerEnabledThisTurn = 'ff'
        expect(ai.isJawsVisible()).toBe(true)
    })
})

describe('JawsAI.shouldUseEvasiveMovementsToMoveto', () => {
    it('returns true when all conditions are met', () => {
        const ai = makeJawsAI({ N: { hasBarrelsResult: true } })
        const jaws = (ai as any).jaws
        jaws.powerEnabledThisTurn = null
        jaws.powersAvailable = ['em', 'ff', 'oos', 'sb']
        jaws.path = ['1', 'N'] // length 2 <= numActions 2
        expect(ai.shouldUseEvasiveMovementsToMoveto('N', 2)).toBe(true)
    })

    it('returns false when zone has no barrels', () => {
        const ai = makeJawsAI({ N: { hasBarrelsResult: false } })
        const jaws = (ai as any).jaws
        jaws.powerEnabledThisTurn = null
        jaws.powersAvailable = ['em']
        jaws.path = ['N']
        expect(ai.shouldUseEvasiveMovementsToMoveto('N', 2)).toBe(false)
    })

    it('returns false for an ocean zone (not a beach)', () => {
        const ai = makeJawsAI({ '2': { hasBarrelsResult: true } })
        const jaws = (ai as any).jaws
        jaws.powerEnabledThisTurn = null
        jaws.powersAvailable = ['em']
        jaws.path = []
        expect(ai.shouldUseEvasiveMovementsToMoveto('2', 2)).toBe(false)
    })

    it('returns false when em power is not available', () => {
        const ai = makeJawsAI({ N: { hasBarrelsResult: true } })
        const jaws = (ai as any).jaws
        jaws.powerEnabledThisTurn = null
        jaws.powersAvailable = ['ff', 'oos', 'sb'] // no 'em'
        jaws.path = []
        expect(ai.shouldUseEvasiveMovementsToMoveto('N', 2)).toBe(false)
    })

    it('returns false when another power is already active this turn', () => {
        const ai = makeJawsAI({ N: { hasBarrelsResult: true } })
        const jaws = (ai as any).jaws
        jaws.powerEnabledThisTurn = 'ff'
        jaws.powersAvailable = ['em']
        jaws.path = []
        expect(ai.shouldUseEvasiveMovementsToMoveto('N', 2)).toBe(false)
    })
})

describe('JawsAI.shouldUseFeedingFrenzy', () => {
    it('returns true at a beach with >3 swimmers and ff available', () => {
        const ai = makeJawsAI({ N: { numSwimmers: 4 } })
        const jaws = (ai as any).jaws
        jaws.position = 'N'
        jaws.powerEnabledThisTurn = null
        jaws.powersAvailable = ['ff']
        expect(ai.shouldUseFeedingFrenzy(false)).toBe(true)
    })

    it('returns false when isGoingToRunAwayOrHide is true', () => {
        const ai = makeJawsAI({ N: { numSwimmers: 5 } })
        const jaws = (ai as any).jaws
        jaws.position = 'N'
        jaws.powerEnabledThisTurn = null
        jaws.powersAvailable = ['ff']
        expect(ai.shouldUseFeedingFrenzy(true)).toBe(false)
    })

    it('returns false when not at a beach', () => {
        const ai = makeJawsAI({ '1': { numSwimmers: 5 } })
        const jaws = (ai as any).jaws
        jaws.position = '1'
        jaws.powerEnabledThisTurn = null
        jaws.powersAvailable = ['ff']
        expect(ai.shouldUseFeedingFrenzy(false)).toBe(false)
    })

    it('returns false when ff power is not available', () => {
        const ai = makeJawsAI({ N: { numSwimmers: 5 } })
        const jaws = (ai as any).jaws
        jaws.position = 'N'
        jaws.powerEnabledThisTurn = null
        jaws.powersAvailable = ['em', 'oos', 'sb']
        expect(ai.shouldUseFeedingFrenzy(false)).toBe(false)
    })

    it('returns false when swimmers ≤ 3 and Michael is not present', () => {
        const ai = makeJawsAI({ N: { numSwimmers: 2, isMichaelHere: false } })
        const jaws = (ai as any).jaws
        jaws.position = 'N'
        jaws.powerEnabledThisTurn = null
        jaws.powersAvailable = ['ff']
        expect(ai.shouldUseFeedingFrenzy(false)).toBe(false)
    })

    it('returns true with >1 swimmer and Michael present', () => {
        const ai = makeJawsAI({ N: { numSwimmers: 2, isMichaelHere: true } })
        const jaws = (ai as any).jaws
        jaws.position = 'N'
        jaws.powerEnabledThisTurn = null
        jaws.powersAvailable = ['ff']
        expect(ai.shouldUseFeedingFrenzy(false)).toBe(true)
    })
})

describe('JawsAI.totalSwimmersOnBeaches', () => {
    it('sums numSwimmers across all zones', () => {
        const ai = makeJawsAI({
            N: { numSwimmers: 3 },
            S: { numSwimmers: 2 },
            E: { numSwimmers: 1 },
        })
        expect(ai.totalSwimmersOnBeaches()).toBe(6)
    })

    it('returns 0 when all zones are empty', () => {
        const ai = makeJawsAI()
        expect(ai.totalSwimmersOnBeaches()).toBe(0)
    })
})

describe('JawsAI.changeJawsBehaviourIfNeeded', () => {
    it('sets status to HUNGRY when total swimmers > 8', () => {
        const ai = makeJawsAI({
            N: { numSwimmers: 5 },
            S: { numSwimmers: 5 },
        })
        ai.changeJawsBehaviourIfNeeded()
        expect((ai as any).jaws.status).toBe('hungry')
    })

    it('sets status to NORMAL when swimmers ≤ 8 and no barrels attached', () => {
        const ai = makeJawsAI({ N: { numSwimmers: 2 } })
        ;(ai as any).jaws.numAttachedBarrels = 0
        ai.changeJawsBehaviourIfNeeded()
        expect((ai as any).jaws.status).toBe('normal')
    })
})

describe('JawsAI.initGame', () => {
    it('resets turnsPlayed and swimmersEaten to 0', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.turnsPlayed = 5
        ;(ai as any).jaws.swimmersEaten = 3
        ai.initGame()
        expect((ai as any).jaws.turnsPlayed).toBe(0)
        expect((ai as any).jaws.swimmersEaten).toBe(0)
    })

    it('provides a fresh copy of powersAvailable (not the same reference)', () => {
        const ai = makeJawsAI()
        const original = (ai as any).jaws.powersAvailable
        ai.initGame()
        const fresh = (ai as any).jaws.powersAvailable
        // Modifying the original should not affect the fresh copy
        original.push('extra')
        expect(fresh).not.toContain('extra')
    })

    it('powersAvailable contains all 4 power tokens after initGame', () => {
        const ai = makeJawsAI()
        ;(ai as any).jaws.powersAvailable = []
        ai.initGame()
        expect((ai as any).jaws.powersAvailable).toEqual(
            expect.arrayContaining(['ff', 'em', 'oos', 'sb'])
        )
        expect((ai as any).jaws.powersAvailable).toHaveLength(4)
    })
})

describe('JawsAI.attachBarrelToJaws / numAttachedBarrelsToJaws', () => {
    it('starts with 0 attached barrels', () => {
        const ai = makeJawsAI()
        expect(ai.numAttachedBarrelsToJaws()).toBe(0)
    })

    it('increments on each attachBarrelToJaws call', () => {
        const ai = makeJawsAI()
        ai.attachBarrelToJaws()
        expect(ai.numAttachedBarrelsToJaws()).toBe(1)
        ai.attachBarrelToJaws()
        expect(ai.numAttachedBarrelsToJaws()).toBe(2)
    })
})
