import Phaser from "phaser"
import Actions from '~/consts/Actions'
import MapConfig from "~/consts/MapConfig"
import ZoneNames from "~/consts/ZoneNames"
import IZoneCfg from './IZoneCfg'

export default class Zone extends Phaser.GameObjects.Sprite {

    readonly zoneName: string
    readonly zoneCfg: IZoneCfg
    private numBarrels: number = 0
    private numSwimmers: number = 0
    private numBarrelsText?: Phaser.GameObjects.Text
    private numSwimmersText?: Phaser.GameObjects.Text

    constructor(scene: Phaser.Scene, cfg: IZoneCfg) {
        super(scene, cfg.x, cfg.y, "map_" + cfg.name)

        this.zoneName = cfg.name
        this.setOrigin(0).setInteractive({ pixelPerfect: true }).input.dropZone = true
        this.zoneCfg = cfg

        if (cfg.text && cfg.textX && cfg.textY) {
            scene.add.text(cfg.textX, cfg.textY, scene.getLocale(cfg.text), { fontFamily: "Elite", color: "#fff", align: "center", fontSize: 30 }).setOrigin(0.5)
        }
    }

    hasBarrels(): Boolean {
        return this.numBarrels > 0
    }

    hasSwimmers(): Boolean {
        return this.numSwimmers > 0
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

    updateBarrels(action: string): Boolean {
        if (this.isCentralAmity()) {
            return false // not adding barrels to Central Amity, please
        }
        switch (action) {
            case Actions.ADD:
                if (++this.numBarrels > 1) {
                    if (this.numBarrelsText) {
                        this.numBarrelsText.destroy()
                    }
                    this.numBarrelsText = this.scene.add.text(this.zoneCfg.barrelX, this.zoneCfg.barrelY, this.numBarrels.toString(), { fontFamily: "Elite", color: "#004258", align: "center", fontSize: 30 })
                    this.numBarrelsText.setOrigin(0.5)
                }
                return false

            case Actions.REMOVE:
                if (this.numBarrelsText) {
                    this.numBarrelsText.destroy()
                }
                if (--this.numBarrels > 1) {
                    this.numBarrelsText = this.scene.add.text(this.zoneCfg.barrelX, this.zoneCfg.barrelY, this.numBarrels.toString(), { fontFamily: "Elite", color: "#004258", align: "center", fontSize: 30 })
                    this.numBarrelsText.setOrigin(0.5)
                }
                if (this.numBarrels < 1) {
                    this.numBarrels = 0
                    return true
                }
                return false

            default:
                return false
        }
    }

    updateSwimmers(action: string) {
        if (!this.zoneCfg.isBeach) {
            return false // swimmers only at beaches
        }
        switch (action) {
            case Actions.ADD:
                if (++this.numSwimmers > 1) {
                    if (this.numSwimmersText) {
                        this.numSwimmersText.destroy()
                    }
                    this.numSwimmersText = this.scene.add.text(this.zoneCfg.swimmerX, this.zoneCfg.swimmerY, this.numSwimmers.toString(), { fontFamily: "Elite", backgroundColor: "#004258", color: "#fff", align: "center", fontSize: 20 })
                    this.numSwimmersText.setOrigin(0.5)
                }
                return false

            case Actions.REMOVE:
                if (this.numSwimmersText) {
                    this.numSwimmersText.destroy()
                }
                if (--this.numSwimmers > 1) {
                    this.numSwimmersText = this.scene.add.text(this.zoneCfg.swimmerX, this.zoneCfg.swimmerY, this.numSwimmers.toString(), { fontFamily: "Elite", backgroundColor: "#004258", color: "#fff", align: "center", fontSize: 20 })
                    this.numSwimmersText.setOrigin(0.5)
                }
                if (this.numSwimmers < 1) {
                    this.numSwimmers = 0
                    return true
                }
                return false

            default:
                return false
        }
    } 

}