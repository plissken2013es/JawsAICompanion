/** Shared test fixtures for the Act II core (not a test file: no .test.ts suffix). */
import { setupGame } from '~/act2/core/setup'
import { RESURFACE_CARDS } from '~/act2/core/data'
import type { GameState } from '~/act2/core/state'
import type { Zone, TileState, CrewId, Space, ResurfaceId, GearId, AbilityId } from '~/act2/core/types'

export const card = (id: ResurfaceId) => RESURFACE_CARDS.filter(c => c.id === id)[0]
export const R01 = card('R01') // zone 1, 1 die
export const R02 = card('R02') // zone 1, 2 dice
export const R03 = card('R03') // zone 2, 3 dice
export const R04 = card('R04') // zone 2, 2 dice

export const boat = (zone: Zone): Space => ({ kind: 'boat', zone })
export const water = (zone: Zone): Space => ({ kind: 'water', zone })

/** Brody holds the Shark Cage. Everyone on the boat unless moved. */
export const game = () => setupGame({
    seed: 3,
    swimmersEaten: 7,
    commonGear: { brody: ['ammo', 'sharkCage'], quint: ['harpoonGun', 'chum'], hooper: ['canister'] },
    positions: { brody: 2, quint: 6, hooper: 3 },
})

export interface Tweak {
    shark?: Zone
    tiles?: Partial<Record<Zone, TileState>>
    at?: Partial<Record<CrewId, Space>>
    wounds?: Partial<Record<CrewId, number>>
    attached?: GearId[]
    tranquilized?: boolean
    ability?: AbilityId
    abilityUsed?: boolean
    sharkWounds?: number
}

/** Test-only shortcut to a board position (the real moves come from the round, P-10). */
export function board(t: Tweak): GameState {
    const s = game()
    const crew = Object.assign({}, s.crew)
    for (const id of ['brody', 'quint', 'hooper'] as CrewId[]) {
        crew[id] = Object.assign({}, crew[id], {
            space: (t.at && t.at[id]) || crew[id].space,
            wounds: (t.wounds && t.wounds[id]) || 0,
        })
    }
    return Object.assign({}, s, {
        tiles: Object.assign({}, s.tiles, t.tiles || {}),
        crew,
        shark: Object.assign({}, s.shark, {
            space: t.shark ? water(t.shark) : null,
            attached: t.attached || [],
            tranquilized: !!t.tranquilized,
            ability: t.ability || null,
            abilityUsed: !!t.abilityUsed,
            wounds: t.sharkWounds || 0,
        }),
    })
}
