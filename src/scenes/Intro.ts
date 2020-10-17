import Phaser from "phaser"
import SceneKeys from "~/consts/SceneKeys"

export default class Intro extends Phaser.Scene {
    constructor() {
        super(SceneKeys.Intro)
    }

    create() {
        const sky = new Phaser.Geom.Rectangle(0, 0, this.cameras.main.width, 400)
        const deepBlue = new Phaser.Geom.Rectangle(0, 400, this.cameras.main.width, 500)
        const bottom = new Phaser.Geom.Rectangle(0, 580, this.cameras.main.width, 100)
        
        const bgGraphics = this.add.graphics({ fillStyle: { color:  0x3fbfff } })
        bgGraphics.fillRectShape(sky)
        bgGraphics.fillStyle(0x0058f8)
        bgGraphics.fillRectShape(deepBlue)
        bgGraphics.fillStyle(0x004258)
        bgGraphics.fillRectShape(bottom)

        this.orca = this.add.sprite(this.cameras.main.width, 400, "orca").setOrigin(0, 1)
        this.shallowSea = this.add.tileSprite(0, 400, 128*9, 96, "shallow_sea").setOrigin(0)

        this.corals2 = this.add.tileSprite(0, 480, 576*2, 136, "corals2").setOrigin(0)
        this.diver = this.add.sprite(-20, 500, "diver", 0).setOrigin(0)
        this.corals = this.add.tileSprite(0, 580, 750 * 2, 60, "corals").setOrigin(0)

        console.log(this.anims.generateFrameNumbers("diver"))

        const diverAnim = this.anims.create({
            key: "swim",
            frames: this.anims.generateFrameNumbers("diver"),
            frameRate: 4,
            repeat: -1
        })
        this.diver.play("swim")

        this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
            this.scene.start(SceneKeys.Game)
        })
    }

    update() {
        this.diver.x += .1
        this.orca.x -= .1
        this.shallowSea.tilePositionX -= .3
        this.corals2.tilePositionX += .2
        this.corals.tilePositionX += .5
    }

}