import Phaser from "phaser"
import Actions from '~/consts/Actions'
import Zone from "~/objects/Zone"
import ZoneNames from "~/consts/ZoneNames"

export default class Barrel extends Phaser.GameObjects.Sprite {

    private readonly buttonName: string
    readonly positionOnDragStart = new Phaser.Geom.Point(0, 0)
    private linkedTo: Zone

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, zone: Zone) {
        super(scene, x, y, texture)

        this.buttonName = texture

        zone.updateBarrels(Actions.ADD)
        this.linkedTo = zone

        this.setInteractive().setOrigin(0.5)
        this.scene.input.setDraggable(this)
    }

    shouldRemove() {
        const distanceDragged = Phaser.Math.Distance.Between(this.x, this.y, this.positionOnDragStart.x, this.positionOnDragStart.y)
        console.log("distance:", distanceDragged)
        if (distanceDragged > 100) {
            if (this.linkedTo.updateBarrels(Actions.REMOVE)) {
                this.destroy()
            }
        }
        this.x = this.positionOnDragStart.x
        this.y = this.positionOnDragStart.y
    }

}