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

export default class Game extends Phaser.Scene implements IGame {

    private lang: string = Languages.English
    private music?: Phaser.Sound.BaseSound
    private board?: Phaser.GameObjects.GameObject
    private locales?: LocaleManager
    private dialog?: any
    private readonly interactiveObjects: Phaser.GameObjects.Sprite[] = []

	constructor() {
		super(SceneKeys.Game)
    }
    
    init(data) {
        console.log("Language selected:", data.language)
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
    }

	preload() { 
        this.load.scenePlugin({
            key: "rexuiplugin",
            url: "scripts/rexuiplugin.min.js",
            sceneKey: "rexUI"
        })
    }

    create() {
        this.board = this.add.existing(new Board(this))
        
        this.addCharacters()
        this.addButtons()

        this.bindDragEvents()
    }

    addCharacters() {
        [Characters.BRODY, Characters.HOOPER, Characters.QUINT].forEach((charName) => {
            const hunter = new Hunter(this, 0, 0, charName)
            this.interactiveObjects.push(hunter)
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

        const michael = new Michael(this, 920, 80, Buttons.MICHAEL)
        this.add.existing(michael)
        this.interactiveObjects.push(michael);
        [
            { btnName: Buttons.ADD_BARREL }, 
            { 
                btnName: Buttons.ADD_SWIMMER, 
                spriteSelectAnim: "swimmerSelectAnim",
                spriteDroppedAnim: "swimmerDroppedAnim"
            }
        ].forEach((btn, index) => {
            const hunterButton = new HunterButton(this, 920, 160 + (index * 70), btn.btnName, btn.spriteSelectAnim, btn.spriteDroppedAnim)
            this.add.existing(hunterButton)
            this.interactiveObjects.push(hunterButton)
        })
    }

    bindDragEvents() {
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
            console.log("DRAG_START", gameObject)
        })
    
        this.input.on(Phaser.Input.Events.DRAG, (pointer, gameObject, dragX, dragY) => {    
            gameObject.x = dragX | 0
            gameObject.y = dragY | 0
        })

        this.input.on(Phaser.Input.Events.DRAG_END, (pointer, gameObject, dropped) => {
            console.log("> DRAG_END", gameObject.texture.key, gameObject.x, gameObject.y, "dropped:", dropped)
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
            console.log("> DROP", gameObject.texture.key, gameObject.x, gameObject.y)
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

    getMap(): Phaser.GameObjects.GameObject | undefined {
        return this.board
    }

    getLocale(word: string): string {
        return this.locales?.getLocale(word)
    }
}
