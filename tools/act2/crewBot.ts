/**
 * A reasonable crew for the simulator (BLUEPRINT P-19). It only ever looks at public information:
 * every decision starts from publicView(), which drops the shark's hand and its secret choice.
 * Targets follow its own model of the shark (the D1 mix, which uses public information only);
 * moves trade expected damage against single-use weapons and danger; the wounded climb aboard.
 */
import type { Zone, Space, CrewId, GearId, ResurfaceCard } from '../../src/act2/core/types'
import { GEAR, RESURFACE_CARDS, PERSONAL_GEAR } from '../../src/act2/core/data'
import { GameState, CREW_IDS } from '../../src/act2/core/state'
import { adjacentSpaces } from '../../src/act2/core/adjacency'
import { reachableSpaces, targetableZones, coveredZones } from '../../src/act2/core/movement'
import { bonusAttackTargets } from '../../src/act2/core/sharkAttack'
import { PrepareInput, PrepareEntry } from '../../src/act2/core/round'
import { AiParams } from '../../src/act2/core/ai/params'
import { analyzeResurface } from '../../src/act2/core/ai/chooseResurface'
import { weaponWounds } from '../../src/act2/core/ai/threat'

const SINGLE_USE_COST = 0.3
const WATER_DANGER = 0.5
const WOUND_DANGER = 0.15
const DECK_DANGER = 0.2
const CLIMB_WOUNDS = 4
const CHUM_DOUBT = 0.7
const CAGE_WOUNDS = 2

/** What the crew can see: no hand, no secret choice. */
export function publicView(state: GameState): GameState {
    return Object.assign({}, state, {
        shark: Object.assign({}, state.shark, { hand: [] }),
        turn: Object.assign({}, state.turn, { choice: null }),
    })
}

const cardsOf = (state: GameState): ResurfaceCard[] =>
    state.turn.options.map(id => RESURFACE_CARDS.filter(c => c.id === id)[0])

/** The crew's model of where the shark will surface (Chum removes the option it showed). */
export function crewModel(state: GameState, p: AiParams): number[] {
    const view = publicView(state)
    const probs = analyzeResurface(Object.assign({}, view, { turn: Object.assign({}, view.turn, { step: 'choose' }) }), p).probs.slice()
    if (state.turn.chum) probs[state.turn.chum.revealed] = 0
    const total = probs.reduce((s, x) => s + x, 0)
    return probs.map(x => x / total)
}

/** Shares out the common gear dealt at setup: Ammo to the gunmen, the rest to whoever has least. */
export function botSetupGear(dealt: readonly GearId[]): Record<CrewId, GearId[]> {
    const hands: Record<CrewId, GearId[]> = { brody: [], quint: [], hooper: [] }
    let gunman = 0
    for (const card of dealt) {
        if (card === 'ammo') {
            hands[gunman % 2 === 0 ? 'hooper' : 'brody'].push(card)
            gunman++
            continue
        }
        const id = CREW_IDS.reduce((a, b) => (hands[b].length + PERSONAL_GEAR[b].length < hands[a].length + PERSONAL_GEAR[a].length ? b : a))
        hands[id].push(card)
    }
    return hands
}

export const BOT_START: Readonly<Record<CrewId, Zone>> = { brody: 2, quint: 6, hooper: 3 }

/** Plays Chum when the crew is unsure where the shark will be. */
export function botChum(state: GameState, p: AiParams): CrewId | null {
    if (state.turn.chum) return null
    const holder = CREW_IDS.filter(id => state.crew[id].space && state.crew[id].gear.indexOf('chum') >= 0)[0]
    if (!holder) return null
    return Math.max(...crewModel(state, p)) < CHUM_DOUBT ? holder : null
}

function singleUse(weapon: GearId, gear: readonly GearId[]): boolean {
    if (weapon === 'harpoonGun' || weapon === 'tranqSpear') return true
    return (weapon === 'pistol' || weapon === 'rifle') && gear.indexOf('ammo') < 0
}

function danger(state: GameState, space: Space, wounds: number, zoneProb: Record<number, number>): number {
    if (space.kind === 'water') return WATER_DANGER + WOUND_DANGER * wounds
    const near = adjacentSpaces(state.tiles, space).filter(s => s.kind === 'water').reduce((s, w) => s + (zoneProb[w.zone] || 0), 0)
    return DECK_DANGER * near
}

export function botPrepare(state: GameState, p: AiParams): PrepareInput {
    const view = publicView(state)
    const cards = cardsOf(view)
    const probs = crewModel(state, p)
    const zoneProb: Record<number, number> = {}
    cards.forEach((c, i) => { zoneProb[c.zone] = (zoneProb[c.zone] || 0) + probs[i] })

    const plans: Partial<Record<CrewId, PrepareEntry>> = {}
    for (const id of CREW_IDS) {
        const member = view.crew[id]
        if (!member.space) continue
        let spaces = reachableSpaces(view.tiles, member.space)
        // Badly wounded in the water: get back on the boat if at all possible.
        if (member.space.kind === 'water' && member.wounds >= CLIMB_WOUNDS && spaces.some(s => s.kind === 'boat')) {
            spaces = spaces.filter(s => s.kind === 'boat')
        }
        let best: { score: number; entry: PrepareEntry } = { score: -Infinity, entry: {} }
        for (const to of spaces) {
            const risk = danger(view, to, member.wounds, zoneProb)
            if (-risk > best.score) best = { score: -risk, entry: { to } }
            for (const weapon of member.gear) {
                if (GEAR[weapon].kind === 'accessory') continue
                const reach = targetableZones(view.tiles, to, weapon)
                for (const target of cards.map(c => c.zone)) {
                    if (reach.indexOf(target) < 0) continue
                    const covered = coveredZones(view.tiles, weapon, target)
                    const gain = cards.reduce((s, c, o) => s + (covered.indexOf(c.zone) >= 0 ? probs[o] * weaponWounds(view, weapon, c, false, p) : 0), 0)
                    const score = gain - (singleUse(weapon, member.gear) ? SINGLE_USE_COST : 0) - risk
                    if (gain > 0 && score > best.score) best = { score, entry: { to, weapon, target } }
                }
            }
        }
        plans[id] = best.entry
    }
    return plans
}

/** Shark Cage before the shark rolls: someone wounded in the water within its reach. */
export function botCage(state: GameState): CrewId | null {
    const exposed = bonusAttackTargets(state)
    return exposed.filter(id => state.crew[id].gear.indexOf('sharkCage') >= 0 && !state.crew[id].caged && state.crew[id].wounds >= CAGE_WOUNDS)[0] || null
}

/** The Pistol moves its token if the shark surfaced in a water next to it. */
export function botPistolShift(state: GameState, id: CrewId): Zone | null {
    const plan = state.turn.plans[id]
    const here = state.shark.space
    if (!plan || plan.weapon !== 'pistol' || !here || plan.target === here.zone) return null
    return coveredZones(state.tiles, 'pistol', plan.target).indexOf(here.zone) >= 0 ? here.zone : null
}
