import Phaser from "phaser"
import SceneKeys from "~/consts/SceneKeys"
import TitleType from '~/consts/TitleType'
import IGame from '~/objects/IGame'

export default class PhaseTitle extends Phaser.Scene {
    
    private boardCenter = new Phaser.Geom.Point(0, 0)
    private mainScene?: IGame
    private callback?: Function
    private texts: Phaser.GameObjects.Text[] = []
    private type?: string

    constructor() {
        super(SceneKeys.PhaseTitle)
    }

    init(data: any) {
        if (data.type) {
            this.type = data.type
        }
        if (data.boardCenter) {
            this.boardCenter = data.boardCenter
        }
        if (data.mainScene) {
            this.mainScene = data.mainScene
        }
        if (data.callback) {
            this.callback = data.callback
        }
    }

    create() {
        if (this.type != TitleType.EVENT_SHARK_PHASE && this.type != TitleType.CREW_PHASE) return

        const displaySharkTexts = () => {
            const title = this.add.text(this.boardCenter.x, this.boardCenter.y - 50, 
                this.mainScene!.getLocale("EVENT PHASE + SHARK PHASE"),
            {
                fontFamily: "Elite",
                color: "#e9c29f", 
                align: "center", 
                fontSize: 50 
            }).setOrigin(0.5)
            const desc = this.add.text(this.boardCenter.x, this.boardCenter.y, 
                this.mainScene!.getLocale("Draw Amity Event card.\nDeploy swimmers.\nClick on any Shark Action button."),
            {
                fontFamily: "Elite",
                color: "#fff", 
                align: "center", 
                fontSize: 30 
            }).setOrigin(0.5, 0)
            this.texts.push(title, desc)
        }

        const displayCrewTexts = () => {
            const title = this.add.text(this.boardCenter.x, this.boardCenter.y - 50, 
                this.mainScene!.getLocale("CREW PHASE"),
            {
                fontFamily: "Elite",
                color: "#e9c29f", 
                align: "center", 
                fontSize: 50 
            }).setOrigin(0.5)
            const desc = this.add.text(this.boardCenter.x, this.boardCenter.y, 
                this.mainScene!.getLocale("Move characters.\nPerform actions.\nWhen finished, click 'End turn' button."),
            {
                fontFamily: "Elite",
                color: "#fff", 
                align: "center", 
                fontSize: 30 
            }).setOrigin(0.5, 0)
            this.texts.push(title, desc)
        }

        const bloodBg = this.add.sprite(this.boardCenter.x, this.boardCenter.y, "blood_bg").setOrigin(0.5)
        const maskShape = this.make.graphics({})
        maskShape.fillStyle(0xffffff, 1)
        maskShape.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height)
        maskShape.x = -this.cameras.main.width
        bloodBg.mask = new Phaser.Display.Masks.GeometryMask(this, maskShape)
        const phaseAudio = this.sound.add("phase_title")
        phaseAudio.play({ volume: 0.5 })
        this.tweens.add({
            targets: maskShape,
            x: 0,
            duration: 333,
            ease: Phaser.Math.Easing.Linear,
            onComplete: () => {
                if (this.type == TitleType.CREW_PHASE) {
                    displayCrewTexts()
                } else {
                    displaySharkTexts()
                }
            },
            onCompleteScope: this
        })

        this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
            phaseAudio.play({ volume: 0.5 })
            this.tweens.add({
                targets: maskShape,
                x: this.cameras.main.width,
                duration: 333,
                ease: Phaser.Math.Easing.Linear,
                onComplete: () => {
                    this.texts.forEach((text) => {
                        text.destroy()
                        if (this.callback) this.callback.apply(this.mainScene)
                    })
                },
                onCompleteScope: this
            })
        })
    }

}