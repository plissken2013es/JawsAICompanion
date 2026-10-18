import Phaser from "phaser"
import SceneKeys from "~/consts/SceneKeys"
import Languages from "~/consts/Languages"
import { GameDataToSave } from "~/consts/GameDataToSave"
import LocalStorage from '~/utils/LocalStorage'

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
        styles = "@font-face { font-family: 'American'; src: url('fonts/american.otf') format('opentype'); }"
        if (sheet) sheet.insertRule(styles, 0);
        styles = "@font-face { font-family: 'Noto'; src: url('fonts/noto.ttf') format('truetype'); }"
        if (sheet) sheet.insertRule(styles, 0);
        styles = "@font-face { font-family: 'Alice'; src: url('fonts/Alice.ttf') format('truetype'); }"
        if (sheet) sheet.insertRule(styles, 0);
    }

    preload() {
        this.load.setPath("img/")
            .image("flag_en", "flag_en.png")
            .image("flag_es", "flag_es.png")
            .image("flag_de", "flag_de.png")
            .image("flag_it", "flag_it.png")
            .image("flag_ru", "flag_ru.png")
            .spritesheet("jaws-loader", "jaws-loader.png", { frameWidth: 184, frameHeight: 92 })

            // fonts
            .setPath("scripts/")            
            .script("webfont", "webfont.js")
    }

    create() {
        WebFont.load({
            custom: {
                families: [ "Alice", "Noto", "American", "Elite", "troika" ]
            },
            active: () => {
                const localStorage = LocalStorage.getInstance()
                const temporaryLanguage = localStorage.loadGameData() && localStorage.loadGameData()[GameDataToSave.TEMPORARY_LANGUAGE]
                if (temporaryLanguage) {
                    localStorage.removeItem(GameDataToSave.TEMPORARY_LANGUAGE)
                    this.scene.start(SceneKeys.Preloader, { language: temporaryLanguage })
                } else {
                    this.add.image(this.cameras.main.centerX - 340, this.cameras.main.centerY, "flag_en")
                        .setOrigin(0.5)
                        .setInteractive()
                        .on(Phaser.Input.Events.POINTER_DOWN, () => {
                            this.scene.start(SceneKeys.Preloader, { language: Languages.English })
                        })
                    this.add.image(this.cameras.main.centerX - 170, this.cameras.main.centerY, "flag_es")
                        .setOrigin(0.5)
                        .setInteractive()
                        .on(Phaser.Input.Events.POINTER_DOWN, () => {
                            this.scene.start(SceneKeys.Preloader, { language: Languages.Spanish })
                        })
                    this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "flag_de")
                        .setOrigin(0.5)
                        .setInteractive()
                        .on(Phaser.Input.Events.POINTER_DOWN, () => {
                            this.scene.start(SceneKeys.Preloader, { language: Languages.German })
                        })
                    this.add.image(this.cameras.main.centerX + 170, this.cameras.main.centerY, "flag_it")
                        .setOrigin(0.5)
                        .setInteractive()
                        .on(Phaser.Input.Events.POINTER_DOWN, () => {
                            this.scene.start(SceneKeys.Preloader, { language: Languages.Italian })
                        })
                    this.add.image(this.cameras.main.centerX + 340, this.cameras.main.centerY, "flag_ru")
                        .setOrigin(0.5)
                        .setInteractive()
                        .on(Phaser.Input.Events.POINTER_DOWN, () => {
                            this.scene.start(SceneKeys.Preloader, { language: Languages.Russian })
                        })
                }
            }
        })
    }
}