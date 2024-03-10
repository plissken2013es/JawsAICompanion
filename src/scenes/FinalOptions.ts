import Phaser from "phaser"
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"
import TextButton from '~/objects/TextButton'
import { GameDataToSave } from "~/consts/GameDataToSave"
import LocalStorage from '~/utils/LocalStorage'
import LocaleManager from '~/utils/LocaleManager'
import Dialog from '~/objects/Dialog'
import DialogType from '~/consts/DialogType'

export default class FinalOptions extends Phaser.Scene {
    
    private lang: string = Languages.English
    private locales?: LocaleManager
    private interactiveObjects: Phaser.GameObjects.GameObject[] = []

    constructor() {
        super(SceneKeys.FinalOptions)
    }

    init(data) {
        this.lang = data.language
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
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "jaws_pixel").setOrigin(0.5, 1)

        const buttonsCfg = { 
            fill: "#fff",
            backgroundColor: "#004258",
            padding: { x: 6, y: 6 },
            fontSize: 30
        }

        const creditsButtonCfg = { 
            fill: "#ffff00",
            backgroundColor: "#000000",
            padding: { x: 6, y: 6 },
            fontSize: 24
        }

        const btnCredits = new TextButton(this, this.cameras.main.width - 20, 20, 
            this.getLocale("Credits"), creditsButtonCfg, "credits", 
            () => {
                this.launchCredits()
            })
            .setOrigin(1, 0)
        this.add.existing(btnCredits)

        const btnPlayAgain = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 200, 
            this.getLocale("I want to PLAY AGAIN"), buttonsCfg, "playAgain", 
            () => {
                let gameData = {}
                gameData[GameDataToSave.TEMPORARY_LANGUAGE] = this.lang
                LocalStorage.getInstance().saveGameData(gameData)
                window.location.reload()
            })
            .setOrigin(0.5)
        this.add.existing(btnPlayAgain)

        const btnRateApp = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 100, 
            this.getLocale("I'd like to rate this App and/or suggest another one"), buttonsCfg, "rateApp", 
            () => {
                window.open("https://play.google.com/store/apps/details?id=com.netlify.JawsCompanion", "_blank")
            })
            .setOrigin(0.5)
        this.add.existing(btnRateApp)

        const btnSuggest = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 150, 
            this.getLocale("I want to get the source code of this App"), buttonsCfg, "suggest", 
            () => {
                window.open("https://github.com/plissken2013es/JawsAICompanion", "_blank")
            })
            .setOrigin(0.5)
        this.add.existing(btnSuggest)

        const btnKofi = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 50, 
            this.getLocale("I want to invite the App creator to a coffee"), buttonsCfg, "kofi", 
            () => {
                window.open("https://ko-fi.com/luisquin", "_blank")
            })
            .setOrigin(0.5)
        this.add.existing(btnKofi)

        this.interactiveObjects.push(btnCredits, btnKofi, btnPlayAgain, btnRateApp, btnSuggest)
    }

    enableInteractiveObjects(onOff: Boolean = true) {
        this.interactiveObjects.forEach((obj) => {
            onOff ? this.input.enable(obj) : this.input.disable(obj)
        })
    }

    getLocale(word: string | string[]): string {
        return this.locales?.getLocale(word)
    } 

    launchCredits() {
        const creditsMsg = this.getLocale("CREDITS:\n\n\nCode:\n@impactophaser (Twitter)\n\nGerman translation:\nDennis Beck (BGG: Joelllenbecker)\n\nRussian translation:\nShapkin Roman Anatolievich\n\n\nGame testers:\nJeff Rowley, Seattle, WA, USA\njrowley (boardgamegeek.com)\n\nQuimérico Inquilino\n(Spain, labsk.net)")

        const callback = (button, index) => {
            console.log("credits callback!")
            this.enableInteractiveObjects()
        }
        const dialog = new Dialog(this, DialogType.OK, creditsMsg, callback)
        this.enableInteractiveObjects(false)
    }

}