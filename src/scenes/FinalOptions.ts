import Phaser, { Game } from "phaser"
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

        const btn = new TextButton(this, this.cameras.main.centerX, this.cameras.main.height - 50, 
            "END GAME", buttonsCfg, "endGame", 
            () => {
                let gameData = {}
                gameData[GameDataToSave.TEMPORARY_LANGUAGE] = this.lang
                LocalStorage.getInstance().saveGameData(gameData)
                window.location.reload()
            })
            .setOrigin(0.5)
        this.add.existing(btn)
    }

}