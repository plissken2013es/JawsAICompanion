import Phaser from "phaser"

import MapConfig from "~/consts/MapConfig"

export default class Board extends Phaser.GameObjects.Container {

    private readonly background: Phaser.GameObjects.Image
    private readonly mapZones: Phaser.GameObjects.Sprite[] = []

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0)

        this.background = scene.add.image(0, 0, "amityBg").setOrigin(0)

        MapConfig.forEach((zoneCfg) => {
            const mapZone = scene.add.sprite(zoneCfg.x, zoneCfg.y, "map_" + zoneCfg.name).setOrigin(0).setInteractive({ pixelPerfect: true })
            mapZone.on(Phaser.Input.Events.POINTER_MOVE, (pointer, x, y, event) => {
                text.setText('Moved over Sprite ' + mapZone.texture.key)
                mapZone.setTint(0xffff00)
                event.stopPropagation()
            })
            mapZone.on(Phaser.Input.Events.POINTER_OUT, (pointer, x, y, event) => {
                mapZone.clearTint()
            })
            this.mapZones.push(mapZone)
        })
       
        let text = scene.add.text(10, 10, 'Click either of the sprites', { font: '16px Courier', fill: '#fff' })
        scene.input.on(Phaser.Input.Events.POINTER_MOVE, () => {
            text.setText("")
        })

    }

}