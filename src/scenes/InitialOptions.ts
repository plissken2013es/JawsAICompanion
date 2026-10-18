import Phaser from "phaser"
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"
import TextButton from '~/objects/TextButton'
import { GameDataToSave } from "~/consts/GameDataToSave"
import LocalStorage from '~/utils/LocalStorage'
import LocaleManager from '~/utils/LocaleManager'
import Act2Locale from '~/act2/i18n'
import Act2Keys from '~/act2/scenes/Act2Keys'
import { loadText } from '~/act2/ui/widgets'

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
        // Always a menu: Act I (continue / new) and Act II (play it on its own / continue it).
        this.createButtons(!!this.localStorage.loadGameData())
    }

    createButtons(act1Saved: boolean) {
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

        if (act1Saved) {
            const btnPlayAgain = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 200, 
                this.locales?.getLocale("CONTINUE LAST GAME"), buttonsCfg, "continueGame", 
                () => {
                    this.scene.start(SceneKeys.Game, { music: this.music, language: this.lang })
                })
                .setOrigin(0.5)
            this.add.existing(btnPlayAgain)
        }
        
        const btnRateApp = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 150, 
            this.locales?.getLocale("NEW GAME"), buttonsCfg, "newGame", 
            () => {
                this.localStorage.reset()
                this.scene.start(SceneKeys.Game, { music: this.music, language: this.lang })
            })
            .setOrigin(0.5)
        this.add.existing(btnRateApp)

        const act2 = new Act2Locale(this.lang)
        const act2Cfg = Object.assign({}, buttonsCfg, { backgroundColor: "#7a1010", fontSize: 26 })
        const btnAct2 = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 100,
            act2.getLocale("act2.menu.playAct2"), act2Cfg, "playAct2",
            () => {
                this.music?.stop()
                this.scene.start(Act2Keys.Setup, { language: this.lang })
            })
            .setOrigin(0.5)
        this.add.existing(btnAct2)

        if (loadText()) {
            const btnResumeAct2 = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 50,
                act2.getLocale("act2.menu.resumeAct2"), act2Cfg, "resumeAct2",
                () => {
                    this.music?.stop()
                    this.scene.start(Act2Keys.Round, { language: this.lang })
                })
                .setOrigin(0.5)
            this.add.existing(btnResumeAct2)
        }
    }

}