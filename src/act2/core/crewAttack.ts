/**
 * Step 5, one crew attack (SPECS §3.3.5, catalog §5). The dice come in as input (one face 0-2 per
 * die) so the crew can roll their own physical dice. Each attack is resolved on its own: several
 * crew members never add their rolls together [thread 2370787].
 */
import type { CrewId, GearId } from './types'
import { GEAR } from './data'
import { GameState, CrewState, deepFreeze } from './state'

export interface CrewAttackInput {
    readonly weapon: GearId
    /** Everything the attacker holds (for Ammo and to check the weapon). */
    readonly gear: readonly GearId[]
    /** The roll, plus the Baseball Bat's second roll after a miss. Empty for attachables. */
    readonly rolls: readonly (readonly number[])[]
    /** Evade on the chosen Resurface card. */
    readonly evade: number
    readonly hardTarget: boolean
    /** Attachables already on the shark (Fishing Net, Canister...). */
    readonly attached: readonly GearId[]
    /** Pistol / Rifle: what to discard after firing. Default: Ammo if the shooter has it. */
    readonly spend?: 'ammo' | 'weapon'
}

export interface CrewAttackResult {
    readonly weapon: GearId
    readonly hits: number
    /** Including the Canister's +3. */
    readonly wounds: number
    readonly rerolled: boolean
    readonly exploded: boolean
    readonly tranquilized: boolean
    /** Cards the attacker discards. */
    readonly discard: readonly GearId[]
    /** Attachable that goes onto the shark. */
    readonly attach: GearId | null
    /** Cards that leave the shark (the exploded Canister). */
    readonly sharkDiscard: readonly GearId[]
}

const HOOK_BREAKS_AT = 4
const CANISTER_WOUNDS = 3
const HARD_TARGET_EVADE = 3

const sum = (xs: readonly number[]): number => xs.reduce((s, x) => s + x, 0)

/** Card Evade, 3 under Hard Target, then -1 for an attached Fishing Net; 0 against the Hammer [C]. */
export function effectiveEvade(weapon: GearId, cardEvade: number, hardTarget: boolean, attached: readonly GearId[]): number {
    if (weapon === 'hammer') return 0
    const base = hardTarget ? HARD_TARGET_EVADE : cardEvade
    return Math.max(0, base - (attached.indexOf('fishingNet') >= 0 ? 1 : 0))
}

function woundsFor(input: CrewAttackInput, faces: readonly number[]): number {
    const evade = effectiveEvade(input.weapon, input.evade, input.hardTarget, input.attached)
    return Math.max(0, sum(faces) + GEAR[input.weapon].bonus - evade)
}

function checkRoll(input: CrewAttackInput, faces: readonly number[]): void {
    const dice = GEAR[input.weapon].dice
    if (faces.length !== dice) throw new RangeError(`${input.weapon} rolls ${dice} dice, got ${faces.length}`)
    for (const f of faces) if (f !== 0 && f !== 1 && f !== 2) throw new RangeError(`a die shows 0, 1 or 2 hits, got ${f}`)
}

/** Baseball Bat after a miss: the crew rolls both dice again. */
export function needsReroll(input: CrewAttackInput): boolean {
    return input.weapon === 'bat' && woundsFor(input, input.rolls[0] || []) === 0
}

export function resolveCrewAttack(input: CrewAttackInput): CrewAttackResult {
    const { weapon, gear, rolls } = input
    const kind = GEAR[weapon].kind
    if (gear.indexOf(weapon) < 0) throw new RangeError(`the attacker does not hold ${weapon}`)
    if (kind === 'accessory') throw new RangeError(`${weapon} is not a weapon`)

    if (kind === 'attachable') {
        if (rolls.length > 0) throw new RangeError('attachable weapons do not roll')
        return { weapon, hits: 0, wounds: 0, rerolled: false, exploded: false, tranquilized: false, discard: [], attach: weapon, sharkDiscard: [] }
    }

    if (rolls.length === 0) throw new RangeError(`${weapon} needs a roll`)
    checkRoll(input, rolls[0])
    const rerolled = needsReroll(input)
    if (rolls.length !== (rerolled ? 2 : 1)) {
        throw new RangeError(rerolled ? 'the Baseball Bat missed: roll again' : 'only a missed Baseball Bat rolls again')
    }
    const faces = rolls[rolls.length - 1]
    checkRoll(input, faces)

    const hits = sum(faces)
    let wounds = woundsFor(input, faces)
    const discard: GearId[] = []
    const sharkDiscard: GearId[] = []

    const exploded = (weapon === 'pistol' || weapon === 'rifle') && wounds > 0 && input.attached.indexOf('canister') >= 0
    if (exploded) {
        wounds += CANISTER_WOUNDS
        sharkDiscard.push('canister')
    }

    if (weapon === 'pistol' || weapon === 'rifle') {
        const hasAmmo = gear.indexOf('ammo') >= 0
        const spend = input.spend || (hasAmmo ? 'ammo' : 'weapon')
        if (spend === 'ammo' && !hasAmmo) throw new RangeError('no Ammo to spend')
        discard.push(spend === 'ammo' ? 'ammo' : weapon)
    }
    if (weapon === 'harpoonGun' || weapon === 'tranqSpear') discard.push(weapon)
    if (weapon === 'hook' && hits >= HOOK_BREAKS_AT) discard.push(weapon)

    return {
        weapon, hits, wounds, rerolled, exploded,
        tranquilized: weapon === 'tranqSpear' && wounds > 0,
        discard, attach: null, sharkDiscard,
    }
}

function removeEach(from: readonly GearId[], cards: readonly GearId[], owner: string): GearId[] {
    const out = from.slice()
    for (const card of cards) {
        const i = out.indexOf(card)
        if (i < 0) throw new RangeError(`${owner} does not hold ${card}`)
        out.splice(i, 1)
    }
    return out
}

export function applyCrewAttack(state: GameState, crewId: CrewId, result: CrewAttackResult): GameState {
    const member = state.crew[crewId]
    const spent = result.attach ? result.discard.concat(result.attach) : result.discard
    const crewMember: CrewState = Object.assign({}, member, { gear: removeEach(member.gear, spent, crewId) })
    const attached = removeEach(state.shark.attached, result.sharkDiscard, 'the shark')
    if (result.attach) attached.push(result.attach)

    return deepFreeze(Object.assign({}, state, {
        crew: Object.assign({}, state.crew, { [crewId]: crewMember }),
        shark: Object.assign({}, state.shark, {
            wounds: state.shark.wounds + result.wounds,
            attached,
            tranquilized: state.shark.tranquilized || result.tranquilized,
        }),
        log: state.log.concat({ round: state.round, event: 'crewAttack', args: [crewId, result.weapon, result.wounds] }),
    }))
}
