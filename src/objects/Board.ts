import Phaser from "phaser"

import MapConfig from "~/consts/MapConfig"
import Zone from "~/objects/Zone"
import IZoneCfg from './IZoneCfg'
import IGame from '~/objects/IGame'

export default class Board extends Phaser.GameObjects.Container {

    private readonly background: Phaser.GameObjects.Image
    private readonly _mapZones: Zone[] = []
    public get mapZones(): Zone[] {
        return this._mapZones
    }

    constructor(scene: IGame) {
        super(scene, 0, 0)

        this.background = scene.add.image(0, 0, "amityBg").setOrigin(0)
        scene.boardCenter = new Phaser.Geom.Point(this.background.width / 2, this.background.height / 2)

        MapConfig.forEach((zoneCfg) => {
            const mapZone: Zone = new Zone(scene, zoneCfg as IZoneCfg)
            this._mapZones.push(mapZone)
        })
    }

    getZoneByName(zoneName: string) {
        return this._mapZones.find(zone => zone.zoneName === zoneName)
    }

}