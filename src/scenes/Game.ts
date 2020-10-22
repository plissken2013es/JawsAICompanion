import Phaser from "phaser"

import Buttons from '~/consts/Buttons'
import Characters from '~/consts/Characters'
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"
import Board from '~/objects/Board'
import Hunter from '~/objects/Hunter'
import HunterButton from "~/objects/HunterButton"
import LocaleManager from '~/utils/LocaleManager'

export default class Game extends Phaser.Scene {

    private lang: string = Languages.English
    private music?: Phaser.Sound.BaseSound
    private board?: Phaser.GameObjects.GameObject
    private locales?: LocaleManager

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

	preload() {}

    create() {
        this.board = this.add.existing(new Board(this))
        
        this.addCharacters()
        this.addButtons()

        this.bindDragEvents()
    }

    addCharacters() {
        [Characters.BRODY, Characters.HOOPER, Characters.QUINT].forEach((charName) => {
            this.add.existing(new Hunter(this, 0, 0, charName))
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
        });

        [
            { btnName: Buttons.ADD_BARREL }, 
            { 
                btnName: Buttons.ADD_SWIMMER, 
                spriteSelectAnim: "swimmerSelectAnim",
                spriteDroppedAnim: "swimmerDroppedAnim"
            }
        ].forEach((btn, index) => {
            this.add.existing(new HunterButton(this, 920, 80 + (index * 70), btn.btnName, btn.spriteSelectAnim, btn.spriteDroppedAnim))
        })
    }

    bindDragEvents() {
        const dragSounds = [
            this.sound.add("swipe1"),
            this.sound.add("swipe2"),
            this.sound.add("swipe3"),
            this.sound.add("swipe4")
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
            if (gameObject.shouldRemove) { // barrels and swimmers can be removed
                gameObject.shouldRemove()
            }
            if (!dropped && gameObject.positionOnDragStart) {
                gameObject.x = gameObject.positionOnDragStart.x
                gameObject.y = gameObject.positionOnDragStart.y
            }
            if (gameObject.anims && gameObject.anims.currentAnim && !gameObject.shouldRemove) {
                gameObject.anims.stopOnFrame(gameObject.anims.currentAnim.frames[0])
            }
            gameObject.clearTint()
        })

        this.input.on(Phaser.Input.Events.DROP, (pointer, gameObject, dropZone) => {
            console.log("> DROP", gameObject.texture.key, gameObject.x, gameObject.y)
            if (!dropZone || !dropZone.zoneCfg) return
            if (gameObject.moveTo) { // hunters can move
                gameObject.moveTo(dropZone)
            }
            if (gameObject.addTo) { // barrels and swimmers can be added
                gameObject.addTo(dropZone)
            }
        })

    }

    getMap() {
        return this.board
    }

    getLocale(word: string): string {
        return this.locales?.getLocale(word)
    }
}
