/**
 * Act II core types (docs/acto2/SPECS.md §2). Plain data, no Phaser.
 * TypeScript 3.8: no template literal types, no labelled tuples.
 */

/** Orca zones: 1-4 top row, 5-8 bottom row, from stern (1/5) to bow (4/8). */
export type Zone = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type Column = 1 | 2 | 3 | 4

export type TileState = 'ok' | 'damaged' | 'gone'
export type SpaceKind = 'boat' | 'water'

export interface Space {
    readonly kind: SpaceKind
    readonly zone: Zone
}

/** Hits needed in a single attack: intact -> damaged, intact -> destroyed, damaged -> destroyed. */
export interface TileThresholds {
    readonly damage: number
    readonly destroy: number
    readonly destroyDamaged: number
}

export type CrewId = 'brody' | 'quint' | 'hooper'

export type ResurfaceId =
    'R01' | 'R02' | 'R03' | 'R04' | 'R05' | 'R06' | 'R07' | 'R08' |
    'R09' | 'R10' | 'R11' | 'R12' | 'R13' | 'R14' | 'R15' | 'R16'

export interface ResurfaceCard {
    readonly id: ResurfaceId
    readonly zone: Zone
    readonly evade: 1 | 2
    readonly dice: 1 | 2 | 3
    readonly shakeOff: boolean
}

export type AbilityId =
    'rammingSpeed' | 'secondHelping' | 'maulAgain' | 'hardTarget' |
    'bigMouth' | 'makingWaves' | 'dominoEffect' | 'extraStrength'

export type GearId =
    'bat' | 'pistol' | 'machete' | 'flare' | 'hammer' | 'rifle' |
    'ammo' | 'chum' | 'sharkCage' | 'harpoonGun' | 'hook' | 'tranqSpear' |
    'fishingNet' | 'fishingPole' | 'canister'

/** Card symbol: fist = melee, crosshair = firearm, hook = attachable, none = accessory. */
export type GearKind = 'melee' | 'firearm' | 'attachable' | 'accessory'

export interface GearDef {
    readonly id: GearId
    readonly kind: GearKind
    /** Attack dice (0 for attachables and accessories). */
    readonly dice: number
    /** The "+burst" on the card: +1 hit. */
    readonly bonus: number
}

export interface SetupCounts {
    readonly abilities: number
    readonly commonGear: number
}
