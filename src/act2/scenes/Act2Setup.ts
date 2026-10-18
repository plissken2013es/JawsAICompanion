import Phaser from 'phaser'
import type { CrewId, GearId, Zone, Space } from '~/act2/core/types'
import { COMMON_GEAR_DECK, PERSONAL_GEAR, ZONES, setupFromSwimmersEaten, STANDALONE_SETUP } from '~/act2/core/data'
import { CREW_IDS } from '~/act2/core/state'
import { ALL_OK } from '~/act2/core/adjacency'
import { newSession, serializeSession, Settings, DEFAULT_SETTINGS } from '~/act2/app/controller'
import Act2Locale from '~/act2/i18n'
import OrcaSchematic from '~/act2/ui/OrcaSchematic'
import { button, label, saveText, UI } from '~/act2/ui/widgets'
import Act2Keys from './Act2Keys'

const COMMON_TYPES: readonly GearId[] = COMMON_GEAR_DECK.filter((g, i, all) => all.indexOf(g) === i)
const count = <T>(xs: readonly T[], x: T): number => xs.filter(y => y === x).length

/**
 * Act II setup (BLUEPRINT P-22): from Act I (swimmers eaten) or on its own (6/7, or a 0-9 selector
 * as difficulty, D-6); the common gear each crew member drew; starting boat spaces; dice
 * setting. Then the game starts in Act2Round.
 */
export default class Act2Setup extends Phaser.Scene {
    private lang = 'EN'
    private t!: Act2Locale
    /** null = standalone. */
    private swimmers: number | null = null
    private fromAct1 = false
    private gear: Record<CrewId, GearId[]> = { brody: [], quint: [], hooper: [] }
    private positions: Record<CrewId, Zone> = { brody: 2, quint: 6, hooper: 3 }
    private current: CrewId = 'brody'
    private settings: Settings = DEFAULT_SETTINGS
    private layer?: Phaser.GameObjects.Container
    private schematic?: OrcaSchematic

    constructor() {
        super(Act2Keys.Setup)
    }

    init(data: { language?: string; swimmersEaten?: number }) {
        this.lang = data.language || 'EN'
        this.t = new Act2Locale(this.lang)
        this.fromAct1 = typeof data.swimmersEaten === 'number'
        this.swimmers = this.fromAct1 ? Math.max(0, Math.min(9, data.swimmersEaten as number)) : null
        this.gear = { brody: [], quint: [], hooper: [] }
        this.positions = { brody: 2, quint: 6, hooper: 3 }
        this.current = 'brody'
    }

    create() {
        this.cameras.main.setBackgroundColor('#00001a')
        this.schematic = new OrcaSchematic(this, 44, 344, 80, 64)
        this.schematic.onSpaceTap(sp => this.place(sp))
        this.schematic.onCrewTap(id => { this.current = id; this.render() })
        this.render()
    }

    private counts() {
        return this.swimmers === null ? STANDALONE_SETUP : setupFromSwimmersEaten(this.swimmers)
    }

    private dealt(): GearId[] {
        return CREW_IDS.reduce<GearId[]>((all, id) => all.concat(this.gear[id]), [])
    }

    private place(sp: Space) {
        if (sp.kind !== 'boat') return
        this.positions[this.current] = sp.zone
        this.render()
    }

    private addGear(g: GearId) {
        const total = this.counts().commonGear
        if (this.dealt().length >= total || count(this.dealt(), g) >= count(COMMON_GEAR_DECK, g)) return
        this.gear[this.current].push(g)
        this.render()
    }

    private removeGear(id: CrewId, i: number) {
        this.gear[id].splice(i, 1)
        this.render()
    }

    private render() {
        if (this.layer) this.layer.destroy(true)
        const L = this.add.container(0, 0)
        this.layer = L
        const t = this.t
        L.add(label(this, 36, 14, t.getLocale('act2.setup.title'), 30, UI.accent))

        // Swimmers eaten / standalone
        const swimmersText = this.swimmers === null ? t.getLocale('act2.setup.standalone') : t.getLocale('act2.setup.fromAct1', [this.swimmers])
        L.add(label(this, 36, 58, swimmersText, 19, UI.text, 370))
        const c = this.counts()
        L.add(label(this, 36, 106, t.getLocale('act2.setup.counts', [c.abilities, c.commonGear]), 16, UI.dim, 370))
        L.add(button(this, 60, 168, '−', () => this.stepSwimmers(-1), { fontSize: 24, width: 48 }))
        L.add(button(this, 116, 168, '+', () => this.stepSwimmers(1), { fontSize: 24, width: 48 }))
        L.add(label(this, 150, 158, t.getLocale('act2.setup.swimmers'), 16, UI.dim, 240))

        // Settings
        const s = this.settings
        L.add(button(this, 196, 230, t.getLocale('act2.settings.appDice', [t.getLocale(s.appDice ? 'act2.settings.dice.app' : 'act2.settings.dice.table')]), () => {
            this.settings = Object.assign({}, s, { appDice: !s.appDice }); this.render()
        }, { fontSize: 16, width: 300 }))
        L.add(label(this, 36, 296, t.getLocale('act2.setup.positions'), 15, UI.dim, 370))

        // Schematic with the starting positions
        const crew: Partial<Record<CrewId, Space>> = {}
        for (const id of CREW_IDS) crew[id] = { kind: 'boat', zone: this.positions[id] }
        if (this.schematic) this.schematic.draw({
            tiles: ALL_OK, crew, selectedCrew: this.current,
            highlight: ZONES.map(z => ({ kind: 'boat' as const, zone: z })),
        })

        // Gear: crew tabs, their cards, the palette
        const x0 = 430
        L.add(label(this, x0, 58, t.getLocale('act2.setup.gear', [this.dealt().length, c.commonGear]), 18, UI.text, 570))
        CREW_IDS.forEach((id, i) => {
            const y = 124 + i * 86
            L.add(button(this, x0 + 55, y, t.getLocale(`act2.crew.${id}`), () => { this.current = id; this.render() },
                { width: 110, selected: this.current === id }))
            const personal = PERSONAL_GEAR[id].map(g => t.getLocale(`act2.gear.${g}`)).join(', ')
            L.add(label(this, x0 + 120, y - 22, personal, 13, UI.dim, 450))
            this.gear[id].forEach((g, k) => {
                L.add(button(this, x0 + 180 + (k % 4) * 116, y + 10 + Math.floor(k / 4) * 30, `${t.getLocale(`act2.gear.${g}`)} ✕`,
                    () => this.removeGear(id, k), { fontSize: 12, width: 112 }))
            })
        })
        COMMON_TYPES.forEach((g, i) => {
            const left = count(COMMON_GEAR_DECK, g) - count(this.dealt(), g)
            const col = i % 4
            const row = Math.floor(i / 4)
            L.add(button(this, x0 + 72 + col * 144, 400 + row * 44, `${t.getLocale(`act2.gear.${g}`)} (${left})`,
                () => this.addGear(g), { fontSize: 14, width: 140, enabled: left > 0 && this.dealt().length < c.commonGear }))
        })

        const ready = this.dealt().length === c.commonGear
        L.add(button(this, 760, 600, t.getLocale('act2.setup.start'), () => this.start(), { fontSize: 24, width: 300, enabled: ready }))
    }

    private stepSwimmers(d: number) {
        // − / + walk through: standalone → 0 … 9 → standalone
        const order: (number | null)[] = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        const i = order.indexOf(this.swimmers)
        const next = order[(i + (d === 0 ? 1 : d) + order.length) % order.length]
        this.swimmers = next
        // Too many cards for the new count: drop the last ones.
        const total = this.counts().commonGear
        while (this.dealt().length > total) {
            const id = CREW_IDS.filter(c => this.gear[c].length > 0).pop() as CrewId
            this.gear[id].pop()
        }
        this.render()
    }

    private start() {
        const session = newSession({
            seed: Math.floor(Math.random() * 0x7fffffff),
            swimmersEaten: this.swimmers,
            commonGear: this.gear,
            positions: this.positions,
        }, this.settings)
        saveText(serializeSession(session))
        this.scene.start(Act2Keys.Round, { language: this.lang })
    }
}
