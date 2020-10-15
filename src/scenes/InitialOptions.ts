import Phaser from "phaser"
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"
import TextButton from '~/objects/TextButton'
import { GameDataToSave } from "~/consts/GameDataToSave"
import LocalStorage from '~/utils/LocalStorage'
import LocaleManager from '~/utils/LocaleManager'

export default class InitialOptions extends Phaser.Scene {
    
    private lang: string = Languages.English
    private music?: Phaser.Sound.BaseSound
    private localStorage: LocalStorage = LocalStorage.getInstance()
    private locales?: LocaleManager

    constructor() {
        super(SceneKeys.InitialOptions)
    }

    init(data) {
        this.lang = data.language
        this.music = data.music
        this.localStorage = LocalStorage.getInstance()
        this.locales = new LocaleManager(this.lang)
    }

    create() {
        const savedGameData = this.localStorage.loadGameData()
        if (savedGameData) {
            this.createButtons()
        } else {
            this.scene.start(SceneKeys.Game, { music: this.music, language: this.lang })
        }
    }

    createButtons() {
        const jawsAttack = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, "attack_spritesheet").setOrigin(0.5, 1)
        const attackAnim = this.anims.create({
            key: "attackAnim",
            frames: this.anims.generateFrameNumbers("attack_spritesheet", {}),
            frameRate: 8,
            repeat: -1
        })
        jawsAttack.play("attackAnim")

        const buttonsCfg = { 
            fill: "#fff",
            backgroundColor: "#004258",
            padding: { x: 6, y: 6 },
            fontSize: 30
        }

        const btnPlayAgain = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 200, 
            this.locales?.getLocale("CONTINUE LAST GAME"), buttonsCfg, "continueGame", 
            () => {
                this.scene.start(SceneKeys.Game, { music: this.music, language: this.lang })
            })
            .setOrigin(0.5)
        this.add.existing(btnPlayAgain)
        
        const btnRateApp = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 150, 
            this.locales?.getLocale("NEW GAME"), buttonsCfg, "newGame", 
            () => {
                this.localStorage.reset()
                this.scene.start(SceneKeys.Game, { music: this.music, language: this.lang })
            })
            .setOrigin(0.5)
        this.add.existing(btnRateApp)
    }

}