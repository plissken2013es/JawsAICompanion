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
import LogManager from '~/utils/LogManager'

export default class HunterButton extends Phaser.GameObjects.Sprite {

    private readonly buttonName: string
    private positionOnDragStart = new Phaser.Geom.Point(0, 0)
    private readonly spriteSelectAnim?: string
    private readonly spriteDroppedAnim?: string
    private onlyClickable: boolean = false
    private logManager: LogManager

    constructor(scene: IGame, x: number, y: number, cfg: any) {

        super(scene, x, y, cfg.btnName, 0)

        this.logManager = LogManager.getInstance(scene.logEnabled)

        this.buttonName = cfg.btnName
        this.spriteSelectAnim = cfg.spriteSelectAnim
        this.spriteDroppedAnim = cfg.spriteDroppedAnim
        this.onlyClickable = cfg.onlyClickable

        this.setInteractive()
        if (cfg.btnName == Buttons.ADD_SWIMMER) {
            this.setDisplaySize(this.width*1.4, this.height*1.4)
        }
        this.setOrigin(0.5)

        if (this.onlyClickable) {
            this.on(Phaser.Input.Events.POINTER_DOWN, (pointer) => {
                this.onClick()
            })
        } else {
            this.scene.input.setDraggable(this)
        }
    }

    addTo(zone: Zone) {
        const scene = this.scene as IGame
        switch (this.buttonName) {
            case Buttons.ADD_BARREL:
                this.x = this.positionOnDragStart.x
                this.y = this.positionOnDragStart.y
                const posX = zone.zoneCfg.barrelX
                const posY = zone.zoneCfg.barrelY
                if (zone.zoneCfg && posX && posY) {
                    const msg = scene.getLocale("Are you sure that you want to launch a barrel\nat zone ") + scene.getLocale(zone.zoneName) + "?"
                    const callback = (button, index) => {
                        switch (button.text) {
                            case scene.getLocale("Yes"):
                                this.logManager.log(scene.getLocale("Barrel launch at: ") + scene.getLocale(zone.zoneName), true)
                                if (scene.getJawsPosition() == zone.zoneName) {
                                    scene.launchMessage(scene.getLocale("You've attached a barrel to the shark!"))
                                    this.logManager.log(scene.getLocale("You've attached a barrel to the shark!"), true)
                                    zone.showShark()
                                    scene.attachBarrelToJaws()
                                } else {
                                    if (zone.hasBarrels()) {
                                        zone.updateBarrels(Actions.ADD)
                                    } else {
                                        const barrel = new Barrel(this.scene, posX, posY, Buttons.BARREL, zone)
                                        this.scene.add.existing(barrel)
                                        scene.interactiveObjects.push(barrel)
                                    }
                                }
                                break
                            default:
                                break
                        }
                        scene.enableInteractiveObjects(scene.currentPhaseTitle)
                    }
                    this.scene.time.delayedCall(150, () => {
                        const dialog = new Dialog(scene, DialogType.YES_NO, msg, callback)
                        scene.disableInteractiveObjects()
                    }, [], this)
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
                        const swimmer = new Swimmer(scene, x, y, "swimmer_sprite", zone)
                        if (this.spriteDroppedAnim) {
                            swimmer.play(this.spriteDroppedAnim)
                        }
                        this.scene.add.existing(swimmer)
                        scene.interactiveObjects.push(swimmer)
                    }
                }
                break
        }
    }

    onClick() {
        const scene = this.scene as IGame
        switch (this.buttonName) {
            case Buttons.FISH_FINDER:
                const hooper = scene.findCharacterBy(Characters.HOOPER)
                hooper?.askUserAboutFishFinder()
                break

            case Buttons.BINOCULARS:
                const brody = scene.findCharacterBy(Characters.BRODY)
                brody?.askUserAboutBinoculars()
                break
        }
    }
}