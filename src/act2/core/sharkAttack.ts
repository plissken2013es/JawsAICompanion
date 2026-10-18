/**
 * Step 6, the shark attacks (SPECS §3.3.6, rulebook p.10-11): a boat space next to its water OR a
 * crew member in the water of its space or next to it, then one bonus attack against each crew
 * member in the water nearby. Dice come in as input (physical dice, D-1) or from rollDice().
 */
import type { Zone, Space, CrewId, GearId, ResurfaceCard, TileState } from './types'
import { TILE_THRESHOLDS, DIE_FACES, CREW_HEALTH } from './data'
import { adjacentSpaces, areAdjacent, spaceExists } from './adjacency'
import { createRng } from './rng'
import { GameState, CrewState, CREW_IDS, deepFreeze } from './state'

export type SharkTarget =
    { readonly kind: 'boat'; readonly zone: Zone } |
    { readonly kind: 'crew'; readonly crew: CrewId }

export interface BoatAttackResult {
    readonly state: GameState
    readonly hits: number
    /** The tile after the attack. */
    readonly tile: TileState
    /** Crew members who were on the space and fell into its water. */
    readonly fell: readonly CrewId[]
}

const sharkSpace = (state: GameState): Space => {
    if (!state.shark.space) throw new RangeError('the shark has not resurfaced')
    return state.shark.space
}

const inWaterNear = (state: GameState, member: CrewState): boolean => {
    const here = state.shark.space
    if (!here || !member.space || member.space.kind !== 'water') return false
    return member.space.zone === here.zone || areAdjacent(state.tiles, here, member.space)
}

const update = (state: GameState, changes: Partial<GameState>): GameState =>
    deepFreeze(Object.assign({}, state, changes))

const withCrew = (state: GameState, member: CrewState): Partial<GameState> =>
    ({ crew: Object.assign({}, state.crew, { [member.id]: member }) })

const logged = (state: GameState, event: string, args: (string | number)[]): GameState['log'] =>
    state.log.concat({ round: state.round, event, args })

export function sharkTargets(state: GameState): SharkTarget[] {
    if (!state.shark.space) return []
    const boats: SharkTarget[] = adjacentSpaces(state.tiles, state.shark.space)
        .filter(s => s.kind === 'boat')
        .sort((a, b) => a.zone - b.zone)
        .map(s => ({ kind: 'boat' as const, zone: s.zone }))
    const crew: SharkTarget[] = CREW_IDS
        .filter(id => inWaterNear(state, state.crew[id]))
        .map(id => ({ kind: 'crew' as const, crew: id }))
    return boats.concat(crew)
}

export function mainAttackDice(state: GameState, card: ResurfaceCard): number {
    return state.shark.tranquilized ? 1 : card.dice
}

/** 1 die by the rules; the card's dice with the unofficial variant (D-3). Tranquilized: 1. */
export function bonusAttackDice(state: GameState, card: ResurfaceCard, variant: boolean): number {
    return variant ? mainAttackDice(state, card) : 1
}

export function bonusAttackTargets(state: GameState): CrewId[] {
    return CREW_IDS.filter(id => inWaterNear(state, state.crew[id]))
}

/** Sum of the faces; an attached Fishing Pole turns every 2 into 1 [C]. */
export function attackHits(faces: readonly number[], attached: readonly GearId[], bonus = 0): number {
    const pole = attached.indexOf('fishingPole') >= 0
    return faces.reduce((s, f) => s + (pole && f === 2 ? 1 : f), 0) + bonus
}

function checkFaces(faces: readonly number[], dice: number): void {
    if (faces.length !== dice) throw new RangeError(`the shark rolls ${dice} dice here, got ${faces.length}`)
    for (const f of faces) if (f !== 0 && f !== 1 && f !== 2) throw new RangeError(`a die shows 0, 1 or 2 hits, got ${f}`)
}

/** The app rolls the shark's dice (D-1 setting) with the game's seeded RNG. */
export function rollDice(state: GameState, n: number): { faces: number[]; state: GameState } {
    const rng = createRng(state.rngState)
    const faces: number[] = []
    for (let i = 0; i < n; i++) faces.push(rng.pick(DIE_FACES))
    return { faces, state: update(state, { rngState: rng.state() }) }
}

/** Wounds a crew member (no effect while caged); 6 wounds eliminate: off the board, gear discarded. */
export function woundCrew(state: GameState, crewId: CrewId, wounds: number): GameState {
    const member = state.crew[crewId]
    if (member.caged || wounds <= 0 || !member.space) return state
    const total = Math.min(CREW_HEALTH, member.wounds + wounds)
    const eliminated = total >= CREW_HEALTH
    const next: CrewState = Object.assign({}, member, eliminated ? { wounds: total, space: null, gear: [] } : { wounds: total })
    const s = update(state, withCrew(state, next))
    return eliminated ? update(s, { log: logged(s, 'crewEliminated', [crewId]) }) : s
}

function nextTile(state: TileState, hits: number, zone: Zone): TileState {
    const t = TILE_THRESHOLDS[zone]
    if (state === 'ok') return hits >= t.destroy ? 'gone' : hits >= t.damage ? 'damaged' : 'ok'
    if (state === 'damaged') return hits >= t.destroyDamaged ? 'gone' : 'damaged'
    return 'gone'
}

/** Applies hits to a boat tile (main attack, Domino Effect, Second Helping): crew fall in if it breaks. */
export function damageTile(state: GameState, zone: Zone, hits: number, event: string): BoatAttackResult {
    const before = state.tiles[zone]
    const tile = nextTile(before, hits, zone)
    let s = update(state, {
        tiles: Object.assign({}, state.tiles, { [zone]: tile }),
        log: logged(state, event, [zone, hits, tile]),
    })
    const fell: CrewId[] = []
    if (tile !== before) {
        for (const id of CREW_IDS) {
            const sp = s.crew[id].space
            if (sp && sp.kind === 'boat' && sp.zone === zone) {
                fell.push(id)
                s = update(s, withCrew(s, Object.assign({}, s.crew[id], { space: { kind: 'water', zone } })))
            }
        }
    }
    return { state: s, hits, tile, fell }
}

/** `bonus`: extra hits on the main attack (Ramming Speed). */
export function attackBoat(state: GameState, card: ResurfaceCard, zone: Zone, faces: readonly number[], bonus = 0): BoatAttackResult {
    const from = sharkSpace(state)
    const target: Space = { kind: 'boat', zone }
    if (!spaceExists(state.tiles, target) || !areAdjacent(state.tiles, from, target)) {
        throw new RangeError(`the shark cannot reach deck ${zone}`)
    }
    checkFaces(faces, mainAttackDice(state, card))
    return damageTile(state, zone, attackHits(faces, state.shark.attached, bonus), 'sharkAttackBoat')
}

export function attackCrew(state: GameState, card: ResurfaceCard, crewId: CrewId, faces: readonly number[], bonus = 0): GameState {
    sharkSpace(state)
    if (!inWaterNear(state, state.crew[crewId])) throw new RangeError(`the shark cannot reach ${crewId}`)
    checkFaces(faces, mainAttackDice(state, card))
    const hits = attackHits(faces, state.shark.attached, bonus)
    const s = update(state, { log: logged(state, 'sharkAttackCrew', [crewId, hits]) })
    return woundCrew(s, crewId, hits)
}

export function bonusAttacks(state: GameState, card: ResurfaceCard, variant: boolean,
    rolls: Readonly<Partial<Record<CrewId, readonly number[]>>>): GameState {
    const targets = bonusAttackTargets(state)
    const dice = bonusAttackDice(state, card, variant)
    let s = state
    for (const id of CREW_IDS) {
        const faces = rolls[id]
        if (!faces) continue
        if (targets.indexOf(id) < 0) throw new RangeError(`${id} is not in the water near the shark`)
        checkFaces(faces, dice)
        const hits = attackHits(faces, s.shark.attached)
        s = woundCrew(update(s, { log: logged(s, 'sharkBonusAttack', [id, hits]) }), id, hits)
    }
    return s
}

/** Played before the shark rolls: that crew member takes no wounds this round [C]. */
export function playSharkCage(state: GameState, crewId: CrewId): GameState {
    const member = state.crew[crewId]
    const i = member.gear.indexOf('sharkCage')
    if (i < 0 || !member.space) throw new RangeError(`${crewId} has no Shark Cage to play`)
    const gear = member.gear.slice()
    gear.splice(i, 1)
    const s = update(state, withCrew(state, Object.assign({}, member, { gear, caged: true })))
    return update(s, { log: logged(s, 'sharkCage', [crewId]) })
}
