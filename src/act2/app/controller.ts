/**
 * The Act II game as the app runs it (BLUEPRINT P-23/P-24): what to ask the table next, how each
 * answer drives the engine and the SharkBrain, and what to tell the table. Pure TypeScript (no
 * Phaser), so the whole flow is unit-tested; the scenes only draw the current phase.
 *
 * Phases follow the round with as few taps as possible: 3 cards → (moves, Chum) → reveal → who aimed
 * right → their hits → the shark's rolls (none with app dice) → summary. Every answer pushes the
 * previous session onto `history`, so undo is one pop.
 */
import type { Zone, Space, CrewId, GearId, ResurfaceId, ResurfaceCard } from '../core/types'
import { RESURFACE_CARDS, GEAR } from '../core/data'
import { GameState, CREW_IDS, LogEntry, serialize, deserialize } from '../core/state'
import { setupGame, SetupInput } from '../core/setup'
import {
    setOptions, sharkChoose, playChum, crewPrepare, reveal, shiftPistol, crewAttack, endCrewAttacks,
    ram, cage, sharkMain, sharkSecondHelping, sharkBonus, endRound, currentCard, PrepareInput,
} from '../core/round'
import { canMoveTo, targetableZones, coveredZones } from '../core/movement'
import { needsReroll } from '../core/crewAttack'
import { SharkTarget, mainAttackDice, bonusAttackDice, bonusAttackTargets, rollDice } from '../core/sharkAttack'
import { maulAgain, sharkAttackBoat, secondHelpingDice } from '../core/abilities'
import { adjacentSpaces } from '../core/adjacency'
import { DEFAULT_PARAMS } from '../core/ai/params'
import { createSharkBrain, SharkBrain } from '../core/ai/sharkBrain'
import { crewThreats } from '../core/ai/threat'

export const SESSION_VERSION = 2
const HISTORY_LIMIT = 40

export interface Settings {
    /** D-1: the app rolls the shark's dice (default: at the table). */
    readonly appDice: boolean
    /** D-3: unofficial variant, bonus attacks roll the card dice. */
    readonly variant: boolean
    /** D-4: anti-stall on (default). */
    readonly antiStall: boolean
}

export const DEFAULT_SETTINGS: Settings = { appDice: false, variant: false, antiStall: true }

/** One line for the table: an i18n key and its arguments. */
export interface Line {
    readonly key: string
    readonly args?: readonly (string | number)[]
}

export interface Declared {
    readonly crew: CrewId
    readonly weapon: GearId
    /** Pistol aimed at a water next to the shark's and moved after the reveal. */
    readonly pistolShift: boolean
}

export type RollWhat = 'main' | 'maul' | 'second' | 'bonus' | 'flare'

export type Phase =
    | { readonly kind: 'options' }
    /** The shark has chosen: move tokens, maybe play Chum, then reveal. */
    | { readonly kind: 'prepare'; readonly abilityPlayed: boolean }
    /** The shark is shown (engine still in step 3): who aimed at its zone. */
    | { readonly kind: 'hits'; readonly declared: readonly Declared[] }
    /** queue[0] enters their hits; `first` holds the Bat's missed roll. */
    | { readonly kind: 'crewRoll'; readonly queue: readonly Declared[]; readonly first: readonly number[] | null }
    | { readonly kind: 'cage'; readonly holders: readonly CrewId[] }
    | {
        readonly kind: 'sharkRoll'; readonly what: RollWhat; readonly dice: number; readonly perDie: boolean
        readonly target: SharkTarget | null; readonly crew: CrewId | null
        readonly faces: readonly number[] | null; readonly reroll: readonly number[] | null
        readonly bonus: Readonly<Partial<Record<CrewId, readonly number[]>>>
    }
    | { readonly kind: 'summary' }
    | { readonly kind: 'over'; readonly winner: 'shark' | 'crew' }

export interface Session {
    readonly version: number
    readonly settings: Settings
    readonly state: GameState
    readonly phase: Phase
    /** Step 3 positions chosen in the app (applied at the reveal). */
    readonly moves: Readonly<Partial<Record<CrewId, Space>>>
    /** What to tell the table now. */
    readonly lines: readonly Line[]
    readonly history: readonly string[]
}

// ---------------------------------------------------------------- helpers

export const cardById = (id: ResurfaceId): ResurfaceCard => RESURFACE_CARDS.filter(c => c.id === id)[0]

const brainOf = (s: Session): SharkBrain => {
    return createSharkBrain(s.settings.antiStall ? DEFAULT_PARAMS : Object.assign({}, DEFAULT_PARAMS, { stallFactor: 1 }))
}

/** Faces for a total entered at the table (the dice show 2s first, then 1s). */
export function facesFor(hits: number, dice: number, fishingPole = false): number[] {
    const max = fishingPole ? dice : 2 * dice
    if (!Number.isInteger(hits) || hits < 0 || hits > max) throw new RangeError(`${dice} dice cannot show ${hits} hits`)
    const out: number[] = []
    let left = hits
    for (let i = 0; i < dice; i++) {
        const f = !fishingPole && left >= 2 ? 2 : left >= 1 ? 1 : 0
        out.push(f)
        left -= f
    }
    return out
}

/** Table lines for the log entries added since `from`, plus crew who fell into the water. */
function linesSince(before: GameState, after: GameState): Line[] {
    const out: Line[] = []
    const fresh: LogEntry[] = after.log.slice(before.log.length)
    for (const e of fresh) {
        const a = e.args || []
        switch (e.event) {
            case 'abilityRevealed': out.push({ key: 'act2.msg.findAbility', args: [`act2.ability.${a[0]}`] }); break
            case 'shakeOff': out.push({ key: 'act2.msg.shakeOff', args: a.map(g => `act2.gear.${g}`) }); break
            case 'reveal': out.push({ key: 'act2.msg.surfaces', args: [a[1]] }); break
            case 'crewAttack': out.push({ key: 'act2.msg.crewAttack', args: [`act2.crew.${a[0]}`, Number(a[2]), after.shark.wounds] }); break
            case 'pistolShift': out.push({ key: 'act2.msg.pistolShift', args: [`act2.crew.${a[0]}`, a[1]] }); break
            case 'rammingSpeed': out.push({ key: 'act2.msg.rams', args: [a[0]] }); break
            case 'sharkCage': out.push({ key: 'act2.msg.cage', args: [`act2.crew.${a[0]}`] }); break
            case 'sharkHolds': out.push({ key: 'act2.msg.holds' }); break
            case 'sharkAttackBoat':
            case 'secondHelping':
            case 'dominoEffect':
                out.push({ key: `act2.msg.deck.${a[2]}`, args: [a[0], Number(a[1])] }); break
            case 'extraStrength': out.push({ key: 'act2.msg.deck.gone', args: [a[0], 'X'] }); break
            case 'sharkAttackCrew': out.push({ key: 'act2.msg.bites', args: [`act2.crew.${a[0]}`, Number(a[1])] }); break
            case 'sharkBonusAttack': out.push({ key: 'act2.msg.bonus', args: [`act2.crew.${a[0]}`, Number(a[1])] }); break
            case 'bigMouth': if (a.length > 0) out.push({ key: 'act2.msg.bigMouth', args: a.map(c => `act2.crew.${c}`) }); break
            case 'makingWaves': out.push({ key: 'act2.msg.makingWaves' }); break
            case 'crewEliminated': out.push({ key: 'act2.msg.eliminated', args: [`act2.crew.${a[0]}`] }); break
            case 'flare': out.push({ key: 'act2.msg.flare', args: [Number(a[0])] }); break
            case 'gameOver': out.push({ key: `act2.msg.winner.${a[0]}` }); break
            default: break
        }
    }
    for (const id of CREW_IDS) {
        const was = before.crew[id].space
        const now = after.crew[id].space
        if (was && now && was.kind === 'boat' && now.kind === 'water') out.push({ key: 'act2.msg.falls', args: [`act2.crew.${id}`, now.zone] })
    }
    return out
}

function push(s: Session, changes: Partial<Session>): Session {
    const history = s.history.concat(serializeSession(Object.assign({}, s, { history: [] }))).slice(-HISTORY_LIMIT)
    return Object.assign({}, s, changes, { history })
}

function over(s: Session): Session | null {
    return s.state.winner ? Object.assign({}, s, { phase: { kind: 'over', winner: s.state.winner } }) : null
}

// ---------------------------------------------------------------- start

export function newSession(input: SetupInput, settings: Settings = DEFAULT_SETTINGS): Session {
    return {
        version: SESSION_VERSION, settings, state: setupGame(input), phase: { kind: 'options' },
        moves: {}, lines: [{ key: 'act2.msg.newGame', args: [input.swimmersEaten === null ? 6 : input.swimmersEaten + 1] }], history: [],
    }
}

export function changeSettings(s: Session, settings: Partial<Settings>): Session {
    return Object.assign({}, s, { settings: Object.assign({}, s.settings, settings) })
}

// ---------------------------------------------------------------- steps 1-3

export function enterOptions(s: Session, ids: readonly ResurfaceId[]): Session {
    if (s.phase.kind !== 'options') throw new RangeError('not choosing options now')
    const brain = brainOf(s)
    const withOptions = setOptions(s.state, ids)
    const d = brain.decideStep2(withOptions)
    const state = sharkChoose(d.state, d.choice, d.ability || undefined)
    const lines: Line[] = [{ key: 'act2.msg.sharkDecided' }]
    if (d.ability) lines.push({ key: 'act2.msg.abilityFaceDown' })
    return push(s, { state, phase: { kind: 'prepare', abilityPlayed: !!d.ability }, moves: {}, lines })
}

export function chumHolders(s: Session): CrewId[] {
    if (s.phase.kind !== 'prepare' || s.state.turn.chum) return []
    return CREW_IDS.filter(id => s.state.crew[id].space && s.state.crew[id].gear.indexOf('chum') >= 0)
}

export function useChum(s: Session, crewId: CrewId): Session {
    if (chumHolders(s).indexOf(crewId) < 0) throw new RangeError(`${crewId} cannot play Chum now`)
    const shown = brainOf(s).onChum(s.state)
    const state = playChum(s.state, crewId, shown)
    return push(s, { state, lines: s.lines.concat({ key: 'act2.msg.chumShown', args: ['ABC'[shown]] }) })
}

/** Where a crew member will be at the reveal (moved in the app, or where they were). */
export function positionOf(s: Session, crewId: CrewId): Space | null {
    return s.moves[crewId] || s.state.crew[crewId].space
}

export function moveCrew(s: Session, crewId: CrewId, to: Space): Session {
    if (s.phase.kind !== 'prepare') throw new RangeError('crew move in step 3')
    const from = s.state.crew[crewId].space
    if (!from || !canMoveTo(s.state.tiles, from, to)) throw new RangeError(`${crewId} cannot move there`)
    const same = from.kind === to.kind && from.zone === to.zone
    const moves: Partial<Record<CrewId, Space>> = Object.assign({}, s.moves)
    if (same) delete moves[crewId]
    else moves[crewId] = to
    return push(s, { moves })
}

/** The shark is shown in the app; the engine reveal waits until the crew says who aimed there. */
export function revealShark(s: Session): Session {
    if (s.phase.kind !== 'prepare') throw new RangeError('reveal after step 3')
    const card = currentCard(s.state)
    const lines: Line[] = [{ key: 'act2.msg.surfaces', args: [card.zone] }]
    if (s.state.shark.ability) lines.push({ key: 'act2.msg.findAbility', args: [`act2.ability.${s.state.shark.ability}`] })
    if (card.shakeOff && s.state.shark.attached.length > 0) lines.push({ key: 'act2.msg.shakeOff', args: s.state.shark.attached.map(g => `act2.gear.${g}`) })
    return push(s, { phase: { kind: 'hits', declared: [] }, lines })
}

/** Weapons a crew member could have hit the shark with, best first (the app preselects the first). */
export function hitWeapons(s: Session, crewId: CrewId): GearId[] {
    const where = positionOf(s, crewId)
    if (!where) return []
    const card = currentCard(s.state)
    const zone = card.zone
    const best = crewThreats(Object.assign({}, s.state, { crew: Object.assign({}, s.state.crew, { [crewId]: Object.assign({}, s.state.crew[crewId], { space: where }) }) }), card, {}, DEFAULT_PARAMS)
        .filter(t => t.crew === crewId)[0]
    const list = s.state.crew[crewId].gear.filter((g, i, all) => all.indexOf(g) === i && GEAR[g].kind !== 'accessory' &&
        (targetableZones(s.state.tiles, where, g).indexOf(zone) >= 0 || g === 'pistol'))
    return list.sort((a, b) => (a === (best && best.weapon) ? -1 : b === (best && best.weapon) ? 1 : 0))
}

export function declareHit(s: Session, crewId: CrewId, weapon: GearId | null, pistolShift = false): Session {
    if (s.phase.kind !== 'hits') throw new RangeError('not declaring hits now')
    const rest = s.phase.declared.filter(d => d.crew !== crewId)
    if (weapon === null) return push(s, { phase: { kind: 'hits', declared: rest } })
    if (hitWeapons(s, crewId).indexOf(weapon) < 0) throw new RangeError(`${crewId} cannot have hit with ${weapon}`)
    return push(s, { phase: { kind: 'hits', declared: rest.concat({ crew: crewId, weapon, pistolShift: weapon === 'pistol' && pistolShift }) } })
}

function aimFor(s: Session, d: Declared, zone: Zone): Zone {
    if (!d.pistolShift) return zone
    const next = adjacentSpaces(s.state.tiles, { kind: 'water', zone }).filter(w => w.kind === 'water')[0]
    return next ? next.zone : zone
}

export function confirmHits(s: Session): Session {
    if (s.phase.kind !== 'hits') throw new RangeError('not declaring hits now')
    const zone = currentCard(s.state).zone
    const plans: { [id: string]: { to?: Space; weapon?: GearId; target?: Zone } } = {}
    for (const id of CREW_IDS) if (s.moves[id]) plans[id] = { to: s.moves[id] }
    for (const d of s.phase.declared) plans[d.crew] = Object.assign({}, plans[d.crew], { weapon: d.weapon, target: aimFor(s, d, zone) })
    const before = s.state
    let state = reveal(crewPrepare(s.state, plans as PrepareInput))
    for (const d of s.phase.declared) {
        if (d.pistolShift && coveredZones(state.tiles, 'pistol', aimFor(s, d, zone)).indexOf(zone) >= 0) state = shiftPistol(state, d.crew, zone)
    }
    // The reveal itself was shown already: keep only what follows (Pistol shifts).
    const shown = ['act2.msg.surfaces', 'act2.msg.findAbility', 'act2.msg.shakeOff']
    let next: Session = push(s, { state, moves: {}, lines: s.lines.concat(linesSince(before, state).filter(l => shown.indexOf(l.key) < 0)) })
    // Attachables hook on without dice: resolve them all first, then queue the dice weapons.
    const queue = s.phase.declared.filter(d => GEAR[d.weapon].dice > 0)
    for (const d of s.phase.declared.filter(x => GEAR[x.weapon].dice === 0)) {
        const b = next.state
        next = Object.assign({}, next, { state: crewAttack(next.state, d.crew, []) })
        next = Object.assign({}, next, { lines: next.lines.concat(linesSince(b, next.state)) })
        const done = over(next)
        if (done) return done
    }
    return queue.length > 0 ? Object.assign({}, next, { phase: { kind: 'crewRoll', queue, first: null } }) : sharkTurn(next)
}

// ---------------------------------------------------------------- step 5

export function enterCrewHits(s: Session, hits: number): Session {
    if (s.phase.kind !== 'crewRoll') throw new RangeError('no crew roll now')
    const d = s.phase.queue[0]
    const g = GEAR[d.weapon]
    const faces = facesFor(hits, g.dice)
    const rolls = s.phase.first ? [s.phase.first, faces] : [faces]
    const card = currentCard(s.state)
    const input = { weapon: d.weapon, gear: s.state.crew[d.crew].gear, rolls, evade: card.evade, hardTarget: s.state.shark.ability === 'hardTarget', attached: s.state.shark.attached }
    if (!s.phase.first && d.weapon === 'bat' && needsReroll(input)) {
        return push(s, { phase: { kind: 'crewRoll', queue: s.phase.queue, first: faces }, lines: [{ key: 'act2.msg.batReroll', args: [`act2.crew.${d.crew}`] }] })
    }
    const state = crewAttack(s.state, d.crew, rolls)
    let next = push(s, { state, lines: linesSince(s.state, state) })
    const done = over(next)
    if (done) return done
    const queue = s.phase.queue.slice(1)
    if (queue.length > 0) return Object.assign({}, next, { phase: { kind: 'crewRoll', queue, first: null } })
    next = Object.assign({}, next, { phase: { kind: 'summary' } })
    return sharkTurn(next)
}

// ---------------------------------------------------------------- step 6

function sharkTurn(s: Session): Session {
    const brain = brainOf(s)
    let state = s.state.turn.step === 'crewAttacks' ? endCrewAttacks(s.state) : s.state
    const before = s.state
    const move = brain.afterCrewAttacks(state)
    if (move !== null) state = ram(state, move)
    const lines = s.lines.concat(linesSince(before, state))
    // Ask about the Shark Cage only when whoever holds it is exposed in the water near the shark.
    const exposed = bonusAttackTargets(state)
    const holders = exposed.filter(id => state.crew[id].gear.indexOf('sharkCage') >= 0 && !state.crew[id].caged)
    const next: Session = Object.assign({}, s, { state, lines })
    if (holders.length > 0 && brain.decideAttack(state) !== null) return Object.assign({}, next, { phase: { kind: 'cage', holders } })
    return startMain(next)
}

export function answerCage(s: Session, crewId: CrewId | null): Session {
    if (s.phase.kind !== 'cage') throw new RangeError('no Shark Cage question now')
    const state = crewId ? cage(s.state, crewId) : s.state
    return startMain(push(s, { state, lines: linesSince(s.state, state) }))
}

const pole = (state: GameState): boolean => state.shark.attached.indexOf('fishingPole') >= 0

function rollPhase(what: RollWhat, dice: number, perDie: boolean, target: SharkTarget | null, crew: CrewId | null,
    faces: readonly number[] | null = null, reroll: readonly number[] | null = null,
    bonus: Readonly<Partial<Record<CrewId, readonly number[]>>> = {}): Phase {
    return { kind: 'sharkRoll', what, dice, perDie, target, crew, faces, reroll, bonus }
}

function startMain(s: Session): Session {
    const brain = brainOf(s)
    const target = brain.decideAttack(s.state)
    if (!target) {
        const state = sharkMain(s.state, null, [])
        return startBonus(Object.assign({}, s, { state, lines: s.lines.concat(linesSince(s.state, state)) }))
    }
    const lines = s.lines.concat(target.kind === 'boat'
        ? { key: 'act2.msg.attacksDeck', args: [target.zone] }
        : { key: 'act2.msg.attacksCrew', args: [`act2.crew.${target.crew}`] })
    const dice = mainAttackDice(s.state, currentCard(s.state))
    const maul = s.state.shark.ability === 'maulAgain' && !s.state.shark.abilityUsed
    const next = Object.assign({}, s, { lines, phase: rollPhase('main', dice, maul, target, null) })
    return s.settings.appDice ? autoRoll(next) : next
}

function autoRoll(s: Session): Session {
    if (s.phase.kind !== 'sharkRoll') return s
    const r = rollDice(s.state, s.phase.dice)
    return applyRoll(Object.assign({}, s, { state: r.state }), r.faces)
}

/** The shark's dice, entered at the table: a total, or one face per die when Maul Again needs it. */
export function enterSharkRoll(s: Session, input: number | readonly number[]): Session {
    if (s.phase.kind !== 'sharkRoll') throw new RangeError('no shark roll now')
    const faces = typeof input === 'number' ? facesFor(input, s.phase.dice, pole(s.state)) : input.slice()
    if (faces.length !== s.phase.dice) throw new RangeError(`enter ${s.phase.dice} dice`)
    return applyRoll(push(s, {}), faces)
}

function applyRoll(s: Session, faces: number[]): Session {
    const ph = s.phase
    if (ph.kind !== 'sharkRoll') return s
    const brain = brainOf(s)
    if (ph.what === 'main' && ph.target) {
        const rerolls = brain.decideRerolls(s.state, ph.target, faces)
        if (rerolls.length > 0) {
            const lines = s.lines.concat({ key: 'act2.msg.maul', args: rerolls.map(i => i + 1) })
            const next = Object.assign({}, s, { lines, phase: rollPhase('maul', rerolls.length, true, ph.target, null, faces, rerolls) })
            return s.settings.appDice ? autoRoll(next) : next
        }
        return resolveMain(s, ph.target, faces)
    }
    if (ph.what === 'maul' && ph.target && ph.faces && ph.reroll) {
        const m = maulAgain(s.state, ph.faces, ph.reroll, faces)
        return resolveMain(Object.assign({}, s, { state: m.state }), ph.target, m.faces)
    }
    if (ph.what === 'second') {
        const zone = brain.decideSecondHelping(s.state)
        const state = zone === null ? s.state : sharkSecondHelping(s.state, zone, faces)
        const next = Object.assign({}, s, { state, lines: s.lines.concat(linesSince(s.state, state)) })
        return over(next) || startBonus(next)
    }
    if (ph.what === 'bonus' && ph.crew) {
        const bonus = Object.assign({}, ph.bonus, { [ph.crew]: faces })
        return nextBonus(Object.assign({}, s, { phase: rollPhase('bonus', ph.dice, false, null, null, null, null, bonus) }))
    }
    if (ph.what === 'flare') return finishRound(s, faces)
    return s
}

function resolveMain(s: Session, target: SharkTarget, faces: number[]): Session {
    const brain = brainOf(s)
    const card = currentCard(s.state)
    const opts: { domino?: Zone } = {}
    if (target.kind === 'boat' && s.state.shark.ability === 'dominoEffect' && !s.state.shark.abilityUsed) {
        const preview = sharkAttackBoat(s.state, card, target.zone, faces)
        if (preview.tile !== s.state.tiles[target.zone]) {
            const z = brain.decideDomino(preview.state, target.zone)
            if (z !== null) opts.domino = z
        }
    }
    const state = sharkMain(s.state, target, faces, opts)
    const next = Object.assign({}, s, { state, lines: s.lines.concat(linesSince(s.state, state)) })
    const done = over(next)
    if (done) return done
    if (target.kind === 'boat' && state.shark.ability === 'secondHelping' && !state.shark.abilityUsed && brain.decideSecondHelping(state) !== null) {
        const zone = brain.decideSecondHelping(state) as Zone
        const ask = Object.assign({}, next, {
            lines: next.lines.concat({ key: 'act2.msg.secondHelping', args: [zone] }),
            phase: rollPhase('second', secondHelpingDice(state), false, { kind: 'boat', zone }, null),
        })
        return s.settings.appDice ? autoRoll(ask) : ask
    }
    return startBonus(next)
}

function startBonus(s: Session): Session {
    const done = over(s)
    if (done) return done
    return nextBonus(Object.assign({}, s, { phase: rollPhase('bonus', bonusAttackDice(s.state, currentCard(s.state), s.settings.variant), false, null, null) }))
}

function nextBonus(s: Session): Session {
    const ph = s.phase
    if (ph.kind !== 'sharkRoll') return s
    const pending = bonusAttackTargets(s.state).filter(id => !ph.bonus[id])
    if (pending.length > 0) {
        const crew = pending[0]
        const ask = Object.assign({}, s, {
            lines: s.lines.concat({ key: 'act2.msg.bonusAttack', args: [`act2.crew.${crew}`] }),
            phase: rollPhase('bonus', ph.dice, false, { kind: 'crew', crew }, crew, null, null, ph.bonus),
        })
        return s.settings.appDice ? autoRoll(ask) : ask
    }
    const state = sharkBonus(s.state, ph.bonus, s.settings.variant)
    const next = Object.assign({}, s, { state, lines: s.lines.concat(linesSince(s.state, state)) })
    const done = over(next)
    if (done) return done
    if (state.shark.attached.indexOf('flare') >= 0) {
        const ask = Object.assign({}, next, { lines: next.lines.concat({ key: 'act2.msg.flareRoll' }), phase: rollPhase('flare', 1, false, null, null) })
        return s.settings.appDice ? autoRoll(ask) : ask
    }
    return finishRound(next, null)
}

// ---------------------------------------------------------------- step 7

function finishRound(s: Session, flare: number[] | null): Session {
    const state = flare ? endRound(s.state, flare) : endRound(s.state)
    const next = Object.assign({}, s, { state, lines: s.lines.concat(linesSince(s.state, state)) })
    return over(next) || Object.assign({}, next, { phase: { kind: 'summary' } })
}

export function nextRound(s: Session): Session {
    if (s.phase.kind !== 'summary') throw new RangeError('the round is not over')
    return push(s, { phase: { kind: 'options' }, lines: [{ key: 'act2.msg.round', args: [s.state.round] }] })
}

// ---------------------------------------------------------------- undo, save

export function undo(s: Session): Session {
    if (s.history.length === 0) return s
    const prev = deserializeSession(s.history[s.history.length - 1])
    return Object.assign({}, prev, { history: s.history.slice(0, -1) })
}

export function serializeSession(s: Session): string {
    return JSON.stringify(Object.assign({}, s, { state: serialize(s.state) }))
}

export function deserializeSession(text: string): Session {
    const data = JSON.parse(text)
    if (!data || data.version !== SESSION_VERSION) throw new TypeError('not a saved Act II session of this version')
    return Object.assign({}, data, { state: deserialize(data.state) })
}
