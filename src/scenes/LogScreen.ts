import Phaser from "phaser"
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"
import IGame from '~/objects/IGame'
import ScrollablePanel from '~/objects/ScrollablePanel'
import TextButton from '~/objects/TextButton'
import LocaleManager from '~/utils/LocaleManager'
import LogManager from '~/utils/LogManager'

export default class LogScreen extends Phaser.Scene {
    
    private mainScene?: IGame
    private boardCenter = new Phaser.Geom.Point(0, 0)
    private callback?: Function
    private rexUI: any
    private panel: any
    private lang: string = Languages.English
    private logManager: LogManager
    private locales?: LocaleManager

    private COLOR_PRIMARY: number = 0x004258
    private COLOR_LIGHT: number = 0x7b5e57
    private COLOR_DARK: number = 0x00001a

    constructor() {
        super(SceneKeys.LogScreen)

        this.logManager = LogManager.getInstance(false)
    }

    init(data: any) {
        if (data.mainScene) {
            this.mainScene = data.mainScene
        }
        if (data.callback) {
            this.callback = data.callback
        }
        if (data.boardCenter) {
            this.boardCenter = data.boardCenter
        }
        if (data.language) {
            this.lang = data.language
            this.locales = new LocaleManager(this.lang)
        }
    }

    create() {
        const maskShape = this.make.graphics({})
        maskShape.fillStyle(0x000, .75)
        maskShape.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height)
        this.add.existing(maskShape)

        let logs = this.logManager.savedLogs
        logs.unshift(this.mainScene?.getLocale("THE JAWS LOG") + "\n------------------------")
        const panel = new ScrollablePanel(this, this.boardCenter, logs.join("\n"))

        const buttonsCfg = { 
            fill: "#fff",
            backgroundColor: "#004258",
            padding: { x: 6, y: 6 },
            fontSize: 30
        }

        const btn = new TextButton(this, this.boardCenter.x, this.cameras.main.height - 50, 
            this.locales?.getLocale("END GAME"), buttonsCfg, "endGame", this.callback)
            .setOrigin(0.5)
        this.add.existing(btn)
    }

}