import Phaser from "phaser"

import MapConfig from "~/consts/MapConfig"

export default class Zone extends Phaser.GameObjects.Sprite {

    readonly zoneName: string
    readonly zoneCfg: object

    constructor(scene: Phaser.Scene, cfg: object) {
        super(scene, cfg.x, cfg.y, "map_" + cfg.name)

        this.zoneName = cfg.name
        this.setOrigin(0).setInteractive({ pixelPerfect: true }).input.dropZone = true
        this.zoneCfg = cfg

        this.on(Phaser.Input.Events.POINTER_MOVE, (pointer, x, y, event) => {
            console.log('Moved over Sprite ' + this.zoneName)
            this.setTint(0xffff00)
            event.stopPropagation()
        })
        this.on(Phaser.Input.Events.POINTER_OUT, (pointer, x, y, event) => {
            this.clearTint()
        })
    }


}