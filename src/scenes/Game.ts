import Phaser from "phaser"
import Characters from '~/consts/Characters'
import SceneKeys from "~/consts/SceneKeys"
import Board from '~/objects/Board'
import Hunter from '~/objects/Hunter'
import LocaleManager from '~/utils/LocaleManager'

export default class Game extends Phaser.Scene
{

    private lang: string = "EN"
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
        
        let brody = this.add.existing(new Hunter(this, 150, 150, Characters.BRODY))
        let hooper = this.add.existing(new Hunter(this, 250, 250, Characters.HOOPER))
        let quint = this.add.existing(new Hunter(this, 350, 350, Characters.QUINT))

        this.bindDragEvents()
    }

    bindDragEvents() {
        this.input.on(Phaser.Input.Events.DRAG_START, (pointer, gameObject) => {
            gameObject.positionOnDragStart = { x: gameObject.x, y: gameObject.y }
            gameObject.setTint(0xff0000)
            console.log("dragStart", gameObject)
        })
    
        this.input.on(Phaser.Input.Events.DRAG, (pointer, gameObject, dragX, dragY) => {    
            gameObject.x = dragX | 0
            gameObject.y = dragY | 0
        })

        this.input.on(Phaser.Input.Events.DROP, (pointer, gameObject, dropZone) => {
            if (!dropZone || !dropZone.zoneCfg) return
            if (gameObject.moveTo) {
                gameObject.moveTo(dropZone)
            }
        })
    
        this.input.on(Phaser.Input.Events.DRAG_END, (pointer, gameObject, dropped) => {
            console.log(gameObject.texture.key, gameObject.x, gameObject.y, "dropped:", dropped)
            if (!dropped && gameObject.positionOnDragStart) {
                gameObject.x = gameObject.positionOnDragStart.x
                gameObject.y = gameObject.positionOnDragStart.y
            }
            gameObject.clearTint()
        })
    }

    getMap() {
        return this.board
    }

    getLocale(word: string): string {
        return this.locales?.getLocale(word)
    }
}
