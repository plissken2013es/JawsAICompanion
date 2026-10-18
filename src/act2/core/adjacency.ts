/**
 * Orca adjacency (docs/acto2/02-catalogo.md §2, SPECS §3.1).
 *
 * Port of the model in the BGG "JAWS Adjacency Checker" v1.1 (file 324008), which was validated on
 * 2026-10-18 against the geometry of its own tile outlines (all 40 intact/damaged neighbour pairs
 * match, except the 5 % contact between the bow waters that the rules exclude on purpose).
 * Canon it encodes:
 * - every zone stays a separate space even when its tile is destroyed [FW 2229437, 2241185];
 * - stern (1-5) and bow (4-8) waters only touch once neither tile is intact [FW 2229532];
 * - a damaged tile shrinks, so its water reaches the intact decks next to it in its row
 *   (and its stern/bow partner).
 */
import type { Zone, TileState, Space } from './types'

export type Tiles = Readonly<Record<Zone, TileState>>

export const ALL_OK: Tiles = { 1: 'ok', 2: 'ok', 3: 'ok', 4: 'ok', 5: 'ok', 6: 'ok', 7: 'ok', 8: 'ok' }

const ZONES: readonly Zone[] = [1, 2, 3, 4, 5, 6, 7, 8]

/** Deck neighbours: same row left/right and same column top/bottom. */
const TILE_ADJ: Readonly<Record<Zone, readonly Zone[]>> = {
    1: [2, 5], 2: [1, 3, 6], 3: [2, 4, 7], 4: [3, 8],
    5: [1, 6], 6: [2, 5, 7], 7: [3, 6, 8], 8: [4, 7],
}

/** Water neighbours along each row (outside of the boat). */
const WATER_ADJ: Readonly<Record<Zone, readonly Zone[]>> = {
    1: [2], 2: [1, 3], 3: [2, 4], 4: [3],
    5: [6], 6: [5, 7], 7: [6, 8], 8: [7],
}

/** Stern and bow partners, whose waters wrap around the end of the boat. */
const WRAP_PARTNER: Readonly<Partial<Record<Zone, Zone>>> = { 1: 5, 5: 1, 4: 8, 8: 4 }

const exists = (t: Tiles, z: Zone) => t[z] !== 'gone'
const isOk = (t: Tiles, z: Zone) => t[z] === 'ok'
const isDamaged = (t: Tiles, z: Zone) => t[z] === 'damaged'

const boatOf = (zone: Zone): Space => ({ kind: 'boat', zone })
const waterOf = (zone: Zone): Space => ({ kind: 'water', zone })

/** Waters next to the water of zone z: its row, plus the wrap partner once neither tile is intact. */
function waterRing(t: Tiles, z: Zone): Zone[] {
    const out = WATER_ADJ[z].slice()
    const partner = WRAP_PARTNER[z]
    if (partner !== undefined && !isOk(t, z) && !isOk(t, partner)) out.push(partner)
    return out
}

export function spaceExists(t: Tiles, space: Space): boolean {
    return space.kind === 'water' || exists(t, space.zone)
}

export function allSpaces(t: Tiles): Space[] {
    const out: Space[] = []
    for (const z of ZONES) {
        if (exists(t, z)) out.push(boatOf(z))
        out.push(waterOf(z))
    }
    return out
}

export function adjacentSpaces(t: Tiles, space: Space): Space[] {
    const z = space.zone
    const partner = WRAP_PARTNER[z]
    const out: Space[] = []

    if (space.kind === 'boat') {
        if (!exists(t, z)) return []
        for (const n of TILE_ADJ[z]) out.push(exists(t, n) ? boatOf(n) : waterOf(n))
        out.push(waterOf(z))
        if (isOk(t, z)) {
            for (const n of waterRing(t, z)) if (isDamaged(t, n)) out.push(waterOf(n))
            if (partner !== undefined && isDamaged(t, partner)) out.push(waterOf(partner))
        }
    } else if (!exists(t, z)) {
        const ring = waterRing(t, z)
        for (const n of TILE_ADJ[z]) if (exists(t, n)) out.push(boatOf(n))
        for (const n of ring) out.push(waterOf(n))
        for (const n of TILE_ADJ[z]) if (!exists(t, n) && ring.indexOf(n) < 0) out.push(waterOf(n))
    } else {
        for (const n of waterRing(t, z)) out.push(waterOf(n))
        out.push(boatOf(z))
        if (isDamaged(t, z)) {
            for (const n of waterRing(t, z)) if (isOk(t, n)) out.push(boatOf(n))
            if (partner !== undefined && isOk(t, partner)) out.push(boatOf(partner))
        }
    }

    const seen: Record<string, true> = {}
    return out.filter(s => {
        const k = s.kind + s.zone
        if (seen[k]) return false
        seen[k] = true
        return true
    })
}

export function areAdjacent(t: Tiles, a: Space, b: Space): boolean {
    return adjacentSpaces(t, a).some(s => s.kind === b.kind && s.zone === b.zone)
}
