import Phaser from "phaser"

import Characters from "~/consts/Characters"
import Zone from "~/objects/Zone"
import ZoneNames from "~/consts/ZoneNames"

export default class Hunter extends Phaser.GameObjects.Sprite {

    private readonly hunterName: string
    private positionOnDragStart: object = { x: 0, y: 0 }

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture)

        this.hunterName = texture

        this.setInteractive()

        scene.input.setDraggable(this)

        let map = scene.getMap()
        let startPosition: Zone = map.getZoneByName(ZoneNames.S)
        switch (this.hunterName) {
            case Characters.BRODY:
                startPosition = map.getZoneByName(ZoneNames.SEVEN)
                break
            case Characters.HOOPER:
                startPosition = map.getZoneByName(ZoneNames.FIVE)
                break
            case Characters.QUINT:
                startPosition = map.getZoneByName(ZoneNames.EIGHT)
                break
        }
        this.moveTo(startPosition)
    }

    moveTo(zone: Zone) {
        let destinationX
        let destinationY
        switch (this.hunterName) {
            case Characters.BRODY:
                destinationX = zone.zoneCfg.brodyX || this.positionOnDragStart.x
                destinationY = zone.zoneCfg.brodyY || this.positionOnDragStart.y
                break
            case Characters.HOOPER:
                destinationX = zone.zoneCfg.hooperX || this.positionOnDragStart.x
                destinationY = zone.zoneCfg.hooperY || this.positionOnDragStart.y
                break
            case Characters.QUINT:
                destinationX = zone.zoneCfg.quintX || this.positionOnDragStart.x
                destinationY = zone.zoneCfg.quintY || this.positionOnDragStart.y
                break
        }
        if (destinationX && destinationY) {
            this.x = destinationX
            this.y = destinationY
        }
    }

}