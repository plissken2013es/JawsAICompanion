/**
 * Crew movement and targeting in step 3 (SPECS §3.3, rulebook p.8-9).
 * - Up to 2 moves between adjacent spaces; climbing from water onto the boat takes both [FW 2228838].
 * - Melee and attachable weapons target the water of the crew member's space or one next to it;
 *   firearms target any water. The Pistol may shift its token to an adjacent water after the reveal [C].
 */
import type { Zone, Space, GearId } from './types'
import { ZONES, GEAR } from './data'
import { Tiles, adjacentSpaces, spaceExists } from './adjacency'

const MOVES = 2

const key = (s: Space): string => s.kind + s.zone
const stepCost = (from: Space, to: Space): number => (from.kind === 'water' && to.kind === 'boat' ? MOVES : 1)
const sortSpaces = (list: Space[]): Space[] =>
    list.sort((a, b) => (a.kind === b.kind ? a.zone - b.zone : a.kind === 'boat' ? -1 : 1))

/** Every space the crew member can end on this round, including staying put. */
export function reachableSpaces(tiles: Tiles, from: Space): Space[] {
    if (!spaceExists(tiles, from)) return []
    const cost: Record<string, number> = { [key(from)]: 0 }
    const found: Space[] = [from]
    for (let i = 0; i < found.length; i++) {
        const here = found[i]
        for (const next of adjacentSpaces(tiles, here)) {
            const c = cost[key(here)] + stepCost(here, next)
            if (c > MOVES || (key(next) in cost && cost[key(next)] <= c)) continue
            if (!(key(next) in cost)) found.push(next)
            cost[key(next)] = c
        }
    }
    return sortSpaces(found)
}

export function canMoveTo(tiles: Tiles, from: Space, to: Space): boolean {
    return reachableSpaces(tiles, from).some(s => key(s) === key(to))
}

/** Zones whose water this weapon can target from where the crew member stands (no move). */
export function targetableZones(tiles: Tiles, from: Space, weapon: GearId): Zone[] {
    const kind = GEAR[weapon].kind
    if (kind === 'accessory' || !spaceExists(tiles, from)) return []
    if (kind === 'firearm') return ZONES.slice()
    const zones = adjacentSpaces(tiles, from).concat(from).filter(s => s.kind === 'water').map(s => s.zone)
    return ZONES.filter(z => zones.indexOf(z) >= 0)
}

/** Zones this crew member can threaten this round: move up to 2, then target. */
export function reachableTargets(tiles: Tiles, from: Space, weapon: GearId): Zone[] {
    const zones: Zone[] = []
    for (const s of reachableSpaces(tiles, from)) zones.push(...targetableZones(tiles, s, weapon))
    return ZONES.filter(z => zones.indexOf(z) >= 0)
}

/** Resurface zones a Target Token on `target` hits once the shark is revealed. */
export function coveredZones(tiles: Tiles, weapon: GearId, target: Zone): Zone[] {
    if (weapon !== 'pistol') return [target]
    const zones = adjacentSpaces(tiles, { kind: 'water', zone: target }).filter(s => s.kind === 'water').map(s => s.zone)
    return ZONES.filter(z => z === target || zones.indexOf(z) >= 0)
}
