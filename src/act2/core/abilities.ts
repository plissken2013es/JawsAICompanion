/**
 * The 8 shark abilities (SPECS §3.3, catalog §4, FilmWise rulings). The shark plays at most one per
 * round, so abilities never combine: the state keeps which one is in play and whether its one-off
 * effect has been used. The shark's attacks go through here so the ability can change them.
 */
import type { Zone, Space, AbilityId, ResurfaceCard, CrewId } from './types'
import { TILE_ADJ, adjacentSpaces, areAdjacent, spaceExists } from './adjacency'
import { GameState, CrewState, CREW_IDS, deepFreeze } from './state'
import { BoatAttackResult, attackBoat, attackCrew, attackHits, damageTile, woundCrew } from './sharkAttack'

const RAMMING_BONUS = 2
const DOMINO_HITS = 2
const SECOND_HELPING_DICE = 2

const update = (state: GameState, changes: Partial<GameState>): GameState =>
    deepFreeze(Object.assign({}, state, changes))

const withShark = (state: GameState, changes: Partial<GameState['shark']>): GameState =>
    update(state, { shark: Object.assign({}, state.shark, changes) })

const logged = (state: GameState, event: string, args: (string | number)[] = []): GameState =>
    update(state, { log: state.log.concat({ round: state.round, event, args }) })

function requireAbility(state: GameState, id: AbilityId): void {
    if (state.shark.ability !== id) throw new RangeError(`${id} is not in play this round`)
    if (state.shark.abilityUsed) throw new RangeError(`${id} has already been used this round`)
}

/** Step 2: one card from the hidden hand, face down (the log does not say which). */
export function playAbility(state: GameState, id: AbilityId): GameState {
    if (state.shark.ability) throw new RangeError('the shark already played an ability this round')
    const i = state.shark.hand.indexOf(id)
    if (i < 0) throw new RangeError(`${id} is not in the shark's hand`)
    const hand = state.shark.hand.slice()
    hand.splice(i, 1)
    return logged(withShark(state, { hand, ability: id, abilityUsed: false }), 'abilityPlayed')
}

/** End of round: the ability leaves the game, used or not [M p.8]. */
export function retireAbility(state: GameState): GameState {
    const id = state.shark.ability
    if (!id) return state
    return withShark(state, { played: state.shark.played.concat(id), ability: null, abilityUsed: false })
}

export function hardTargetActive(state: GameState): boolean {
    return state.shark.ability === 'hardTarget'
}

const rammingBonus = (state: GameState): number =>
    state.shark.ability === 'rammingSpeed' && state.shark.abilityUsed ? RAMMING_BONUS : 0

/** Ramming Speed, after the crew attacks: move to an adjacent water; the main attack then gets +2. */
export function rammingMove(state: GameState, zone: Zone): GameState {
    requireAbility(state, 'rammingSpeed')
    const from = state.shark.space
    const to: Space = { kind: 'water', zone }
    if (!from || !areAdjacent(state.tiles, from, to)) throw new RangeError(`the shark cannot ram into water ${zone}`)
    return logged(withShark(state, { space: to, abilityUsed: true }), 'rammingSpeed', [zone])
}

export interface BoatAttackOptions {
    /** Domino Effect: the deck next to the damaged one that takes 2 hits. */
    readonly domino?: Zone
}

/** The shark's main attack on a deck, with whatever ability is in play. */
export function sharkAttackBoat(state: GameState, card: ResurfaceCard, zone: Zone, faces: readonly number[],
    opts: BoatAttackOptions = {}): BoatAttackResult {
    const before = state.tiles[zone]
    const r = attackBoat(state, card, zone, faces, rammingBonus(state))
    const damaged = r.tile !== before
    const ability = state.shark.ability
    let s = r.state
    let tile = r.tile

    if (opts.domino !== undefined && (ability !== 'dominoEffect' || !damaged)) {
        throw new RangeError('Domino Effect needs the card in play and a damaged deck')
    }
    if (damaged && ability === 'extraStrength' && tile === 'damaged') {
        s = damageTile(s, zone, Infinity, 'extraStrength').state
        tile = 'gone'
    }
    if (damaged && ability === 'bigMouth') {
        for (const id of r.fell) s = woundCrew(s, id, 1)
        s = logged(s, 'bigMouth', r.fell.slice())
    }
    if (damaged && ability === 'makingWaves') {
        const crew: Record<CrewId, CrewState> = Object.assign({}, s.crew)
        for (const id of CREW_IDS) {
            const sp = crew[id].space
            if (sp && sp.kind === 'boat') crew[id] = Object.assign({}, crew[id], { space: { kind: 'water', zone: sp.zone } })
        }
        s = logged(update(s, { crew }), 'makingWaves')
    }
    if (opts.domino !== undefined) {
        const next = opts.domino
        if (TILE_ADJ[zone].indexOf(next) < 0 || s.tiles[next] === 'gone') {
            throw new RangeError(`deck ${next} is not a deck next to ${zone}`)
        }
        s = withShark(damageTile(s, next, DOMINO_HITS, 'dominoEffect').state, { abilityUsed: true })
    }
    return { state: s, hits: r.hits, tile, fell: r.fell }
}

/** The shark's main attack on a crew member in the water, with whatever ability is in play. */
export function sharkAttackCrew(state: GameState, card: ResurfaceCard, crewId: CrewId,
    faces: readonly number[]): GameState {
    return attackCrew(state, card, crewId, faces, rammingBonus(state))
}

export function secondHelpingDice(state: GameState): number {
    return state.shark.tranquilized ? 1 : SECOND_HELPING_DICE
}

/** Second Helping: after a boat attack, another one with 2 dice at a deck within reach (same or other). */
export function secondHelping(state: GameState, zone: Zone, faces: readonly number[]): BoatAttackResult {
    requireAbility(state, 'secondHelping')
    const attackedBoat = state.log.some(e => e.round === state.round && e.event === 'sharkAttackBoat')
    if (!attackedBoat) throw new RangeError('Second Helping follows an attack on the boat')
    const from = state.shark.space
    const target: Space = { kind: 'boat', zone }
    if (!from || !spaceExists(state.tiles, target) || !adjacentSpaces(state.tiles, from).some(s => s.kind === 'boat' && s.zone === zone)) {
        throw new RangeError(`the shark cannot reach deck ${zone}`)
    }
    const dice = secondHelpingDice(state)
    if (faces.length !== dice) throw new RangeError(`Second Helping rolls ${dice} dice, got ${faces.length}`)
    for (const f of faces) if (f !== 0 && f !== 1 && f !== 2) throw new RangeError(`a die shows 0, 1 or 2 hits, got ${f}`)
    const r = damageTile(state, zone, attackHits(faces, state.shark.attached), 'secondHelping')
    return Object.assign({}, r, { state: withShark(r.state, { abilityUsed: true }) })
}

/** Maul Again: after rolling one attack (main or bonus), reroll the chosen dice once [FW 2236208]. */
export function maulAgain(state: GameState, faces: readonly number[], reroll: readonly number[],
    newFaces: readonly number[]): { faces: number[]; state: GameState } {
    requireAbility(state, 'maulAgain')
    if (reroll.length !== newFaces.length) throw new RangeError('one new face per rerolled die')
    reroll.forEach((i, k) => {
        if (!Number.isInteger(i) || i < 0 || i >= faces.length || reroll.indexOf(i) !== k) {
            throw new RangeError(`cannot reroll die ${i}`)
        }
    })
    for (const f of newFaces) if (f !== 0 && f !== 1 && f !== 2) throw new RangeError(`a die shows 0, 1 or 2 hits, got ${f}`)
    const out = faces.slice()
    reroll.forEach((i, k) => { out[i] = newFaces[k] })
    return { faces: out, state: logged(withShark(state, { abilityUsed: true }), 'maulAgain', [reroll.length]) }
}
