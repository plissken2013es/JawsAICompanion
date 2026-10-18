/**
 * One simulated Act II game (BLUEPRINT P-19): the table (shuffled Resurface deck with reshuffles,
 * random gear deal, the crew's own dice) around the real engine, the SharkBrain and the crew bot.
 * The shark's dice come from the game RNG, as when the app rolls them (D-1).
 */
import type { AbilityId, CrewId, GearId, ResurfaceId } from '../../src/act2/core/types'
import { RESURFACE_CARDS, COMMON_GEAR_DECK, GEAR, DIE_FACES, setupFromSwimmersEaten, STANDALONE_SETUP } from '../../src/act2/core/data'
import { GameState, CREW_IDS } from '../../src/act2/core/state'
import { Rng, createRng } from '../../src/act2/core/rng'
import { setupGame } from '../../src/act2/core/setup'
import {
    setOptions, sharkChoose, playChum, crewPrepare, reveal, shiftPistol, crewAttack, endCrewAttacks,
    ram, cage, sharkMain, sharkSecondHelping, sharkBonus, endRound, currentCard, canAttack,
} from '../../src/act2/core/round'
import { mainAttackDice, bonusAttackDice, bonusAttackTargets, rollDice } from '../../src/act2/core/sharkAttack'
import { needsReroll } from '../../src/act2/core/crewAttack'
import { maulAgain, sharkAttackBoat, secondHelpingDice } from '../../src/act2/core/abilities'
import { AiParams, Level, DEFAULT_PARAMS } from '../../src/act2/core/ai/params'
import { createSharkBrain } from '../../src/act2/core/ai/sharkBrain'
import { botSetupGear, botChum, botPrepare, botCage, botPistolShift, BOT_START } from './crewBot'

const ALL_IDS: readonly ResurfaceId[] = RESURFACE_CARDS.map(c => c.id)

/** The physical Resurface deck: draws 3 a round, reshuffles the discard when it runs out [M p.8]. */
export function createResurfaceDeck(rng: Rng): { draw3(): ResurfaceId[] } {
    let deck = rng.shuffle(ALL_IDS)
    return {
        draw3() {
            const out: ResurfaceId[] = []
            while (out.length < 3) {
                if (deck.length === 0) deck = rng.shuffle(ALL_IDS.filter(id => out.indexOf(id) < 0))
                out.push(deck.shift() as ResurfaceId)
            }
            return out
        },
    }
}

export function dealCommonGear(rng: Rng, count: number): GearId[] {
    return rng.shuffle(COMMON_GEAR_DECK).slice(0, count)
}

export interface RunOptions {
    readonly shark?: Level | AiParams
    /** The crew bot's model of the shark. */
    readonly crewModel?: AiParams
    /** Act I swimmers eaten (0-9), null = Act II on its own. */
    readonly swimmersEaten?: number | null
    /** Unofficial variant: bonus attacks roll the card dice (D-3). */
    readonly variant?: boolean
    readonly maxRounds?: number
}

export interface GameReport {
    readonly seed: number
    readonly winner: 'shark' | 'crew' | 'none'
    readonly rounds: number
    /** Longest run of rounds in a row without a shark attack. */
    readonly maxStall: number
    readonly abilitiesPlayed: Partial<Record<AbilityId, number>>
    /** Wounds the shark took, by source (crew weapon, flare, canister). */
    readonly sharkWoundsBy: Record<string, number>
    readonly state: GameState
}

const rollCrew = (rng: Rng, n: number): number[] => {
    const out: number[] = []
    for (let i = 0; i < n; i++) out.push(rng.pick(DIE_FACES))
    return out
}

function report(seed: number, s: GameState): GameReport {
    let maxStall = 0
    let stall = 0
    for (let r = 1; r < s.round || (r === s.round && !!s.winner); r++) {
        const held = s.log.some(e => e.round === r && e.event === 'sharkHolds')
        stall = held ? stall + 1 : 0
        maxStall = Math.max(maxStall, stall)
    }
    const abilitiesPlayed: Partial<Record<AbilityId, number>> = {}
    const played = s.shark.played.concat(s.shark.ability ? [s.shark.ability] : [])
    for (const id of played) abilitiesPlayed[id] = (abilitiesPlayed[id] || 0) + 1
    const sharkWoundsBy: Record<string, number> = {}
    for (const e of s.log) {
        if (e.event === 'crewAttack' && e.args) sharkWoundsBy[String(e.args[1])] = (sharkWoundsBy[String(e.args[1])] || 0) + Number(e.args[2])
        if (e.event === 'flare' && e.args) sharkWoundsBy.flare = (sharkWoundsBy.flare || 0) + Number(e.args[0])
    }
    return { seed, winner: s.winner || 'none', rounds: s.round, maxStall, abilitiesPlayed, sharkWoundsBy, state: s }
}

export function runGame(seed: number, opts: RunOptions = {}): GameReport {
    const brain = createSharkBrain(opts.shark || 'normal')
    const model = opts.crewModel || DEFAULT_PARAMS
    const variant = !!opts.variant
    const maxRounds = opts.maxRounds || 60
    const table = createRng((seed ^ 0x9e3779b9) >>> 0)

    const swimmersEaten = opts.swimmersEaten === undefined ? null : opts.swimmersEaten
    const counts = swimmersEaten === null ? STANDALONE_SETUP : setupFromSwimmersEaten(swimmersEaten)
    let s = setupGame({ seed, swimmersEaten, commonGear: botSetupGear(dealCommonGear(table, counts.commonGear)), positions: BOT_START })
    const deck = createResurfaceDeck(table)

    while (!s.winner && s.round <= maxRounds) {
        // 1-2: options, the shark's secret choice and ability
        s = setOptions(s, deck.draw3())
        const d = brain.decideStep2(s)
        s = sharkChoose(d.state, d.choice, d.ability || undefined)

        // 3: Chum, then moves, weapons and targets
        const chumBy = botChum(s, model)
        if (chumBy) s = playChum(s, chumBy, brain.onChum(s))
        s = reveal(crewPrepare(s, botPrepare(s, model)))

        // 5: the crew attacks
        for (const id of CREW_IDS) {
            const shift = botPistolShift(s, id)
            if (shift !== null) s = shiftPistol(s, id, shift)
            if (!canAttack(s, id)) continue
            const plan = s.turn.plans[id]
            if (!plan) continue
            const dice = GEAR[plan.weapon].dice
            const rolls = dice > 0 ? [rollCrew(table, dice)] : []
            const input = { weapon: plan.weapon, gear: s.crew[id].gear, rolls, evade: currentCard(s).evade, hardTarget: s.shark.ability === 'hardTarget', attached: s.shark.attached }
            if (plan.weapon === 'bat' && needsReroll(input)) rolls.push(rollCrew(table, dice))
            s = crewAttack(s, id, rolls)
            if (s.winner) return report(seed, s)
        }
        s = endCrewAttacks(s)

        // 6: the shark attacks
        const move = brain.afterCrewAttacks(s)
        if (move !== null) s = ram(s, move)
        const cageBy = botCage(s)
        if (cageBy) s = cage(s, cageBy)
        const card = currentCard(s)
        const target = brain.decideAttack(s)
        let faces: number[] = []
        const attackOpts: { domino?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 } = {}
        if (target) {
            const roll = rollDice(s, mainAttackDice(s, card))
            s = roll.state
            faces = roll.faces
            const rerolls = brain.decideRerolls(s, target, faces)
            if (rerolls.length > 0) {
                const again = rollDice(s, rerolls.length)
                const m = maulAgain(again.state, faces, rerolls, again.faces)
                s = m.state
                faces = m.faces
            }
            if (target.kind === 'boat' && s.shark.ability === 'dominoEffect' && !s.shark.abilityUsed) {
                const preview = sharkAttackBoat(s, card, target.zone, faces)
                if (preview.tile !== s.tiles[target.zone]) {
                    const z = brain.decideDomino(preview.state, target.zone)
                    if (z !== null) attackOpts.domino = z
                }
            }
        }
        s = sharkMain(s, target, faces, attackOpts)
        if (s.winner) return report(seed, s)
        if (target && target.kind === 'boat' && s.shark.ability === 'secondHelping' && !s.shark.abilityUsed) {
            const z = brain.decideSecondHelping(s)
            if (z !== null) {
                const roll = rollDice(s, secondHelpingDice(s))
                s = sharkSecondHelping(roll.state, z, roll.faces)
                if (s.winner) return report(seed, s)
            }
        }
        const bonus: Partial<Record<CrewId, number[]>> = {}
        for (const id of bonusAttackTargets(s)) {
            const roll = rollDice(s, bonusAttackDice(s, card, variant))
            s = roll.state
            bonus[id] = roll.faces
        }
        s = sharkBonus(s, bonus, variant)
        if (s.winner) return report(seed, s)

        // 7: end of the round
        if (s.shark.attached.indexOf('flare') >= 0) {
            const roll = rollDice(s, 1)
            s = endRound(roll.state, roll.faces)
        } else {
            s = endRound(s)
        }
    }
    return report(seed, s)
}
