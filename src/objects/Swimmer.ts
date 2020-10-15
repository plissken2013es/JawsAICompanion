import Phaser from "phaser"
import Actions from '~/consts/Actions'
import Zone from "~/objects/Zone"
import ZoneNames from "~/consts/ZoneNames"
import IGame from '~/objects/IGame'

export default class Swimmer extends Phaser.GameObjects.Sprite {

    private readonly buttonName: string
    readonly positionOnDragStart = new Phaser.Geom.Point(0, 0)
    private linkedTo: Zone

    constructor(scene: IGame, x: number, y: number, texture: string, zone: Zone) {
        super(scene, x, y, texture)

        this.buttonName = texture

        zone.updateSwimmers(Actions.ADD)
        this.linkedTo = zone

        this.setInteractive().setOrigin(0.5)
        this.scene.input.setDraggable(this)
    }

    eatenByJaws() {
        if (this.linkedTo.updateSwimmers(Actions.REMOVE)) {
            (this.scene as IGame).interactiveObjects = (this.scene as IGame).interactiveObjects.filter((item, index) => {
                return item != this
            })
            this.destroy()
        }
    }

    shouldRemove() {
        const distanceDragged = Phaser.Math.Distance.Between(this.x, this.y, this.positionOnDragStart.x, this.positionOnDragStart.y)
        if (distanceDragged > 100) {
            if (this.linkedTo.updateSwimmers(Actions.REMOVE)) {
                (this.scene as IGame).interactiveObjects = (this.scene as IGame).interactiveObjects.filter((item, index) => {
                    return item != this
                })
                this.destroy()
            }
        }
        this.x = this.positionOnDragStart.x
        this.y = this.positionOnDragStart.y
    }

}