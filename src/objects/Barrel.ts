import Phaser from "phaser"
import Actions from '~/consts/Actions'
import Zone from "~/objects/Zone"
import ZoneNames from "~/consts/ZoneNames"
import IGame from './IGame'

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

    animate() {
        const sirenSnd = this.scene.sound.add("siren")
        sirenSnd.play({ volume: 0.25 })
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 666,
            ease: Phaser.Math.Easing.Expo,
            yoyo: true,
            repeat: 6,
            onComplete: () => {
                sirenSnd.destroy()
            },
            onCompleteScope: this
        })
    }

    shouldRemove() {
        const distanceDragged = Phaser.Math.Distance.Between(this.x, this.y, this.positionOnDragStart.x, this.positionOnDragStart.y)
        if (distanceDragged > 100) {
            if (this.linkedTo.updateBarrels(Actions.REMOVE)) {
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