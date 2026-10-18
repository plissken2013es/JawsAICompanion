import Phaser from 'phaser'
import type { Zone, Space, CrewId, TileState } from '~/act2/core/types'
import { ZONES, TILE_THRESHOLDS, columnOf } from '~/act2/core/data'
import { CREW_IDS } from '~/act2/core/state'

/**
 * The Orca as a plain 2 × 4 schematic (BLUEPRINT P-21, no game art): from left (stern, zones 1/5)
 * to right (bow, 4/8); the top row's water above it, the bottom row's below. Shows each tile's
 * state and thresholds, the crew tokens and the shark, labels (A/B/C options) and highlights, and
 * reports taps on spaces and tokens.
 */
export interface SchematicView {
    readonly tiles: Readonly<Record<Zone, TileState>>
    readonly crew: Readonly<Partial<Record<CrewId, Space | null>>>
    readonly wounds?: Readonly<Partial<Record<CrewId, number>>>
    readonly shark?: Space | null
    /** Text per zone, drawn in its water (e.g. "A", "B C"). */
    readonly labels?: Readonly<Partial<Record<Zone, string>>>
    /** Spaces drawn with a highlight (selectable, or the shark's target). */
    readonly highlight?: readonly Space[]
    readonly target?: Space | null
    readonly selectedCrew?: CrewId | null
}

export const CREW_COLORS: Readonly<Record<CrewId, number>> = { brody: 0x3b82f6, quint: 0x22c55e, hooper: 0xf59e0b }
const CREW_LETTER: Readonly<Record<CrewId, string>> = { brody: 'B', quint: 'Q', hooper: 'H' }

const COLORS = {
    water: 0x0b3d6b, waterGone: 0x0e4f8a, deck: 0x9c6b3c, damaged: 0x5e3d1e, edge: 0x1d1d1d,
    text: '#ffffff', faint: '#9bb7d4', highlight: 0xffee00, target: 0xff3b30, shark: 0x9aa5b1,
}

export default class OrcaSchematic {
    private readonly root: Phaser.GameObjects.Container
    private onSpace: (space: Space) => void = () => undefined
    private onCrew: (crew: CrewId) => void = () => undefined

    constructor(private readonly scene: Phaser.Scene, readonly x: number, readonly y: number,
        readonly cellW = 118, readonly cellH = 92) {
        this.root = scene.add.container(x, y)
    }

    onSpaceTap(cb: (space: Space) => void): this { this.onSpace = cb; return this }
    onCrewTap(cb: (crew: CrewId) => void): this { this.onCrew = cb; return this }

    get width(): number { return 4 * this.cellW }
    get height(): number { return 4 * this.cellH }

    /** Top-left corner of a space, relative to the schematic. */
    cellOf(space: Space): { x: number; y: number } {
        const col = columnOf(space.zone) - 1
        const top = space.zone <= 4
        const row = space.kind === 'water' ? (top ? 0 : 3) : (top ? 1 : 2)
        return { x: col * this.cellW, y: row * this.cellH }
    }

    draw(view: SchematicView): void {
        this.root.removeAll(true)
        const g = this.scene.add.graphics()
        this.root.add(g)

        for (const zone of ZONES) {
            const state = view.tiles[zone]
            for (const kind of ['water', 'boat'] as const) {
                const sp: Space = { kind, zone }
                const c = this.cellOf(sp)
                const gone = kind === 'boat' && state === 'gone'
                const fill = kind === 'water' ? COLORS.water : gone ? COLORS.waterGone : state === 'damaged' ? COLORS.damaged : COLORS.deck
                g.fillStyle(fill, 1).fillRect(c.x + 1, c.y + 1, this.cellW - 2, this.cellH - 2)
                if (state === 'damaged' && kind === 'boat') {
                    g.lineStyle(2, 0x2b1a0b, 1)
                    for (let k = 12; k < this.cellW; k += 22) g.lineBetween(c.x + k, c.y + 4, c.x + k - 10, c.y + this.cellH - 4)
                }
                g.lineStyle(1, COLORS.edge, 1).strokeRect(c.x, c.y, this.cellW, this.cellH)

                // A destroyed tile leaves one water space: the deck cell is drawn as water, tapping it means that water.
                const tapSpace: Space = gone ? { kind: 'water', zone } : sp
                const hit = this.scene.add.zone(c.x, c.y, this.cellW, this.cellH).setOrigin(0).setInteractive({ useHandCursor: true })
                hit.on('pointerup', () => this.scene.time.delayedCall(0, () => this.onSpace(tapSpace), [], this))
                this.root.add(hit)

                if (kind === 'boat' && !gone) {
                    const t = TILE_THRESHOLDS[zone]
                    const label = state === 'ok' ? `${t.damage}|${t.destroy}` : `${t.destroyDamaged}`
                    this.root.add(this.scene.add.text(c.x + this.cellW - 6, c.y + this.cellH - 4, label,
                        { fontFamily: 'Alice', fontSize: '14px', color: COLORS.faint }).setOrigin(1, 1))
                }
                if (kind === 'water') {
                    this.root.add(this.scene.add.text(c.x + 6, c.y + 4, String(zone), { fontFamily: 'Alice', fontSize: '15px', color: COLORS.faint }))
                    const label = view.labels && view.labels[zone]
                    if (label) {
                        this.root.add(this.scene.add.text(c.x + this.cellW - 8, c.y + 6, label,
                            { fontFamily: 'Alice', fontSize: '22px', color: '#ffee00', fontStyle: 'bold' }).setOrigin(1, 0))
                    }
                }
            }
        }

        for (const sp of view.highlight || []) {
            const c = this.cellOf(sp)
            g.lineStyle(4, COLORS.highlight, 1).strokeRect(c.x + 3, c.y + 3, this.cellW - 6, this.cellH - 6)
        }
        if (view.target) {
            const c = this.cellOf(view.target)
            g.lineStyle(5, COLORS.target, 1).strokeRect(c.x + 2, c.y + 2, this.cellW - 4, this.cellH - 4)
        }

        if (view.shark) {
            const c = this.cellOf(view.shark)
            const cx = c.x + this.cellW / 2
            const cy = c.y + this.cellH / 2 + 10
            g.fillStyle(COLORS.shark, 1).fillTriangle(cx - 26, cy + 14, cx + 20, cy + 14, cx + 6, cy - 26)
            g.lineStyle(2, 0xffffff, 0.8).lineBetween(cx - 34, cy + 16, cx + 30, cy + 16)
        }

        // Crew tokens: several in one space sit side by side.
        const placed: Record<string, number> = {}
        for (const id of CREW_IDS) {
            const sp = view.crew[id]
            if (!sp) continue
            const shown: Space = sp.kind === 'boat' && view.tiles[sp.zone] === 'gone' ? { kind: 'water', zone: sp.zone } : sp
            const key = shown.kind + shown.zone
            const n = placed[key] || 0
            placed[key] = n + 1
            const c = this.cellOf(shown)
            const cx = c.x + 24 + n * 34
            const cy = c.y + this.cellH / 2 + (shown.kind === 'water' ? 12 : 0)
            const selected = view.selectedCrew === id
            const token = this.scene.add.circle(cx, cy, selected ? 17 : 15, CREW_COLORS[id]).setStrokeStyle(selected ? 4 : 2, selected ? COLORS.highlight : 0x000000)
            token.setInteractive({ useHandCursor: true }).on('pointerup', (p: Phaser.Input.Pointer, lx: number, ly: number, e: Phaser.Types.Input.EventData) => {
                e.stopPropagation()
                this.scene.time.delayedCall(0, () => this.onCrew(id), [], this)
            })
            this.root.add(token)
            this.root.add(this.scene.add.text(cx, cy, CREW_LETTER[id], { fontFamily: 'Alice', fontSize: '16px', color: '#000000', fontStyle: 'bold' }).setOrigin(0.5))
            const w = view.wounds && view.wounds[id]
            if (w) this.root.add(this.scene.add.text(cx, cy + 20, `${w}`, { fontFamily: 'Alice', fontSize: '12px', color: '#ff8080' }).setOrigin(0.5, 0))
        }

        // Stern and bow captions.
        this.root.add(this.scene.add.text(-6, this.height / 2, '◄', { fontSize: '14px', color: COLORS.faint }).setOrigin(1, 0.5))
        this.root.add(this.scene.add.text(this.width + 6, this.height / 2, '►', { fontSize: '14px', color: COLORS.faint }).setOrigin(0, 0.5))
    }

    destroy(): void {
        this.root.destroy(true)
    }
}
