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
}
