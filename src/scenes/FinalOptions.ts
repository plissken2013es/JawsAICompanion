import Phaser from "phaser"
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"
import TextButton from '~/objects/TextButton'
import { GameDataToSave } from "~/consts/GameDataToSave"
import LocalStorage from '~/utils/LocalStorage'
import LocaleManager from '~/utils/LocaleManager'

export default class FinalOptions extends Phaser.Scene {
    
    private lang: string = Languages.English
    private locales?: LocaleManager

    constructor() {
        super(SceneKeys.FinalOptions)
    }

    init(data) {
        this.lang = data.language
        this.locales = new LocaleManager(this.lang)
    }

    create() {
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "jaws_pixel").setOrigin(0.5, 1)

        const buttonsCfg = { 
            fill: "#fff",
            backgroundColor: "#004258",
            padding: { x: 6, y: 6 },
            fontSize: 30
        }

        const btnPlayAgain = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 200, 
            this.locales?.getLocale("I want to PLAY AGAIN"), buttonsCfg, "playAgain", 
            () => {
                let gameData = {}
                gameData[GameDataToSave.TEMPORARY_LANGUAGE] = this.lang
                LocalStorage.getInstance().saveGameData(gameData)
                window.location.reload()
            })
            .setOrigin(0.5)
        this.add.existing(btnPlayAgain)

        /*
        const btnRateApp = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 100, 
            this.locales?.getLocale("I'd like to rate this App and/or suggest another one"), buttonsCfg, "rateApp", 
            () => {
                window.open("https://play.google.com/store/apps/details?id=com.islamoncloa.elSecretoDeIslaMoncloa", "_blank")
            })
            .setOrigin(0.5)
        this.add.existing(btnRateApp)

        const btnSuggest = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 150, 
            this.locales?.getLocale("I want to get the source code of this App"), buttonsCfg, "suggest", 
            () => {
                window.open("https://github.com/plissken2013es/islaMoncloa_codigoFuente", "_blank")
            })
            .setOrigin(0.5)
        this.add.existing(btnSuggest)

        const btnKofi = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 50, 
            this.locales?.getLocale("I want to invite the App creator to a coffee"), buttonsCfg, "kofi", 
            () => {
                window.open("https://ko-fi.com/luisquin", "_blank")
            })
            .setOrigin(0.5)
        this.add.existing(btnKofi)
        */
    }

}