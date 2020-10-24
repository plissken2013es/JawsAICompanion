import Phaser from "phaser"

import Buttons from "~/consts/Buttons"
import Zone from "~/objects/Zone"
import ZoneNames from "~/consts/ZoneNames"
import Barrel from './Barrel'
import Actions from '~/consts/Actions'
import Swimmer from './Swimmer'
import Dialog from './Dialog'
import DialogType from '~/consts/DialogType'
import IGame from '~/objects/IGame'
import Characters from '~/consts/Characters'

export default class HunterButton extends Phaser.GameObjects.Sprite {

    private readonly buttonName: string
    private positionOnDragStart = new Phaser.Geom.Point(0, 0)
    private readonly spriteSelectAnim?: string
    private readonly spriteDroppedAnim?: string
    private onlyClickable: boolean = false
    readonly scene: IGame

    constructor(scene: IGame, x: number, y: number, cfg: any) {

        super(scene, x, y, cfg.btnName, 0)

        this.scene = scene
        this.buttonName = cfg.btnName
        this.spriteSelectAnim = cfg.spriteSelectAnim
        this.spriteDroppedAnim = cfg.spriteDroppedAnim
        this.onlyClickable = cfg.onlyClickable

        this.setInteractive().setOrigin(0.5)

        if (this.onlyClickable) {
            this.on(Phaser.Input.Events.POINTER_DOWN, (pointer) => {
                console.log("> CLICK", this.buttonName)
                this.onClick()
            })
        } else {
            this.scene.input.setDraggable(this)
        }
    }

    addTo(zone: Zone) {
        console.log("addTo:", zone)

        switch (this.buttonName) {
            case Buttons.ADD_BARREL:
                this.x = this.positionOnDragStart.x
                this.y = this.positionOnDragStart.y
                const posX = zone.zoneCfg.barrelX
                const posY = zone.zoneCfg.barrelY
                if (zone.zoneCfg && posX && posY) {
                    const msg = this.scene.getLocale("Are you sure that you want to launch a barrel\nat zone ") + this.scene.getLocale(zone.zoneName) + "?"
                    const callback = (button, index) => {
                        switch (button.text) {
                            case this.scene.getLocale("Yes"):
                                if (zone.hasBarrels()) {
                                    zone.updateBarrels(Actions.ADD)
                                } else {
                                    this.scene.add.existing(new Barrel(this.scene, posX, posY, "barrel", zone))
                                }
                                break
                            default:
                                break
                        }
                        this.scene.enableInteractiveObjects()
                    }
                    const dialog = new Dialog(this.scene, DialogType.YES_NO, msg, callback)
                    this.scene.disableInteractiveObjects()
                }
                break

            case Buttons.MICHAEL:
                this.x = this.positionOnDragStart.x
                this.y = this.positionOnDragStart.y
                const mX = zone.zoneCfg.swimmerX
                const mY = zone.zoneCfg.swimmerY
                if (zone.zoneCfg && mX && mY) {
                    this.x = mX
                    this.y = mY                    
                }
                break

            case Buttons.ADD_SWIMMER:
                this.x = this.positionOnDragStart.x
                this.y = this.positionOnDragStart.y
                const x = zone.zoneCfg.swimmerX
                const y = zone.zoneCfg.swimmerY
                if (zone.zoneCfg && x && y) {
                    if (zone.hasSwimmers()) {
                        zone.updateSwimmers(Actions.ADD)
                    } else {
                        const swimmer = new Swimmer(this.scene, x, y, "swimmer_sprite", zone)
                        if (this.spriteDroppedAnim) {
                            swimmer.play(this.spriteDroppedAnim)
                        }
                        this.scene.add.existing(swimmer)
                    }
                }
                break
        }
    }

    onClick() {
        console.log("click", this.buttonName)
        switch (this.buttonName) {
            case Buttons.FISH_FINDER:
                const hooper = this.scene.findCharacterBy(Characters.HOOPER)
                console.log(hooper.hunterName, hooper.currentZone.zoneName)
                break

            case Buttons.BINOCULARS:
                const brody = this.scene.findCharacterBy(Characters.BRODY)
                console.log(brody.hunterName, brody.currentZone.zoneName)
                break
        }
    }
}