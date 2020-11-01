import Phaser from "phaser"
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"
import TextButton from '~/objects/TextButton'
import { GameDataToSave } from "~/consts/GameDataToSave"
import LocalStorage from '~/utils/LocalStorage'

export default class FinalOptions extends Phaser.Scene {
    
    private lang: string = Languages.English

    constructor() {
        super(SceneKeys.FinalOptions)
    }

    init(data) {
        this.lang = data.language
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
            "I want to PLAY AGAIN", buttonsCfg, "playAgain", 
            () => {
                let gameData = {}
                gameData[GameDataToSave.TEMPORARY_LANGUAGE] = this.lang
                LocalStorage.getInstance().saveGameData(gameData)
                window.location.reload()
            })
            .setOrigin(0.5)
        this.add.existing(btnPlayAgain)

        const btnRateApp = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 100, 
            "I'd like to rate this App", buttonsCfg, "rateApp", 
            () => {
                window.open("https://play.google.com/store/apps/details?id=com.islamoncloa.elSecretoDeIslaMoncloa", "_blank")
            })
            .setOrigin(0.5)
        this.add.existing(btnRateApp)

        const btnSuggest = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 150, 
            "I want to suggest another board game SOLO AI App", buttonsCfg, "suggest", 
            () => {
                window.open("https://ko-fi.com/luisquin", "_blank")
            })
            .setOrigin(0.5)
        this.add.existing(btnSuggest)

        const btnKofi = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 50, 
            "I want to invite the App creator to a coffee", buttonsCfg, "kofi", 
            () => {
                window.open("https://ko-fi.com/luisquin", "_blank")
            })
            .setOrigin(0.5)
        this.add.existing(btnKofi)
    }

}