import Phaser from "phaser"
import Actions from '~/consts/Actions'
import Zone from "~/objects/Zone"
import ZoneNames from "~/consts/ZoneNames"

export default class Michael extends Phaser.GameObjects.Sprite {

    private readonly buttonName: string
    private positionOnDragStart = new Phaser.Geom.Point(0, 0)
    private linkedTo?: Zone
    readonly initialPosition = new Phaser.Geom.Point(0, 0)

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture)

        this.buttonName = texture
        this.initialPosition = new Phaser.Geom.Point(x, y)

        this.setInteractive().setOrigin(0.5)
        this.scene.input.setDraggable(this)
    }

    moveTo(zone) {
        const x = zone.zoneCfg.swimmerX
        const y = zone.zoneCfg.swimmerY
        if (x && y) {
            this.x = x
            this.y = y
            this.linkedTo = zone
            zone.updateMichael(Actions.ADD)
        } else {
            this.returnHome()
        }
    }

    returnHome() {
        if (this.linkedTo) {
            this.linkedTo?.updateMichael(Actions.REMOVE)
            this.linkedTo = undefined
        }
        this.x = this.initialPosition.x
        this.y = this.initialPosition.y
    }

}