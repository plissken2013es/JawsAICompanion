import Phaser from "phaser"

import Buttons from '~/consts/Buttons'
import Characters from '~/consts/Characters'
import DialogType from '~/consts/DialogType'
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"
import Board from '~/objects/Board'
import Dialog from '~/objects/Dialog'
import Hunter from '~/objects/Hunter'
import HunterButton from "~/objects/HunterButton"
import Michael from '~/objects/Michael'
import IGame from '~/objects/IGame'
import LocaleManager from '~/utils/LocaleManager'
import JawsAI from '~/utils/JawsAI'
import PhaseTitle from './PhaseTitle'
import TextButton from '~/objects/TextButton'
import SharkButtons from '~/consts/SharkButtons'
import Swimmer from '~/objects/Swimmer'
import Zone from '~/objects/Zone'

export default class Game extends Phaser.Scene implements IGame {

    private lang: string = Languages.English
    private music?: Phaser.Sound.BaseSound
    private board?: Board
    private locales?: LocaleManager
    private dialog?: any
    interactiveObjects: Phaser.GameObjects.GameObject[] = []
    private hunters: Hunter[] = []
    private jawsAI?: JawsAI
    boardCenter = new Phaser.Geom.Point(0, 0)
    private _michael?: Michael
    public get michael(): Michael | undefined {
        return this._michael
    }

	constructor() {
		super(SceneKeys.Game)
    }
    
    init(data) {
        this.lang = data.language
        this.music = data.music
        if (this.music) {
            this.tweens.add({
                targets: this.music,
                volume: 0,
                duration: 2000,
                onComplete: () => {
                    this.music!.stop()
                },
                onCompleteScope: this
            })
        }
        this.locales = new LocaleManager(this.lang)
        this.board = new Board(this)
        this.add.existing(this.board)
        this.jawsAI = JawsAI.getInstance(this)
    }

	preload() { 
        this.load.scenePlugin({
            key: "rexuiplugin",
            url: "scripts/rexuiplugin.min.js",
            sceneKey: "rexUI"
        })
    }

    create() {
        this.addCharacters()
        this.addButtons()
        this.bindButtonEvents()
        this.addSharkButtons()

        /*
        this.add.image(this.cameras.main.centerX, 570, "brody_eyes").setOrigin(0)
        this.add.image(this.cameras.main.centerX + 120, 570, "hooper_eyes").setOrigin(0)
        this.add.image(this.cameras.main.centerX + 240, 570, "quint_eyes").setOrigin(0)
        */

        this.launchPhaseTitle()
    }

    addCharacters() {
        [Characters.BRODY, Characters.HOOPER, Characters.QUINT].forEach((charName) => {
            const hunter = new Hunter(this, 0, 0, charName)
            this.interactiveObjects.push(hunter)
            this.hunters.push(hunter)
            this.add.existing(hunter)
        })
    }

    addButtons() {
        const swimmerSelectAnim = this.anims.create({
            key: "swimmerSelectAnim",
            frames: this.anims.generateFrameNumbers("swimmer_sprite", { start: 0, end: 2 }),
            frameRate: 16,
            repeat: -1
        })
        const swimmerDroppedAnim = this.anims.create({
            key: "swimmerDroppedAnim",
            frames: this.anims.generateFrameNumbers("swimmer_sprite", { start: 3, end: 5 }),
            frameRate: 4,
            yoyo: true,
            repeat: -1
        })

        this._michael = new Michael(this, 920, 80, Buttons.MICHAEL)
        this.add.existing(this._michael)
        this.interactiveObjects.push(this._michael);
        [
            { btnName: Buttons.ADD_BARREL }, 
            { 
                btnName: Buttons.ADD_SWIMMER, 
                spriteSelectAnim: "swimmerSelectAnim",
                spriteDroppedAnim: "swimmerDroppedAnim"
            },
            { btnName: Buttons.FISH_FINDER, onlyClickable: true },
            { btnName: Buttons.BINOCULARS, onlyClickable: true }
        ].forEach((btnCfg, index) => {
            const hunterButton = new HunterButton(this, 920, 160 + (index * 70), btnCfg)
            this.add.existing(hunterButton)
            this.interactiveObjects.push(hunterButton)
        })
    }

    addSharkButtons() {
        const y = ((this.cameras.main.height - (this.boardCenter.y * 2)) / 2) + (this.boardCenter.y * 2)

        const sharkButtons = [
            { text: this.getLocale("Jaws 3 actions").toUpperCase(), key: SharkButtons.JAWS_3 },
            { text: this.getLocale("Jaws 4 actions").toUpperCase(), key: SharkButtons.JAWS_4 },
            { text: this.getLocale("Jaws (Gardner's boat)").toUpperCase(), key: SharkButtons.JAWS_G },
        ]
        const buttonsCfg = { 
            fill: "#fff",
            backgroundColor: "#004258",
            padding: { x: 6, y: 6 },
            fontSize: 20
        }

        let widthsSum = 0
        sharkButtons.forEach((btnCfg) => {
            const btn = new TextButton(this, 20 + widthsSum, y, " " + btnCfg.text + " ", buttonsCfg, btnCfg.key, this.onSharkActionButtonPressed)
                .setOrigin(0, 0.5)
            this.add.existing(btn)
            this.interactiveObjects.push(btn)
            widthsSum += btn.getBounds().width + 20
        })
    }

    bindButtonEvents() {
        const dragSounds = [
            this.sound.add("swipe1"),
            this.sound.add("swipe2"),
            this.sound.add("swipe3"),
            this.sound.add("swipe4")
        ]

        const dropSounds = [
            this.sound.add("drop1"),
            this.sound.add("drop2"),
            this.sound.add("drop3"),
            this.sound.add("drop4"),
            this.sound.add("drop5")
        ]

        this.input.on(Phaser.Input.Events.DRAG_START, (pointer, gameObject) => {
            gameObject.positionOnDragStart =  new Phaser.Geom.Point(gameObject.x, gameObject.y)
            gameObject.setTint(0xff0000)
            if (gameObject.spriteSelectAnim) {
                gameObject.play(gameObject.spriteSelectAnim)
            }
            const snd = Phaser.Utils.Array.GetRandom(dragSounds)
            snd.play()
        })
    
        this.input.on(Phaser.Input.Events.DRAG, (pointer, gameObject, dragX, dragY) => {    
            gameObject.x = dragX | 0
            gameObject.y = dragY | 0
        })

        this.input.on(Phaser.Input.Events.DRAG_END, (pointer, gameObject, dropped) => {
            const snd = Phaser.Utils.Array.GetRandom(dropSounds)
            snd.play()
            if (gameObject.shouldRemove) { // barrels and swimmers can be removed
                gameObject.shouldRemove()
            }
            if (!dropped && gameObject.positionOnDragStart) { // barrels and swimmers
                gameObject.x = gameObject.positionOnDragStart.x
                gameObject.y = gameObject.positionOnDragStart.y
            }
            if (!dropped && gameObject.returnHome) { // Michael
                gameObject.returnHome()
            }
            if (gameObject.anims && gameObject.anims.currentAnim && !gameObject.shouldRemove) {
                gameObject.anims.stopOnFrame(gameObject.anims.currentAnim.frames[0])
            }
            gameObject.clearTint()
        })

        this.input.on(Phaser.Input.Events.DROP, (pointer, gameObject, dropZone) => {
            if (!dropZone || !dropZone.zoneCfg) return
            if (gameObject.moveTo) { // Michael && hunters can move
                gameObject.moveTo(dropZone)
            }
            if (gameObject.addTo) { // barrels and swimmers can be added
                gameObject.addTo(dropZone)
            }
        })
    }

    disableInteractiveObjects() {
        this.interactiveObjects.forEach((obj) => {
            this.input.disable(obj)
        })
    }

    enableInteractiveObjects() {
        this.interactiveObjects.forEach((obj) => {
            this.input.enable(obj)
        })
    }

    findCharacterBy(name: string): Hunter | undefined {
        return this.hunters.find(hunter => hunter.hunterName === name)
    }

    findSwimmerAt(beach: Zone): Swimmer {
        const swimmer = this.interactiveObjects.find(swimmer => {
            if (swimmer && swimmer.linkedTo) {
                return swimmer.linkedTo.zoneName === beach.zoneName
            }
            return false
        })
        return swimmer as Swimmer
    }

    getMap(): Phaser.GameObjects.GameObject | undefined {
        return this.board
    }

    getLocale(word: string): string {
        return this.locales?.getLocale(word)
    }

    launchMessage(msg: string, isLastMessage: boolean = false) {
        console.log("------------------------------------->", msg)
        this.time.delayedCall(500, () => {
            const callback = (button, index) => {
                this.enableInteractiveObjects()
            }
            const dialog = new Dialog(this, DialogType.OK, msg, callback)
            this.disableInteractiveObjects()
        }, [], this)
    }

    launchPhaseTitle() {
        this.disableInteractiveObjects()
        this.scene.add(SceneKeys.PhaseTitle, PhaseTitle, true, { 
            boardCenter: this.boardCenter, 
            mainScene: this,
            callback: () => {
                this.enableInteractiveObjects()
                this.scene.remove(SceneKeys.PhaseTitle)
            }
        })
    }

    onSharkActionButtonPressed(buttonKey: string) {
        let numActions = 3
        let isGardnersBoat = false
        switch (buttonKey) {
            case SharkButtons.JAWS_3:
                break

            case SharkButtons.JAWS_4:
                numActions = 4
                break

            case SharkButtons.JAWS_G:
                isGardnersBoat = true
                break

            default:
                return
        }
        if (this.jawsAI) {
            this.jawsAI.setInitialJawsPositionIfNeeded(false)
            this.jawsAI.selectTaskIfNeeded(numActions, isGardnersBoat)
            this.jawsAI.performJawsActions(numActions, isGardnersBoat)
        }
    }

    updateBodyCount() {
        // TO-DO
    }
}
