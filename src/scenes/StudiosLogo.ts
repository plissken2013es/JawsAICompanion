import Phaser from "phaser"
import SceneKeys from "~/consts/SceneKeys"

export default class StudiosLogo extends Phaser.Scene {

    private lang = "EN"

    constructor() {
        super(SceneKeys.StudiosLogo)
    }

    init(data) {
        this.lang = data.language
    }

    create() {
        const logo = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, "studiosLogo").setOrigin(0.5)
        this.anims.create({
            key: "logo",
            frames: this.anims.generateFrameNumbers("studiosLogo", {}),
            frameRate: 8,
            repeat: 0
        })

        let proudlyPresents = "Proudly presents..."
        switch (this.lang) {
            case "ES":
                proudlyPresents = "Se enorgullece de presentar..."
                break
            case "DE":
                proudlyPresents = "Präsentiert stolz"
                break
        }

        logo.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 140, proudlyPresents,
                { fontFamily: "Alice", color: "#5656ee", align: "center", fontSize: 20 }).setOrigin(0.5)
            this.time.delayedCall(2000, () => {
                this.scene.start(SceneKeys.Intro, { language: this.lang })
            }, [], this)
        }, this)

        logo.play("logo")

        this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
            this.scene.start(SceneKeys.Intro, { language: this.lang })
        })
    }
}