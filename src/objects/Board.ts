import Phaser from "phaser"

import MapConfig from "~/consts/MapConfig"
import Zone from "~/objects/Zone"

export default class Board extends Phaser.GameObjects.Container {

    private readonly background: Phaser.GameObjects.Image
    private readonly mapZones: Zone[] = []

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0)

        this.background = scene.add.image(0, 0, "amityBg").setOrigin(0)

        MapConfig.forEach((zoneCfg) => {
            const mapZone: Zone = new Zone(scene, zoneCfg)
            this.mapZones.push(mapZone)
        })
    }

    getZoneByName(zoneName: string) {
        return this.mapZones.find(zone => zone.zoneName === zoneName)
    }

}