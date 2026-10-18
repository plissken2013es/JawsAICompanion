/**
 * Act II setup (SPECS §3.2): the shark draws its hidden hand with the seeded RNG; the crew get
 * their personal gear plus the common cards they drew at the table, and start on boat spaces.
 */
import type { Zone, CrewId, GearId, SetupCounts } from './types'
import {
    ZONES, ABILITY_DECK, PERSONAL_GEAR, COMMON_GEAR_DECK,
    setupFromSwimmersEaten, STANDALONE_SETUP,
} from './data'
import { ALL_OK } from './adjacency'
import { createRng } from './rng'
import { GameState, CrewState, STATE_VERSION, CREW_IDS, deepFreeze } from './state'

export interface SetupInput {
    readonly seed: number
    /** Swimmers eaten in Act I (0-9), or null for Act II on its own (D-6). */
    readonly swimmersEaten: number | null
    /** Common gear cards each crew member took (entered at the table). */
    readonly commonGear: Readonly<Partial<Record<CrewId, readonly GearId[]>>>
    /** Starting zone of each crew member, always on the boat. */
    readonly positions: Readonly<Record<CrewId, Zone>>
}

const count = <T>(items: readonly T[], value: T): number => items.filter(x => x === value).length

function checkCommonGear(hands: SetupInput['commonGear'], counts: SetupCounts): void {
    const all = CREW_IDS.reduce<GearId[]>((acc, id) => acc.concat(hands[id] || []), [])
    if (all.length !== counts.commonGear) {
        throw new RangeError(`expected ${counts.commonGear} common gear cards, got ${all.length}`)
    }
    for (const id of all) {
        if (count(all, id) > count(COMMON_GEAR_DECK, id)) {
            throw new RangeError(`the common gear deck has only ${count(COMMON_GEAR_DECK, id)} "${id}"`)
        }
    }
}

export function setupGame(input: SetupInput): GameState {
    const counts = input.swimmersEaten === null ? STANDALONE_SETUP : setupFromSwimmersEaten(input.swimmersEaten)
    checkCommonGear(input.commonGear, counts)

    const crew = {} as Record<CrewId, CrewState>
    for (const id of CREW_IDS) {
        const zone = input.positions[id]
        if (ZONES.indexOf(zone) < 0) throw new RangeError(`${id} must start in a zone 1-8, got ${zone}`)
        crew[id] = {
            id,
            space: { kind: 'boat', zone },
            wounds: 0,
            gear: PERSONAL_GEAR[id].concat(input.commonGear[id] || []),
        }
    }

    const rng = createRng(input.seed)
    const hand = rng.shuffle(ABILITY_DECK).slice(0, counts.abilities)

    return deepFreeze<GameState>({
        version: STATE_VERSION,
        setup: { swimmersEaten: input.swimmersEaten, abilities: counts.abilities, commonGear: counts.commonGear },
        round: 1,
        tiles: Object.assign({}, ALL_OK),
        crew,
        shark: { wounds: 0, space: null, hand, played: [], attached: [], tranquilized: false },
        resurfaceDiscard: [],
        log: [{ round: 0, event: 'setup', args: [counts.abilities, counts.commonGear] }],
        rngState: rng.state(),
    })
}
