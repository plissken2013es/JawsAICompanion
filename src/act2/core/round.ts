/**
 * One round as a step machine (SPECS §3.3, rulebook p.8-11). Every action checks that it is its
 * step, returns a new state, and the game ends the moment someone wins (SPECS §3.4): the crew can
 * win in step 5 before the shark attacks. Hidden information (the shark's choice and hand) lives in
 * the state but never in the log.
 */
import type { Zone, Space, CrewId, GearId, AbilityId, ResurfaceId, ResurfaceCard } from './types'
import { RESURFACE_CARDS, GEAR, SHARK_HEALTH, ZONES } from './data'
import { areAdjacent } from './adjacency'
import { canMoveTo, targetableZones } from './movement'
import { GameState, CrewState, CrewPlan, Step, NEW_TURN, CREW_IDS, deepFreeze } from './state'
import { resolveCrewAttack, applyCrewAttack } from './crewAttack'
import { SharkTarget, bonusAttacks, playSharkCage } from './sharkAttack'
import {
    playAbility, retireAbility, hardTargetActive, rammingMove, secondHelping,
    sharkAttackBoat, sharkAttackCrew, BoatAttackOptions,
} from './abilities'

const update = (state: GameState, changes: Partial<GameState>): GameState =>
    deepFreeze(Object.assign({}, state, changes))

const withTurn = (state: GameState, changes: Partial<GameState['turn']>): GameState =>
    update(state, { turn: Object.assign({}, state.turn, changes) })

const logged = (state: GameState, event: string, args: (string | number)[] = []): GameState =>
    update(state, { log: state.log.concat({ round: state.round, event, args }) })

function expectStep(state: GameState, ...steps: Step[]): void {
    if (state.winner) throw new RangeError(`the game is over: the ${state.winner} won`)
    if (steps.indexOf(state.turn.step) < 0) throw new RangeError(`not now: step is ${state.turn.step}, expected ${steps.join(' or ')}`)
}

const cardById = (id: ResurfaceId): ResurfaceCard => {
    const c = RESURFACE_CARDS.filter(x => x.id === id)[0]
    if (!c) throw new RangeError(`unknown Resurface card ${id}`)
    return c
}

/** The card the shark chose (known to the engine from step 2). */
export function currentCard(state: GameState): ResurfaceCard {
    const { options, choice } = state.turn
    if (choice === null) throw new RangeError('the shark has not chosen yet')
    return cardById(options[choice])
}

/** Ends the game if a side has won (SPECS §3.4). */
function settle(state: GameState): GameState {
    if (state.winner) return state
    let winner: GameState['winner'] = null
    if (state.shark.wounds >= SHARK_HEALTH) winner = 'crew'
    else if (CREW_IDS.every(id => !state.crew[id].space) || ZONES.every(z => state.tiles[z] === 'gone')) winner = 'shark'
    if (!winner) return state
    return logged(update(withTurn(state, { step: 'over' }), { winner }), 'gameOver', [winner])
}

// ---------------------------------------------------------------- step 1

export function setOptions(state: GameState, ids: readonly ResurfaceId[]): GameState {
    expectStep(state, 'options')
    if (ids.length !== 3 || ids.some((id, i) => ids.indexOf(id) !== i)) throw new RangeError('step 1 needs three different Resurface cards')
    ids.forEach(cardById)
    // A card back from the discard means the table reshuffled it into a new deck [M p.8].
    const reshuffled = ids.some(id => state.resurfaceDiscard.indexOf(id) >= 0)
    const s = update(withTurn(state, { step: 'choose', options: ids.slice() }), reshuffled ? { resurfaceDiscard: [] } : {})
    return logged(s, 'options', ids.slice())
}

// ---------------------------------------------------------------- step 2

export function sharkChoose(state: GameState, choice: number, ability?: AbilityId): GameState {
    expectStep(state, 'choose')
    if (choice !== 0 && choice !== 1 && choice !== 2) throw new RangeError(`choice must be 0, 1 or 2, got ${choice}`)
    const s = ability ? playAbility(state, ability) : state
    return logged(withTurn(s, { step: 'prepare', choice }), 'sharkChose')
}

/** Chum (step 3, once per round): the shark shows one of the two options it did not choose [M p.9]. */
export function playChum(state: GameState, crewId: CrewId, revealed: number): GameState {
    expectStep(state, 'prepare')
    if (state.turn.chum) throw new RangeError('only one Chum per round')
    if (revealed === state.turn.choice || [0, 1, 2].indexOf(revealed) < 0) throw new RangeError('Chum reveals an option the shark did not choose')
    const member = state.crew[crewId]
    const i = member.gear.indexOf('chum')
    if (i < 0 || !member.space) throw new RangeError(`${crewId} has no Chum`)
    const gear = member.gear.slice()
    gear.splice(i, 1)
    const s = update(state, { crew: Object.assign({}, state.crew, { [crewId]: Object.assign({}, member, { gear }) }) })
    return logged(withTurn(s, { chum: { by: crewId, revealed } }), 'chum', [crewId, state.turn.options[revealed]])
}

// ---------------------------------------------------------------- step 3

export interface PrepareEntry {
    readonly to?: Space
    readonly weapon?: GearId
    readonly target?: Zone
}
export type PrepareInput = Readonly<Partial<Record<CrewId, PrepareEntry>>>

export function crewPrepare(state: GameState, input: PrepareInput): GameState {
    expectStep(state, 'prepare')
    const crew: Record<CrewId, CrewState> = Object.assign({}, state.crew)
    const plans: Partial<Record<CrewId, CrewPlan>> = {}
    for (const id of CREW_IDS) {
        const entry = input[id]
        if (!entry) continue
        const from = crew[id].space
        if (!from) throw new RangeError(`${id} has been eliminated`)
        const to = entry.to || from
        if (!canMoveTo(state.tiles, from, to)) throw new RangeError(`${id} cannot move to ${to.kind} ${to.zone}`)
        crew[id] = Object.assign({}, crew[id], { space: to })
        if (entry.weapon === undefined && entry.target === undefined) continue
        const { weapon, target } = entry
        if (weapon === undefined || target === undefined) throw new RangeError(`${id} needs both a weapon and a target`)
        if (crew[id].gear.indexOf(weapon) < 0 || GEAR[weapon].kind === 'accessory') throw new RangeError(`${id} has no weapon ${weapon}`)
        if (targetableZones(state.tiles, to, weapon).indexOf(target) < 0) throw new RangeError(`${id} cannot target zone ${target} with ${weapon}`)
        plans[id] = { weapon, target, shifted: false, attacked: false }
    }
    return withTurn(update(state, { crew }), { step: 'reveal', plans })
}

// ---------------------------------------------------------------- step 4

export function reveal(state: GameState): GameState {
    expectStep(state, 'reveal')
    const card = currentCard(state)
    const others = state.turn.options.filter((_, i) => i !== state.turn.choice)
    let s = update(state, {
        shark: Object.assign({}, state.shark, { space: { kind: 'water', zone: card.zone } }),
        resurfaceDiscard: state.resurfaceDiscard.concat(others),
    })
    if (s.shark.ability) s = logged(s, 'abilityRevealed', [s.shark.ability])
    if (card.shakeOff && s.shark.attached.length > 0) {
        s = logged(update(s, { shark: Object.assign({}, s.shark, { attached: [] }) }), 'shakeOff', s.shark.attached.slice())
    }
    return logged(withTurn(s, { step: 'crewAttacks' }), 'reveal', [card.id, card.zone])
}

// ---------------------------------------------------------------- step 5

export function canAttack(state: GameState, crewId: CrewId): boolean {
    const plan = state.turn.plans[crewId]
    const here = state.shark.space
    return state.turn.step === 'crewAttacks' && !state.winner && !!plan && !plan.attacked &&
        !!here && plan.target === here.zone && !!state.crew[crewId].space
}

const withPlan = (state: GameState, crewId: CrewId, changes: Partial<CrewPlan>): GameState =>
    withTurn(state, { plans: Object.assign({}, state.turn.plans, { [crewId]: Object.assign({}, state.turn.plans[crewId], changes) }) })

/** The Pistol may move its Target Token to an adjacent water after the reveal [C]. */
export function shiftPistol(state: GameState, crewId: CrewId, zone: Zone): GameState {
    expectStep(state, 'crewAttacks')
    const plan = state.turn.plans[crewId]
    if (!plan || plan.weapon !== 'pistol' || plan.shifted || plan.attacked) throw new RangeError(`${crewId} cannot shift a Pistol token`)
    if (!areAdjacent(state.tiles, { kind: 'water', zone: plan.target }, { kind: 'water', zone })) {
        throw new RangeError(`water ${zone} is not next to water ${plan.target}`)
    }
    return logged(withPlan(state, crewId, { target: zone, shifted: true }), 'pistolShift', [crewId, zone])
}

export function crewAttack(state: GameState, crewId: CrewId, rolls: readonly (readonly number[])[], spend?: 'ammo' | 'weapon'): GameState {
    expectStep(state, 'crewAttacks')
    if (!canAttack(state, crewId)) throw new RangeError(`${crewId} cannot attack the shark now`)
    const plan = state.turn.plans[crewId] as CrewPlan
    const result = resolveCrewAttack({
        weapon: plan.weapon,
        gear: state.crew[crewId].gear,
        rolls,
        evade: currentCard(state).evade,
        hardTarget: hardTargetActive(state),
        attached: state.shark.attached,
        spend,
    })
    return settle(withPlan(applyCrewAttack(state, crewId, result), crewId, { attacked: true }))
}

export function endCrewAttacks(state: GameState): GameState {
    expectStep(state, 'crewAttacks')
    return withTurn(state, { step: 'sharkAttacks' })
}

// ---------------------------------------------------------------- step 6

/** Ramming Speed: move before the main attack (after the crew attacked). */
export function ram(state: GameState, zone: Zone): GameState {
    expectStep(state, 'sharkAttacks')
    if (state.turn.sharkAttacked) throw new RangeError('Ramming Speed moves before the shark attacks')
    return rammingMove(state, zone)
}

/** Shark Cage, before the shark rolls [C]. */
export function cage(state: GameState, crewId: CrewId): GameState {
    expectStep(state, 'crewAttacks', 'sharkAttacks')
    return playSharkCage(state, crewId)
}

/** The main attack: a deck, a crew member in the water, or null to skip it. */
export function sharkMain(state: GameState, target: SharkTarget | null, faces: readonly number[], opts: BoatAttackOptions = {}): GameState {
    expectStep(state, 'sharkAttacks')
    if (state.turn.sharkAttacked) throw new RangeError('the shark already attacked this round')
    const card = currentCard(state)
    let s = state
    if (target && target.kind === 'boat') s = sharkAttackBoat(state, card, target.zone, faces, opts).state
    else if (target) s = sharkAttackCrew(state, card, target.crew, faces)
    else s = logged(state, 'sharkHolds')
    return settle(withTurn(s, { sharkAttacked: true }))
}

export function sharkSecondHelping(state: GameState, zone: Zone, faces: readonly number[]): GameState {
    expectStep(state, 'sharkAttacks')
    if (!state.turn.sharkAttacked) throw new RangeError('Second Helping comes after the main attack')
    return settle(secondHelping(state, zone, faces).state)
}

export function sharkBonus(state: GameState, rolls: Readonly<Partial<Record<CrewId, readonly number[]>>>, variant = false): GameState {
    expectStep(state, 'sharkAttacks')
    if (!state.turn.sharkAttacked) throw new RangeError('the bonus attacks come after the main attack')
    return settle(withTurn(bonusAttacks(state, currentCard(state), variant, rolls), { step: 'endRound' }))
}

// ---------------------------------------------------------------- step 7

/** `flare`: the shark's 1-die roll when the Flare is attached [C]. */
export function endRound(state: GameState, flare?: readonly number[]): GameState {
    expectStep(state, 'endRound')
    const burning = state.shark.attached.indexOf('flare') >= 0
    if (burning !== !!flare) throw new RangeError(burning ? 'the Flare is attached: roll 1 die for it' : 'no Flare attached')
    let s = state
    if (flare) {
        if (flare.length !== 1 || [0, 1, 2].indexOf(flare[0]) < 0) throw new RangeError('the Flare rolls 1 die')
        s = logged(update(s, { shark: Object.assign({}, s.shark, { wounds: s.shark.wounds + flare[0] }) }), 'flare', [flare[0]])
        s = settle(s)
        if (s.winner) return s
    }
    s = retireAbility(s)
    const crew: Record<CrewId, CrewState> = Object.assign({}, s.crew)
    for (const id of CREW_IDS) crew[id] = Object.assign({}, crew[id], { caged: false })
    return update(s, {
        round: s.round + 1,
        turn: NEW_TURN,
        crew,
        shark: Object.assign({}, s.shark, { space: null, tranquilized: false }),
        resurfaceDiscard: s.resurfaceDiscard.concat(currentCard(s).id),
    })
}
