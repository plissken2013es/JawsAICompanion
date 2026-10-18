/**
 * Act II game state (SPECS §3, §5): plain, frozen data. Rules return a new state instead of
 * changing the old one, which gives undo and saving after every step for free.
 */
import type { Space, CrewId, GearId, AbilityId, ResurfaceId, SetupCounts } from './types'
import type { Tiles } from './adjacency'

/** Bump when the saved shape changes; old saves are then refused instead of misread. */
export const STATE_VERSION = 1

export const CREW_IDS: readonly CrewId[] = ['brody', 'quint', 'hooper']

export interface CrewState {
    readonly id: CrewId
    /** null once eliminated. */
    readonly space: Space | null
    readonly wounds: number
    /** What the crew member holds, as declared at the table (D-2). */
    readonly gear: readonly GearId[]
    /** Played the Shark Cage this round: takes no wounds until the round ends [C]. */
    readonly caged: boolean
}

export interface SharkState {
    readonly wounds: number
    /** Water space where it resurfaced this round; null before the first reveal. */
    readonly space: Space | null
    /** Hidden hand (D-5): never shown to the players. */
    readonly hand: readonly AbilityId[]
    /** Abilities already played, out of the game. */
    readonly played: readonly AbilityId[]
    /** Attachable gear stuck to the shark. */
    readonly attached: readonly GearId[]
    /** Wounded by the Tranq Spear this round: it rolls only 1 die when attacking [C]. */
    readonly tranquilized: boolean
}

/** One line of the game log: a LocaleManager key suffix and its arguments. Public information only. */
export interface LogEntry {
    readonly round: number
    readonly event: string
    readonly args?: readonly (string | number)[]
}

export interface GameSetup extends SetupCounts {
    /** null when Act II is played on its own. */
    readonly swimmersEaten: number | null
}

export interface GameState {
    readonly version: number
    readonly setup: GameSetup
    readonly round: number
    readonly tiles: Tiles
    readonly crew: Readonly<Record<CrewId, CrewState>>
    readonly shark: SharkState
    readonly resurfaceDiscard: readonly ResurfaceId[]
    readonly log: readonly LogEntry[]
    /** Where the seeded RNG is, so a loaded game rolls the same dice it would have rolled. */
    readonly rngState: number
}

export function deepFreeze<T>(value: T): T {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.freeze(value)
        for (const key of Object.keys(value)) deepFreeze((value as unknown as Record<string, unknown>)[key])
    }
    return value
}

export function serialize(state: GameState): string {
    return JSON.stringify(state)
}

const REQUIRED_KEYS: readonly (keyof GameState)[] = ['setup', 'round', 'tiles', 'crew', 'shark', 'resurfaceDiscard', 'log', 'rngState']

export function deserialize(text: string): GameState {
    const data: unknown = JSON.parse(text)
    if (data === null || typeof data !== 'object') throw new TypeError('not a saved Act II game')
    const record = data as Record<string, unknown>
    if (record.version !== STATE_VERSION) {
        throw new TypeError(`saved game format version ${String(record.version)}, expected ${STATE_VERSION}`)
    }
    const missing = REQUIRED_KEYS.filter(k => !(k in record))
    if (missing.length > 0) throw new TypeError(`saved game is missing ${missing.join(', ')}`)
    return deepFreeze(record as unknown as GameState)
}
