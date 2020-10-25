import Phaser from "phaser"

import Characters from "~/consts/Characters"
import Zone from "~/objects/Zone"
import ZoneNames from "~/consts/ZoneNames"
import IGame from '~/objects/IGame'
import DialogType from '~/consts/DialogType'
import Dialog from './Dialog'
import DijkstraManager from '~/utils/DijkstraManager'
import { JawsGraph } from '~/consts/Graph'

export default class Hunter extends Phaser.GameObjects.Sprite {

    readonly hunterName: string
    private positionOnDragStart = new Phaser.Geom.Point(0, 0)
    private _currentZone: Zone
    public get currentZone(): Zone {
        return this._currentZone
    }
    private dijkstraManager: DijkstraManager

    constructor(scene: IGame, x: number, y: number, texture: string) {
        super(scene, x, y, texture)

        this.hunterName = texture
        this.setInteractive().setOrigin(0.5)
        this.scene.input.setDraggable(this)
        this.dijkstraManager = DijkstraManager.getInstance()

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

    askUserAboutBinoculars() {
        if (this.hunterName != Characters.BRODY || !this.currentZone.zoneCfg.isBeach) return

        let failMsg = this.scene.getLocale("Nothing on the water...")
        let successMsg = this.scene.getLocale("SHAAARK!!")

        const callback = (button, index) => {
            switch (button.text) {
                case this.scene.getLocale("Yes"):
                    if (!this.scene.isJawsVisible()) {
                        this.scene.launchMessage(failMsg)
                        return
                    }
                    if (this._currentZone.zoneName == this.scene.getJawsPosition()) {
                        this.scene.launchMessage(successMsg)
                        this._currentZone.showShark()
                    } else {
                        this.scene.launchMessage(failMsg)
                    }
                    break
                default:
                    break
            }
            this.scene.enableInteractiveObjects()
        }
        const dialog = new Dialog(this.scene, DialogType.YES_NO, this.scene.getLocale("Do you want to use binoculars at Brody's location?"), callback)
        this.scene.disableInteractiveObjects()
    }

    askUserAboutFishFinder() {
        if (this.hunterName != Characters.HOOPER) return

        let failMsg = this.scene.getLocale("NOTHING on the screen...")
        let partialSuccessMsg = this.scene.getLocale("The shark is nearby from here...")
        let successMsg = this.scene.getLocale("SHAAARK!!")

        const callback = (button, index) => {
            switch (button.text) {
                case this.scene.getLocale("Yes"):
                    console.log(this.scene.getLocale("Fish Finder activated at: ") + this.scene.getLocale(this._currentZone.zoneName), true)
                    if (!this.scene.isJawsVisible()) {
                        this.scene.launchMessage(failMsg)
                        return
                    }
                    if (this._currentZone.zoneName == this.scene.getJawsPosition()) {
                        this.scene.launchMessage(successMsg)
                        this._currentZone.showShark()
                    } else {
                        let foundNear = false
                        this.dijkstraManager.filterNodesByDistance(1, JawsGraph, this._currentZone.zoneName)[1].forEach((zone) => {
                            if (zone == this.scene.getJawsPosition()) {
                                foundNear = true
                            }
                        })
                        if (foundNear) {
                            this.scene.launchMessage(partialSuccessMsg)
                        } else {
                            this.scene.launchMessage(failMsg)
                        }
                    }
                    break
                default:
                    break
            }
            this.scene.enableInteractiveObjects()
        }
        const dialog = new Dialog(this.scene, DialogType.YES_NO, this.scene.getLocale("Do you want to activate the Fish Finder at Hooper's location?"), callback)
        this.scene.disableInteractiveObjects()
    }

    animate() {
        // TO-DO
    }

}