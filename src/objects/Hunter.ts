import Phaser from "phaser"

import Characters from "~/consts/Characters"
import Zone from "~/objects/Zone"
import ZoneNames from "~/consts/ZoneNames"
import IGame from '~/objects/IGame'

export default class Hunter extends Phaser.GameObjects.Sprite {

    readonly hunterName: string
    private positionOnDragStart = new Phaser.Geom.Point(0, 0)
    private _currentZone: Zone
    public get currentZone(): Zone {
        return this._currentZone
    }

    constructor(scene: IGame, x: number, y: number, texture: string) {
        super(scene, x, y, texture)

        this.hunterName = texture

        this.setInteractive().setOrigin(0.5)

        scene.input.setDraggable(this)

        let map = scene.getMap()
        this._currentZone = map.getZoneByName(ZoneNames.S)
        switch (this.hunterName) {
            case Characters.BRODY:
                this._currentZone = map.getZoneByName(ZoneNames.SEVEN)
                break
            case Characters.HOOPER:
                this._currentZone = map.getZoneByName(ZoneNames.FIVE)
                break
            case Characters.QUINT:
                this._currentZone = map.getZoneByName(ZoneNames.EIGHT)
                break
        }
        this.moveTo(this._currentZone)
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
            this._currentZone = zone
        }
    }

    animate() {
        // TO-DO
    }

}