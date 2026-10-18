/**
 * Act II game data, transcribed from the Spanish copy (docs/acto2/02-catalogo.md).
 * Numbers and ids only: card names and quotes live in LocaleManager under the keys built below.
 */
import type {
    Zone, Column, TileThresholds, ResurfaceCard, ResurfaceId,
    AbilityId, GearId, GearDef, CrewId, SetupCounts,
} from './types'

// ---------------------------------------------------------------- the Orca

export const ZONES: readonly Zone[] = [1, 2, 3, 4, 5, 6, 7, 8]

export const columnOf = (zone: Zone): Column => (((zone - 1) % 4) + 1) as Column

/** Stern (column 1) and bow (column 4) zones. */
export const isCorner = (zone: Zone): boolean => columnOf(zone) === 1 || columnOf(zone) === 4

const CORNER_TILE: TileThresholds = { damage: 1, destroy: 3, destroyDamaged: 1 }
const MIDDLE_TILE: TileThresholds = { damage: 2, destroy: 4, destroyDamaged: 2 }

export const TILE_THRESHOLDS: Readonly<Record<Zone, TileThresholds>> = {
    1: CORNER_TILE, 2: MIDDLE_TILE, 3: MIDDLE_TILE, 4: CORNER_TILE,
    5: CORNER_TILE, 6: MIDDLE_TILE, 7: MIDDLE_TILE, 8: CORNER_TILE,
}

// ---------------------------------------------------------------- Resurface cards (2 per zone)

const card = (id: ResurfaceId, zone: Zone, evade: 1 | 2, dice: 1 | 2 | 3, shakeOff = false): ResurfaceCard =>
    ({ id, zone, evade, dice, shakeOff })

/** Same order as the catalog table (§3). */
export const RESURFACE_CARDS: readonly ResurfaceCard[] = [
    card('R01', 1, 2, 1),       // «Era muy fácil. Es un bicho muy listo...»
    card('R02', 1, 1, 2),       // «Lo que trato de hacer, jefe...»
    card('R03', 2, 1, 3, true), // «Necesitará un barco más grande.»
    card('R04', 2, 2, 2),       // «Antes yo odiaba el agua...»
    card('R05', 3, 2, 2, true), // «Vamos a hundirnos, ¿verdad?»
    card('R06', 3, 1, 3),       // «¡Es un tiburón blanco, Larry, enorme!...»
    card('R07', 4, 1, 2),       // «¡Está dando vueltas alrededor del barco!...»
    card('R08', 4, 2, 1),       // «¡Qué rápido!»
    card('R09', 5, 1, 2),       // «Tienen algo muy característico... Ojos de muñeca.»
    card('R10', 5, 2, 1),       // «¡Quiere cazarnos, es increíble!»
    card('R11', 6, 2, 2, true), // «¡Madre mía!»
    card('R12', 6, 1, 3),       // «¡Amigos, amigos! ... vuelve a buscar su almuerzo.»
    card('R13', 7, 2, 2),       // «Mide siete metros.» / «Ocho metros...»
    card('R14', 7, 1, 3, true), // «¡Pero, Hooper, idiota, a estribor!...»
    card('R15', 8, 1, 2),       // «¿Dónde se ha metido? No vas a tomarme el pelo.»
    card('R16', 8, 2, 1),       // «Los 10.000 dólares tienen que ser para mí solo...»
]

// ---------------------------------------------------------------- Shark abilities (8 types x 2)

export const ABILITY_IDS: readonly AbilityId[] = [
    'rammingSpeed', 'secondHelping', 'maulAgain', 'hardTarget',
    'bigMouth', 'makingWaves', 'dominoEffect', 'extraStrength',
]

export const ABILITY_DECK: readonly AbilityId[] = ABILITY_IDS.reduce<AbilityId[]>((deck, id) => deck.concat([id, id]), [])

// ---------------------------------------------------------------- gear

const gear = (id: GearId, kind: GearDef['kind'], dice = 0, bonus = 0): GearDef => ({ id, kind, dice, bonus })

export const GEAR: Readonly<Record<GearId, GearDef>> = {
    bat: gear('bat', 'melee', 2),
    machete: gear('machete', 'melee', 2, 1),
    hammer: gear('hammer', 'melee', 1),
    hook: gear('hook', 'melee', 3),
    tranqSpear: gear('tranqSpear', 'melee', 3),
    pistol: gear('pistol', 'firearm', 2),
    rifle: gear('rifle', 'firearm', 2, 1),
    harpoonGun: gear('harpoonGun', 'firearm', 3, 1),
    flare: gear('flare', 'attachable'),
    fishingNet: gear('fishingNet', 'attachable'),
    fishingPole: gear('fishingPole', 'attachable'),
    canister: gear('canister', 'attachable'),
    ammo: gear('ammo', 'accessory'),
    chum: gear('chum', 'accessory'),
    sharkCage: gear('sharkCage', 'accessory'),
}

export const PERSONAL_GEAR: Readonly<Record<CrewId, readonly GearId[]>> = {
    brody: ['bat', 'pistol'],
    quint: ['machete', 'flare'],
    hooper: ['hammer', 'rifle'],
}

export const COMMON_GEAR_DECK: readonly GearId[] = [
    'ammo', 'ammo', 'ammo', 'ammo', 'ammo',
    'chum', 'chum', 'chum',
    'sharkCage', 'pistol', 'harpoonGun', 'hook', 'tranqSpear',
    'fishingNet', 'fishingPole', 'canister',
]

// ---------------------------------------------------------------- dice and health

/** One blank face, three 1-hit faces, two 2-hit faces (confirmed with the copy). */
export const DIE_FACES: readonly number[] = [0, 1, 1, 1, 2, 2]

/** Wounds that eliminate: track 0-5 then X for the crew, 0-17 then X for the shark. */
export const CREW_HEALTH = 6
export const SHARK_HEALTH = 18

// ---------------------------------------------------------------- setup

/** Table on the Act I side of the shark board: b swimmers eaten -> b+1 abilities, 12-b common gear. */
export function setupFromSwimmersEaten(swimmersEaten: number): SetupCounts {
    if (!Number.isInteger(swimmersEaten) || swimmersEaten < 0 || swimmersEaten > 9) {
        throw new RangeError(`swimmers eaten must be an integer 0..9, got ${swimmersEaten}`)
    }
    return { abilities: swimmersEaten + 1, commonGear: 12 - swimmersEaten }
}

/** Playing Act II on its own (rulebook p.12). */
export const STANDALONE_SETUP: SetupCounts = { abilities: 6, commonGear: 7 }

// ---------------------------------------------------------------- LocaleManager keys

export const abilityNameKey = (id: AbilityId): string => `act2.ability.${id}`
export const gearNameKey = (id: GearId): string => `act2.gear.${id}`
export const resurfaceQuoteKey = (id: ResurfaceId): string => `act2.resurface.${id}`
