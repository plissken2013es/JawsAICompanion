import Phaser from "phaser"

import Buttons from '~/consts/Buttons'
import Characters from '~/consts/Characters'
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"
import Board from '~/objects/Board'
import Hunter from '~/objects/Hunter'
import HunterButton from "~/objects/HunterButton"
import Michael from '~/objects/Michael'
import LocaleManager from '~/utils/LocaleManager'

export default class Game extends Phaser.Scene {

    private lang: string = Languages.English
    private music?: Phaser.Sound.BaseSound
    private board?: Phaser.GameObjects.GameObject
    private locales?: LocaleManager
    private dialog?: any

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
        
        const msg = this.getLocale("Do you want to build a snow man? |\nHey, Barracuda! Do you know if it's still there?")
        const print = this.add.text(0, 0, '');
        const callback = (button, index) => {
            print.text += index + ": " + button.text + "\n";
            this.input.enable(this.michael)
        }
        this.dialog = this.createYesNoDialog(msg, callback)
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
        })

        this.michael = this.add.existing(new Michael(this, 920, 80, Buttons.MICHAEL));
        [
            { btnName: Buttons.ADD_BARREL }, 
            { 
                btnName: Buttons.ADD_SWIMMER, 
                spriteSelectAnim: "swimmerSelectAnim",
                spriteDroppedAnim: "swimmerDroppedAnim"
            }
        ].forEach((btn, index) => {
            this.add.existing(new HunterButton(this, 920, 160 + (index * 70), btn.btnName, btn.spriteSelectAnim, btn.spriteDroppedAnim))
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
            if (this.dialog) return

            gameObject.x = dragX | 0
            gameObject.y = dragY | 0
        })

        this.input.on(Phaser.Input.Events.DRAG_END, (pointer, gameObject, dropped) => {
            if (this.dialog) return

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
            if (this.dialog) return

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

    createYesNoDialog(message: string = "Do you wanna?", callback: Function) {
        this.input.disable(this.michael)
        const dialog = this.rexUI.add.dialog({
            width: 200,
            height: 150,
            anchor: {
                centerX: "center",
                centerY: "center"
            },

            background: this.rexUI.add.roundRectangle(0, 0, 200, 150, 5, 0x1565c0),

            content: this.add.text(0, 0, message, {
                fontFamily: "Elite",
                align: "center",
                fontSize: 20
            }),

            actions: [
                this.createLabel(this, "Yes"),
                this.createLabel(this, "No")
            ],

            space: {
                title: 25,
                content: 25,
                action: 15,

                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
            },

            align: {
                actions: "center",
            },

            expand: {
                content: false,
            }
        })
            .layout()
            //.drawBounds(this.add.graphics(), 0xff0000)
            .popUp(666);

        dialog
            .on("button.click", (button, groupName, index) => {
                callback(button, index)
                if (button.text == "No") dialog.scaleDownDestroy(666)
            }, this)
            .on("button.over", (button, groupName, index) => {
                button.getElement("background").setStrokeStyle(1, 0xffffff);
            })
            .on("button.out", (button, groupName, index) => {
                button.getElement("background").setStrokeStyle();
            })
    }

    createLabel(scene, text) {
        return scene.rexUI.add.label({
            width: 40,
            height: 40,
    
            background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 5, 0x5e92f3),
    
            text: scene.add.text(0, 0, text, {
                fontFamily: "Elite",
                color: "#004258",
                align: "center",
                fontSize: 18
            }),
    
            space: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
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
