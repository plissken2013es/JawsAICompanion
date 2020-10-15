import Phaser from "phaser"
import SceneKeys from "~/consts/SceneKeys"

export default class LanguageSelection extends Phaser.Scene {
    constructor() {
        super(SceneKeys.LanguageSelection)
    }

    create() {
        this.add.image(this.cameras.main.centerX - 128, this.cameras.main.centerY, "flag_es")
            .setOrigin(0.5)
            .setInteractive()
            .on(Phaser.Input.Events.POINTER_DOWN, (pointer, x, y, event) => {
                this.scene.start(SceneKeys.Game, { language: "ES" })
            })
        this.add.image(this.cameras.main.centerX + 128, this.cameras.main.centerY, "flag_en")
            .setOrigin(0.5)
            .setInteractive()
            .on(Phaser.Input.Events.POINTER_DOWN, (pointer, x, y, event) => {
                this.scene.start(SceneKeys.Game, { language: "EN" })
            })
    }
}