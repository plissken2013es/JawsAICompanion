import Phaser from "phaser"
import SceneKeys from "~/consts/SceneKeys"

export default class LanguageSelection extends Phaser.Scene {
    constructor() {
        super(SceneKeys.LanguageSelection)
    }

    init() {
        //  Inject our CSS
        const styleEl = document.createElement("style")
        document.head.appendChild(styleEl)
        const sheet = styleEl.sheet
        let styles = "@font-face { font-family: 'troika'; src: url('fonts/troika.otf') format('opentype'); }\n"
        if (sheet) sheet.insertRule(styles, 0);
        styles = "@font-face { font-family: 'Elite'; src: url('fonts/special-elite.ttf') format('truetype'); }"
        if (sheet) sheet.insertRule(styles, 0);
    }

    preload() {
        this.load.setPath("img/")
            .image("flag_en", "flag_en.png")
            .image("flag_es", "flag_es.png")
            .spritesheet("jaws-loader", "jaws-loader.png", { frameWidth: 184, frameHeight: 92 })

            // fonts
            .setPath("scripts/")            
            .script("webfont", "webfont.js")
    }

    create() {
        WebFont.load({
            custom: {
                families: [ "Elite", "troika" ]
            },
            active: () => {
                this.add.image(this.cameras.main.centerX - 128, this.cameras.main.centerY, "flag_es")
                    .setOrigin(0.5)
                    .setInteractive()
                    .on(Phaser.Input.Events.POINTER_DOWN, (pointer, x, y, event) => {
                        this.scene.start(SceneKeys.Preloader, { language: "ES" })
                    })
                this.add.image(this.cameras.main.centerX + 128, this.cameras.main.centerY, "flag_en")
                    .setOrigin(0.5)
                    .setInteractive()
                    .on(Phaser.Input.Events.POINTER_DOWN, (pointer, x, y, event) => {
                        this.scene.start(SceneKeys.Preloader, { language: "EN" })
                    })
            }
        }
    }
}