import Phaser from 'phaser'
import type { CrewId, GearId, ResurfaceId, Space, Zone } from '~/act2/core/types'
import { RESURFACE_CARDS, GEAR } from '~/act2/core/data'
import { CREW_IDS } from '~/act2/core/state'
import { currentCard } from '~/act2/core/round'
import { reachableSpaces } from '~/act2/core/movement'
import {
    Session, deserializeSession, serializeSession, enterOptions, chumHolders, useChum, moveCrew, positionOf,
    revealShark, hitWeapons, declareHit, confirmHits, enterCrewHits, answerCage, enterSharkRoll, nextRound,
    undo, changeSettings, Declared,
} from '~/act2/app/controller'
import Act2Locale from '~/act2/i18n'
import OrcaSchematic from '~/act2/ui/OrcaSchematic'
import { button, label, loadText, saveText, UI } from '~/act2/ui/widgets'
import Act2Keys from './Act2Keys'

const PANEL_X = 520
const PANEL_W = 490

/**
 * The round (BLUEPRINT P-23/P-24): draws whatever the controller is asking for. Left, the Orca and
 * the table instructions; right, the question; top, the status, undo and settings. Saves after every
 * answer, so the app can be closed at any point and resumed.
 */
export default class Act2Round extends Phaser.Scene {
    private lang = 'EN'
    private t!: Act2Locale
    private session!: Session
    private layer?: Phaser.GameObjects.Container
    private schematic?: OrcaSchematic
    private cards: ResurfaceId[] = []
    private selectedCrew: CrewId | null = null
    private weaponChoice: Partial<Record<CrewId, GearId>> = {}
    private dieFaces: number[] = []
    private showSettings = false
    private toastText?: Phaser.GameObjects.Text

    constructor() {
        super(Act2Keys.Round)
    }

    init(data: { language?: string }) {
        this.lang = data.language || 'EN'
        this.t = new Act2Locale(this.lang)
        const saved = loadText()
        if (!saved) throw new Error('no Act II game to play')
        this.session = deserializeSession(saved)
        this.resetLocal()
    }

    create() {
        this.cameras.main.setBackgroundColor('#00001a')
        this.schematic = new OrcaSchematic(this, 24, 64)
        this.schematic.onSpaceTap(sp => this.tapSpace(sp))
        this.schematic.onCrewTap(id => this.tapCrew(id))
        this.render()
    }

    private resetLocal() {
        this.cards = []
        this.selectedCrew = null
        this.weaponChoice = {}
        this.dieFaces = []
    }

    private apply(step: (s: Session) => Session, keepLocal = false) {
        try {
            this.session = step(this.session)
            saveText(serializeSession(this.session))
            if (!keepLocal) this.resetLocal()
            if (this.session.phase.kind === 'over') {
                this.scene.start(Act2Keys.End, { language: this.lang })
                return
            }
            this.render()
        } catch (e) {
            this.toast(String((e as Error).message || e))
        }
    }

    private toast(msg: string) {
        if (this.toastText) this.toastText.destroy()
        this.toastText = label(this, 24, 610, msg, 16, '#ff6060', 960)
        this.time.delayedCall(2500, () => { if (this.toastText) this.toastText.destroy() }, [], this)
    }

    private tapCrew(id: CrewId) {
        if (this.session.phase.kind !== 'prepare') return
        this.selectedCrew = this.selectedCrew === id ? null : id
        this.render()
    }

    private tapSpace(sp: Space) {
        if (this.session.phase.kind === 'prepare' && this.selectedCrew) {
            const id = this.selectedCrew
            this.apply(s => moveCrew(s, id, sp))
        }
    }

    // ---------------------------------------------------------------- drawing

    private render() {
        if (this.layer) this.layer.destroy(true)
        const L = this.add.container(0, 0)
        this.layer = L
        const s = this.session
        const st = s.state
        const t = this.t
        const ph = s.phase

        const w = (id: CrewId) => (st.crew[id].space ? String(st.crew[id].wounds) : '✝')
        L.add(label(this, 24, 14, `${t.getLocale('act2.title')} · ${st.round}`, 20, UI.accent))
        L.add(label(this, 24, 40, t.getLocale('act2.ui.status', [st.shark.wounds, w('brody'), w('quint'), w('hooper')]), 15, UI.text))
        L.add(button(this, 860, 26, t.getLocale('act2.ui.undo'), () => this.apply(undo), { fontSize: 16, width: 110, enabled: s.history.length > 0 }))
        L.add(button(this, 965, 26, '⚙', () => { this.showSettings = !this.showSettings; this.render() }, { fontSize: 18, width: 60 }))

        this.drawSchematic()

        // Table instructions under the Orca
        const lines = s.lines.slice(-8).map(l => '• ' + t.line(l.key, l.args || []))
        L.add(label(this, 24, 444, lines.join('\n'), 16, UI.text, 470))

        if (this.showSettings) { this.drawSettings(L); return }

        if (ph.kind === 'options') this.drawOptions(L)
        else if (ph.kind === 'prepare') this.drawPrepare(L)
        else if (ph.kind === 'hits') this.drawHits(L, ph.declared)
        else if (ph.kind === 'crewRoll') {
            const d = ph.queue[0]
            const dice = GEAR[d.weapon].dice
            this.prompt(L, t.getLocale('act2.ui.crewRoll', [`act2.crew.${d.crew}`, dice, `act2.gear.${d.weapon}`]))
            this.numberPad(L, 2 * dice, n => this.apply(x => enterCrewHits(x, n)))
        } else if (ph.kind === 'cage') {
            this.prompt(L, t.getLocale('act2.ui.cage'))
            ph.holders.forEach((id, i) => L.add(button(this, PANEL_X + PANEL_W / 2, 170 + i * 56, t.getLocale(`act2.crew.${id}`), () => this.apply(x => answerCage(x, id)), { width: 300 })))
            L.add(button(this, PANEL_X + PANEL_W / 2, 170 + ph.holders.length * 56, t.getLocale('act2.ui.none'), () => this.apply(x => answerCage(x, null)), { width: 300 }))
        } else if (ph.kind === 'sharkRoll') {
            if (ph.perDie) {
                const i = this.dieFaces.length
                this.prompt(L, t.getLocale('act2.ui.sharkDie', [i + 1, ph.dice]))
                this.numberPad(L, 2, n => {
                    this.dieFaces = this.dieFaces.concat(n)
                    if (this.dieFaces.length === ph.dice) { const faces = this.dieFaces; this.apply(x => enterSharkRoll(x, faces)) }
                    else this.render()
                })
            } else {
                const pole = st.shark.attached.indexOf('fishingPole') >= 0
                this.prompt(L, t.getLocale(pole ? 'act2.ui.sharkRollPole' : 'act2.ui.sharkRoll', [ph.dice]))
                this.numberPad(L, pole ? ph.dice : 2 * ph.dice, n => this.apply(x => enterSharkRoll(x, n)))
            }
        } else if (ph.kind === 'summary') {
            this.prompt(L, t.getLocale('act2.ui.summary', [st.round - 1]))
            L.add(button(this, PANEL_X + PANEL_W / 2, 200, t.getLocale('act2.ui.nextRound'), () => this.apply(nextRound), { fontSize: 24, width: 320 }))
        }
    }

    private drawSchematic() {
        const s = this.session
        const st = s.state
        const ph = s.phase
        const crew: Partial<Record<CrewId, Space | null>> = {}
        const wounds: Partial<Record<CrewId, number>> = {}
        for (const id of CREW_IDS) { crew[id] = positionOf(s, id); wounds[id] = st.crew[id].wounds }
        const labels: Partial<Record<Zone, string>> = {}
        const ids = ph.kind === 'options' ? this.cards : st.turn.options
        ids.forEach((id, i) => {
            const z = RESURFACE_CARDS.filter(c => c.id === id)[0].zone
            labels[z] = (labels[z] ? labels[z] + ' ' : '') + 'ABC'[i]
        })
        let shark: Space | null = st.shark.space
        if (ph.kind === 'hits') shark = { kind: 'water', zone: currentCard(st).zone }
        const highlight = ph.kind === 'prepare' && this.selectedCrew && st.crew[this.selectedCrew].space
            ? reachableSpaces(st.tiles, st.crew[this.selectedCrew].space as Space) : []
        const target = ph.kind === 'sharkRoll' && ph.target
            ? (ph.target.kind === 'boat' ? { kind: 'boat' as const, zone: ph.target.zone } : st.crew[ph.target.crew].space) : null
        if (this.schematic) this.schematic.draw({ tiles: st.tiles, crew, wounds, shark, labels, highlight, target, selectedCrew: this.selectedCrew })
    }

    private prompt(L: Phaser.GameObjects.Container, text: string) {
        L.add(label(this, PANEL_X, 70, text, 20, UI.accent, PANEL_W))
    }

    private numberPad(L: Phaser.GameObjects.Container, max: number, pick: (n: number) => void) {
        for (let n = 0; n <= max; n++) {
            const col = n % 4
            const row = Math.floor(n / 4)
            L.add(button(this, PANEL_X + 60 + col * 120, 190 + row * 70, String(n), () => pick(n), { fontSize: 30, width: 100 }))
        }
    }

    private drawOptions(L: Phaser.GameObjects.Container) {
        const t = this.t
        this.prompt(L, t.getLocale('act2.ui.options'))
        RESURFACE_CARDS.forEach((c, i) => {
            const k = this.cards.indexOf(c.id)
            const name = t.getLocale(c.dice === 1 ? 'act2.ui.card1' : 'act2.ui.card', [c.zone, c.evade, c.dice])
            const text = `${k >= 0 ? 'ABC'[k] + ': ' : ''}${name}${c.shakeOff ? ' · ' + t.getLocale('act2.ui.shake') : ''}`
            L.add(button(this, PANEL_X + 120 + (i % 2) * 246, 130 + Math.floor(i / 2) * 44, text, () => {
                const at = this.cards.indexOf(c.id)
                if (at >= 0) this.cards.splice(at, 1)
                else if (this.cards.length < 3) this.cards.push(c.id)
                this.render()
            }, { fontSize: 14, width: 240, selected: k >= 0 }))
        })
        const ids = this.cards.slice()
        L.add(button(this, PANEL_X + PANEL_W / 2, 600, t.getLocale('act2.ui.ok'), () => this.apply(s => enterOptions(s, ids)),
            { fontSize: 22, width: 240, enabled: ids.length === 3 }))
    }

    private drawPrepare(L: Phaser.GameObjects.Container) {
        const t = this.t
        this.prompt(L, t.getLocale('act2.ui.prepare'))
        chumHolders(this.session).forEach((id, i) => {
            L.add(button(this, PANEL_X + PANEL_W / 2, 200 + i * 56, t.getLocale('act2.ui.chum', [`act2.crew.${id}`]), () => this.apply(s => useChum(s, id)), { width: 360 }))
        })
        L.add(button(this, PANEL_X + PANEL_W / 2, 560, t.getLocale('act2.ui.reveal'), () => this.apply(revealShark), { fontSize: 26, width: 360 }))
    }

    private drawHits(L: Phaser.GameObjects.Container, declared: readonly Declared[]) {
        const t = this.t
        const s = this.session
        this.prompt(L, t.getLocale('act2.ui.hits', [currentCard(s.state).zone]))
        CREW_IDS.filter(id => s.state.crew[id].space).forEach((id, i) => {
            const y = 170 + i * 110
            const weapons = hitWeapons(s, id)
            const mine = declared.filter(d => d.crew === id)[0]
            const weapon = (mine && mine.weapon) || this.weaponChoice[id] || weapons[0]
            L.add(button(this, PANEL_X + 90, y, t.getLocale(`act2.crew.${id}`), () => {
                if (!weapon) return
                this.apply(x => declareHit(x, id, mine ? null : weapon, false), true)
            }, { width: 160, selected: !!mine, enabled: weapons.length > 0 }))
            if (weapons.length > 0) {
                L.add(button(this, PANEL_X + 330, y, `${t.getLocale(`act2.gear.${weapon}`)} ▸`, () => {
                    const next = weapons[(weapons.indexOf(weapon) + 1) % weapons.length]
                    this.weaponChoice[id] = next
                    if (mine) this.apply(x => declareHit(x, id, next, false), true)
                    else this.render()
                }, { fontSize: 16, width: 280 }))
            }
            if (mine && mine.weapon === 'pistol') {
                L.add(button(this, PANEL_X + 330, y + 46, t.getLocale('act2.ui.pistolShift'), () => this.apply(x => declareHit(x, id, 'pistol', !mine.pistolShift), true),
                    { fontSize: 14, width: 280, selected: mine.pistolShift }))
            }
        })
        L.add(button(this, PANEL_X + PANEL_W / 2, 560, t.getLocale('act2.ui.ok'), () => this.apply(confirmHits), { fontSize: 24, width: 300 }))
    }

    private drawSettings(L: Phaser.GameObjects.Container) {
        const t = this.t
        const set = this.session.settings
        const onOff = (b: boolean) => t.getLocale(b ? 'act2.on' : 'act2.off')
        const x = PANEL_X + PANEL_W / 2
        L.add(label(this, PANEL_X, 70, t.getLocale('act2.ui.settings'), 24, UI.accent))
        L.add(button(this, x, 140, t.getLocale('act2.settings.appDice', [t.getLocale(set.appDice ? 'act2.settings.dice.app' : 'act2.settings.dice.table')]),
            () => this.apply(s => changeSettings(s, { appDice: !set.appDice }), true), { fontSize: 16, width: 460 }))
        L.add(button(this, x, 200, t.getLocale('act2.settings.variant', [onOff(set.variant)]),
            () => this.apply(s => changeSettings(s, { variant: !set.variant }), true), { fontSize: 15, width: 460 }))
        L.add(button(this, x, 260, t.getLocale('act2.settings.antiStall', [onOff(set.antiStall)]),
            () => this.apply(s => changeSettings(s, { antiStall: !set.antiStall }), true), { fontSize: 16, width: 460 }))
        L.add(button(this, x, 560, t.getLocale('act2.ui.back'), () => { this.showSettings = false; this.render() }, { fontSize: 22, width: 240 }))
    }
}
