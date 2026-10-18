/**
 * Tunable coefficients of the shark AI (SPECS §4). Starting values only: the simulator (P-20)
 * tunes them, and the difficulty levels (P-18) derive from them.
 */
import type { GearId } from '../types'

export interface AiParams {
    /** V = max(boat, crew) + minWeight · min(boat, crew) − λ · risk − threat. */
    readonly minWeight: number
    /** f(x) = x^crewCurve on each crew member's wounds/6; > 1 makes finishing off worth more. */
    readonly crewCurve: number
    /** g(x) = x^riskCurve on the shark's wounds/18; > 1 makes the last wounds weigh more. */
    readonly riskCurve: number
    /** λ(h) = lambdaBase · (1 + lambdaGrowth · h/18): risk matters more as health drops. */
    readonly lambdaBase: number
    readonly lambdaGrowth: number
    /** Weight of the crew's remaining arsenal (and what is stuck on the shark). */
    readonly threatWeight: number
    /** Gear stuck on the shark hurts now; in a crew member's hand it only might later. */
    readonly attachedFactor: number
    /** How dangerous each card is; cards that are not listed count 0 (melee weapons never run out). */
    readonly gearThreat: Readonly<Partial<Record<GearId, number>>>
    /** Attachables deal no wounds when they hook on: what each is worth, in wounds. */
    readonly attachValue: Readonly<Partial<Record<GearId, number>>>
    /** Share of an attack's value lost on a crew member in the water who can climb back aboard first. */
    readonly climbDiscount: number
    /** Softmax temperature of the Resurface mix: lower is sharper (D-3 levels). */
    readonly temperature: number
    /** Every option still allowed keeps at least this probability. */
    readonly pMin: number
    /** Fictitious play rounds of the guessing game. */
    readonly fpIterations: number
    /** Anti-stall (D-4): the risk weight is multiplied by this once per round in a row without attacking; 1 = off. */
    readonly stallFactor: number
    /** D2: play an ability when its gain beats abilityBase · (1 + roundsLeft / handSize). */
    readonly abilityBase: number
    /** Rough length of an Act II game, to estimate the rounds left. */
    readonly expectedRounds: number
    /** Extra value of keeping Ramming Speed, scaled by how early the game is. */
    readonly rammingReserve: number
    /** Extra value of keeping Hard Target, scaled by the shark's health left. */
    readonly hardTargetReserve: number
    /** Share of the crew's threat expected to land when D1 gives no estimate. */
    readonly hitShare: number
    /** D5: share of an attack's value lost on a crew member holding the Shark Cage (0 = ignore it). */
    readonly cageDiscount: number
}

export const DEFAULT_PARAMS: AiParams = {
    minWeight: 0.25,
    crewCurve: 1.5,
    riskCurve: 2,
    lambdaBase: 0.5,
    lambdaGrowth: 2,
    threatWeight: 0.3,
    attachedFactor: 1.5,
    gearThreat: {
        pistol: 1, rifle: 1.2, harpoonGun: 1.5, ammo: 0.5,
        flare: 1, fishingNet: 0.6, fishingPole: 0.6, canister: 0.8,
    },
    // Flare: 7/6 wounds per round it stays on; the others weaken the shark until it shakes them off.
    attachValue: { flare: 2, fishingNet: 1, fishingPole: 1, canister: 1.5 },
    climbDiscount: 0.5,
    temperature: 0.02,
    pMin: 0.05,
    fpIterations: 20,
    stallFactor: 0.8,
    abilityBase: 0.01,
    expectedRounds: 10,
    rammingReserve: 0.05,
    hardTargetReserve: 0.05,
    hitShare: 0.5,
    cageDiscount: 0.8,
}
