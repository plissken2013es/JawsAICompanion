import Phaser from "phaser"

import MapConfig from "~/consts/MapConfig"
import ZoneNames from "~/consts/ZoneNames"
import IZoneCfg from './IZoneCfg'

export default class Zone extends Phaser.GameObjects.Sprite {

    readonly zoneName: string
    readonly zoneCfg: IZoneCfg

    constructor(scene: Phaser.Scene, cfg: IZoneCfg) {
        super(scene, cfg.x, cfg.y, "map_" + cfg.name)

        this.zoneName = cfg.name
        this.setOrigin(0).setInteractive({ pixelPerfect: true }).input.dropZone = true
        this.zoneCfg = cfg

        if (cfg.text && cfg.textX && cfg.textY) {
            scene.add.text(cfg.textX, cfg.textY, scene.getLocale(cfg.text), { fontFamily: "Elite", color: "#fff", align: "center", fontSize: 30 }).setOrigin(0.5)
        }

        this.on(Phaser.Input.Events.POINTER_MOVE, (pointer, x, y, event) => {
            console.log('Moved over Sprite ' + this.zoneName)
            event.stopPropagation()
        })
    }

    isOpenSea() {
        if (this.name === ZoneNames.ONE || this.name === ZoneNames.TWO || this.name === ZoneNames.THREE || this.name === ZoneNames.FOUR) {
            return true
        }
        return false
    }

    isCentralAmity() {
        return this.name === ZoneNames.A
    }

}