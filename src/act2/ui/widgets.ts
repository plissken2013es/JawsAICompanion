import Phaser from 'phaser'

/** Small UI kit for the Act II scenes: big, readable buttons for a phone in landscape. */
export interface ButtonOptions {
    readonly fontSize?: number
    readonly width?: number
    readonly color?: string
    readonly background?: number
    readonly selected?: boolean
    readonly enabled?: boolean
    readonly align?: 'left' | 'center'
}

export const UI = {
    font: 'Alice',
    text: '#ffffff',
    dim: '#8fa8c8',
    accent: '#ffee00',
    button: 0x004258,
    buttonSelected: 0x0b7a3b,
    buttonDisabled: 0x2a2f36,
    danger: 0x7a1010,
}

export function button(scene: Phaser.Scene, x: number, y: number, label: string, onTap: () => void,
    opts: ButtonOptions = {}): Phaser.GameObjects.Container {
    const fontSize = opts.fontSize || 20
    const enabled = opts.enabled !== false
    const text = scene.add.text(0, 0, label, {
        fontFamily: UI.font, fontSize: `${fontSize}px`, color: enabled ? (opts.color || UI.text) : UI.dim,
        align: opts.align || 'center', wordWrap: opts.width ? { width: opts.width - 16 } : undefined,
    }).setOrigin(opts.align === 'left' ? 0 : 0.5, 0.5)
    const w = opts.width || text.width + 24
    const h = Math.max(fontSize + 18, text.height + 12)
    if (opts.align === 'left') text.setX(-w / 2 + 10)
    const bg = scene.add.rectangle(0, 0, w, h,
        !enabled ? UI.buttonDisabled : opts.selected ? UI.buttonSelected : (opts.background === undefined ? UI.button : opts.background))
        .setStrokeStyle(2, opts.selected ? 0xffee00 : 0x000000)
    const c = scene.add.container(x, y, [bg, text]).setSize(w, h)
    if (enabled) {
        c.setInteractive({ useHandCursor: true })
        c.on('pointerdown', () => bg.setFillStyle(0x0aa0c0))
        c.on('pointerout', () => bg.setFillStyle(opts.selected ? UI.buttonSelected : (opts.background === undefined ? UI.button : opts.background)))
        // Run the action on the next frame: it usually redraws the screen, and destroying the button
        // while Phaser is still dispatching this pointer event drops or delays the next taps.
        c.on('pointerup', () => scene.time.delayedCall(0, onTap, [], scene))
    }
    return c
}

export function label(scene: Phaser.Scene, x: number, y: number, text: string, size = 20, color = UI.text,
    width?: number): Phaser.GameObjects.Text {
    return scene.add.text(x, y, text, {
        fontFamily: UI.font, fontSize: `${size}px`, color, wordWrap: width ? { width } : undefined,
    })
}

/** Save slot of the Act II game, separate from Act I's. */
export const ACT2_SAVE_KEY = 'JawsAI_act2'

export function saveText(text: string): void {
    try { window.localStorage.setItem(ACT2_SAVE_KEY, text) } catch (e) { /* storage unavailable: play on */ }
}

export function loadText(): string | null {
    try { return window.localStorage.getItem(ACT2_SAVE_KEY) } catch (e) { return null }
}

export function clearSave(): void {
    try { window.localStorage.removeItem(ACT2_SAVE_KEY) } catch (e) { /* nothing to clear */ }
}
