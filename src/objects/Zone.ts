import Phaser from "phaser"
import Actions from '~/consts/Actions'
import MapConfig from "~/consts/MapConfig"
import ZoneNames from "~/consts/ZoneNames"
import IZoneCfg from './IZoneCfg'
import IGame from '~/objects/IGame'

export default class Zone extends Phaser.GameObjects.Sprite {

    readonly zoneName: string
    readonly zoneCfg: IZoneCfg
    private numBarrels: number = 0
    private _numSwimmers: number = 0
    public get numSwimmers(): number {
        return this._numSwimmers
    }
    private numBarrelsText?: Phaser.GameObjects.Text
    private numSwimmersText?: Phaser.GameObjects.Text
    private _isMichaelHere: boolean = false
    public get isMichaelHere(): boolean {
        return this._isMichaelHere
    }

    constructor(scene: IGame, cfg: IZoneCfg) {
        super(scene, cfg.x, cfg.y, "map_" + cfg.name)

        this.zoneName = cfg.name
        this.setOrigin(0).setInteractive({ pixelPerfect: true }).input.dropZone = true
        this.zoneCfg = cfg

        if (cfg.text && cfg.textX && cfg.textY) {
            scene.add.text(cfg.textX, cfg.textY, scene.getLocale(cfg.text), { fontFamily: "Elite", color: "#fff", align: "center", fontSize: 30 }).setOrigin(0.5)
        }
    }

    showAttack() {
        if (!this.zoneCfg.isBeach) return

        const attackAnim = this.scene.anims.create({
            key: "sharkAttackAnim",
            frames: this.scene.anims.generateFrameNumbers("shark_attack", {}),
            frameRate: 4,
            yoyo: true,
            repeat: 3
        })
        const sharkAttack = this.scene.add.sprite(this.zoneCfg.swimmerX, this.zoneCfg.swimmerY, "shark_attack")
        const chompSnd = this.scene.sound.add("chomp")
        chompSnd.play({ volume: 0.5, loop: true })
        sharkAttack.once(Phaser.Animations.Events.SPRITE_ANIMATION_COMPLETE, () => {
            sharkAttack.destroy()
            chompSnd.destroy()
        })
        sharkAttack.play("sharkAttackAnim")
    }

    showShark() {
        const jawsToken = this.scene.add.image(this.zoneCfg.sharkX, this.zoneCfg.sharkY, "jawsToken").setOrigin(0.5, 1)
        const jawsAppear = this.scene.sound.add("jaws_appear")
        jawsAppear.play({ volume: 0.5 })
        this.scene.tweens.add({
            targets: jawsToken,
            alpha: 0,
            duration: 666,
            ease: Phaser.Math.Easing.Expo,
            yoyo: true,
            repeat: 6,
            onComplete: () => {
                jawsAppear.destroy()
                jawsToken.destroy()
            },
            onCompleteScope: this
        })
    }

    hasBarrels(): boolean {
        return this.numBarrels > 0
    }

    hasSomethingToEat(): boolean {
        return this._isMichaelHere || this._numSwimmers > 0
    }

    hasSwimmers(): boolean {
        return this._numSwimmers > 0
    }

    totalSwimmers(): number {
        if (!this.zoneCfg.isBeach) return 0
        return this._numSwimmers + (this._isMichaelHere ? 2 : 0)
    }

    isOpenSea() {
        if (this.zoneName === ZoneNames.ONE || this.zoneName === ZoneNames.TWO || this.zoneName === ZoneNames.THREE || this.zoneName === ZoneNames.FOUR) {
            return true
        }
        return false
    }

    isCentralAmity() {
        return this.zoneName === ZoneNames.A
    }

    updateBarrels(action: string): boolean {
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

    updateMichael(action: string): boolean {
        if (this.zoneCfg.isBeach) {
            switch (action) {
                case Actions.ADD:
                    this._isMichaelHere = true
                    return true
    
                case Actions.REMOVE:
                    this._isMichaelHere = false
                    return true
            }
        }
        return false
    }

    updateSwimmers(action: string): boolean {
        if (!this.zoneCfg.isBeach) {
            return false // swimmers only at beaches
        }
        switch (action) {
            case Actions.ADD:
                if (++this._numSwimmers > 1) {
                    if (this.numSwimmersText) {
                        this.numSwimmersText.destroy()
                    }
                    this.numSwimmersText = this.scene.add.text(this.zoneCfg.swimmerX, this.zoneCfg.swimmerY, this._numSwimmers.toString(), { fontFamily: "Elite", backgroundColor: "#004258", color: "#fff", align: "center", fontSize: 20 })
                    this.numSwimmersText.setOrigin(0.5)
                }
                return false

            case Actions.REMOVE:
                if (this.numSwimmersText) {
                    this.numSwimmersText.destroy()
                }
                if (--this._numSwimmers > 1) {
                    this.numSwimmersText = this.scene.add.text(this.zoneCfg.swimmerX, this.zoneCfg.swimmerY, this._numSwimmers.toString(), { fontFamily: "Elite", backgroundColor: "#004258", color: "#fff", align: "center", fontSize: 20 })
                    this.numSwimmersText.setOrigin(0.5)
                }
                if (this._numSwimmers < 1) {
                    this._numSwimmers = 0
                    return true
                }
                return false

            default:
                return false
        }
    } 

}