import Phaser from "phaser"

import Buttons from '~/consts/Buttons'
import Characters from '~/consts/Characters'
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"
import Board from '~/objects/Board'
import Hunter from '~/objects/Hunter'
import HunterButton from "~/objects/HunterButton"
import LocaleManager from '~/utils/LocaleManager'

export default class Game extends Phaser.Scene
{

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
        [Buttons.ADD_BARREL].forEach((btnName) => {
            this.add.existing(new HunterButton(this, 920, 80, btnName))
        })
    }

    bindDragEvents() {
        this.input.on(Phaser.Input.Events.DRAG_START, (pointer, gameObject) => {
            gameObject.positionOnDragStart =  new Phaser.Geom.Point(gameObject.x, gameObject.y)
            gameObject.setTint(0xff0000)
            console.log("dragStart", gameObject)
        })
    
        this.input.on(Phaser.Input.Events.DRAG, (pointer, gameObject, dragX, dragY) => {    
            gameObject.x = dragX | 0
            gameObject.y = dragY | 0
        })

        this.input.on(Phaser.Input.Events.DRAG_END, (pointer, gameObject, dropped) => {
            console.log(gameObject.texture.key, gameObject.x, gameObject.y, "dropped:", dropped)
            if (gameObject.shouldRemove) { // barrels and swimmers can be removed
                gameObject.shouldRemove()
            }
            if (!dropped && gameObject.positionOnDragStart) {
                gameObject.x = gameObject.positionOnDragStart.x
                gameObject.y = gameObject.positionOnDragStart.y
            }
            gameObject.clearTint()
        })

        this.input.on(Phaser.Input.Events.DROP, (pointer, gameObject, dropZone) => {
            console.log(gameObject.texture.key, gameObject.x, gameObject.y)
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
