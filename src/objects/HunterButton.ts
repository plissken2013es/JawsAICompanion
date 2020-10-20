import Phaser from "phaser"

import Buttons from "~/consts/Buttons"
import Zone from "~/objects/Zone"
import ZoneNames from "~/consts/ZoneNames"
import Barrel from './Barrel'
import Actions from '~/consts/Actions'

export default class HunterButton extends Phaser.GameObjects.Sprite {

    private readonly buttonName: string
    private positionOnDragStart = new Phaser.Geom.Point(0, 0)

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture)

        this.buttonName = texture

        this.setInteractive().setOrigin(0.5)

        this.scene.input.setDraggable(this)
    }

    addTo(zone: Zone) {
        console.log("addTo:", zone)

        if (this.buttonName == Buttons.ADD_BARREL) {
            this.x = this.positionOnDragStart.x
            this.y = this.positionOnDragStart.y
            const posX = zone.zoneCfg.barrelX
            const posY = zone.zoneCfg.barrelY
            if (zone.zoneCfg && posX && posY) {
                if (zone.hasBarrels()) {
                    zone.updateBarrels(Actions.ADD)
                } else {
                    this.scene.add.existing(new Barrel(this.scene, posX, posY, "barrel", zone))
                }
            }
        }
    }
}