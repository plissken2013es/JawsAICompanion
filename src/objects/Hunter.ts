import Phaser from "phaser"

import Characters from "~/consts/Characters"
import Zone from "~/objects/Zone"
import ZoneNames from "~/consts/ZoneNames"
import IGame from '~/objects/IGame'
import DialogType from '~/consts/DialogType'
import Dialog from './Dialog'
import DijkstraManager from '~/utils/DijkstraManager'
import { JawsGraph } from '~/consts/Graph'
import LogManager from '~/utils/LogManager'

export default class Hunter extends Phaser.GameObjects.Sprite {

    readonly hunterName: string
    private positionOnDragStart = new Phaser.Geom.Point(0, 0)
    private _currentZone: Zone
    public get currentZone(): Zone {
        return this._currentZone
    }
    private dijkstraManager: DijkstraManager
    private logManager: LogManager

    constructor(scene: IGame, x: number, y: number, texture: string, startAtZone?: string) {
        super(scene, x, y, texture)

        this.hunterName = texture
        this.setInteractive().setOrigin(0.5)
        this.scene.input.setDraggable(this)
        this.dijkstraManager = DijkstraManager.getInstance()
        this.logManager = LogManager.getInstance(scene.logEnabled)

        let map = scene.getMap()

        if (startAtZone) {
            this._currentZone = map.getZoneByName(startAtZone)
        } else {
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

        const scene = this.scene as IGame

        let failMsg = scene.getLocale("Nothing on the water...")
        let successMsg = scene.getLocale("SHAAARK!!")

        const callback = (button, index) => {
            switch (button.text) {
                case scene.getLocale("Yes"):
                    if (!scene.isJawsVisible()) {
                        scene.launchMessage(failMsg)
                        return
                    }
                    if (this._currentZone.zoneName == scene.getJawsPosition()) {
                        scene.launchMessage(successMsg)
                        this._currentZone.showShark()
                    } else {
                        scene.launchMessage(failMsg)
                    }
                    break
                default:
                    break
            }
            scene.enableInteractiveObjects(scene.currentPhaseTitle)
        }
        const dialog = new Dialog(scene, DialogType.YES_NO, scene.getLocale("Do you want to use binoculars at Brody's location?"), callback)
        scene.disableInteractiveObjects()
    }

    askUserAboutFishFinder() {
        if (this.hunterName != Characters.HOOPER) return

        const scene = this.scene as IGame

        let failMsg = scene.getLocale("NOTHING on the screen...")
        let partialSuccessMsg = scene.getLocale("The shark is nearby from here...")
        let successMsg = scene.getLocale("SHAAARK!!")

        const callback = (button, index) => {
            switch (button.text) {
                case scene.getLocale("Yes"):
                    this.logManager.log(scene.getLocale("Fish Finder activated at: ") + scene.getLocale(this._currentZone.zoneName), true)
                    if (!scene.isJawsVisible()) {
                        scene.launchMessage(failMsg)
                        return
                    }
                    if (this._currentZone.zoneName == scene.getJawsPosition()) {
                        scene.launchMessage(successMsg)
                        this._currentZone.showShark()
                    } else {
                        let foundNear = false
                        this.dijkstraManager.filterNodesByDistance(1, JawsGraph, this._currentZone.zoneName)[1].forEach((zone) => {
                            if (zone == scene.getJawsPosition()) {
                                foundNear = true
                            }
                        })
                        if (foundNear) {
                            scene.launchMessage(partialSuccessMsg)
                        } else {
                            scene.launchMessage(failMsg)
                        }
                    }
                    break
                default:
                    break
            }
            scene.enableInteractiveObjects(scene.currentPhaseTitle)
        }
        const dialog = new Dialog(scene, DialogType.YES_NO, scene.getLocale("Do you want to activate the Fish Finder at Hooper's location?"), callback)
        scene.disableInteractiveObjects()
    }

    animate() {
        const splashSnd = this.scene.sound.add("splash")
        splashSnd.play({ volume: 0.4 })
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 666,
            ease: Phaser.Math.Easing.Expo,
            yoyo: true,
            repeat: 6,
            onComplete: () => {
                splashSnd.destroy()
            },
            onCompleteScope: this
        })
    }

}