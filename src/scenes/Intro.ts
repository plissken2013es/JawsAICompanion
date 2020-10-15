import Phaser from "phaser"
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"

export default class Intro extends Phaser.Scene {
    
    private jawsInWater?: Phaser.GameObjects.Sprite
    private orca?: Phaser.GameObjects.Sprite
    private shallowSea?: Phaser.GameObjects.TileSprite
    private corals2?: Phaser.GameObjects.TileSprite
    private jawsShadow?: Phaser.GameObjects.Sprite
    private diver?: Phaser.GameObjects.Sprite
    private corals?: Phaser.GameObjects.TileSprite
    private pause: boolean = false
    private lang: string = Languages.English

    constructor() {
        super(SceneKeys.Intro)
    }

    init(data) {
        this.lang = data.language
    }

    create() {
        const sky = new Phaser.Geom.Rectangle(0, 0, this.cameras.main.width, 400)
        const deepBlue = new Phaser.Geom.Rectangle(0, 400, this.cameras.main.width, 500)
        const bottom = new Phaser.Geom.Rectangle(0, 580, this.cameras.main.width, 100)
        
        const skyGraphics = this.add.graphics({ fillStyle: { color:  0x3fbfff } })
        skyGraphics.fillRectShape(sky)

        this.jawsInWater = this.add.sprite(330, 150 + 272, "jawsInWater").setOrigin(0).setAlpha(0)

        const bgGraphics = this.add.graphics({ fillStyle: { color:  0x0058f8 } })
        bgGraphics.fillRectShape(deepBlue)
        bgGraphics.fillStyle(0x004258)
        bgGraphics.fillRectShape(bottom)

        this.orca = this.add.sprite(this.cameras.main.width, 400, "orca").setOrigin(0, 1)
        this.shallowSea = this.add.tileSprite(0, 400, 128*9, 96, "shallow_sea").setOrigin(0)

        this.corals2 = this.add.tileSprite(0, 480, 576*2, 136, "corals2").setOrigin(0)
        this.jawsShadow = this.add.sprite(350, 400, "jawsShadow").setOrigin(0).setAlpha(0)
        this.diver = this.add.sprite(-20, 500, "diver", 0).setOrigin(0)
        this.corals = this.add.tileSprite(0, 580, 750 * 2, 60, "corals").setOrigin(0)

        const diverAnim = this.anims.create({
            key: "swim",
            frames: this.anims.generateFrameNumbers("diver", {}),
            frameRate: 4,
            repeat: -1
        })
        this.diver.play("swim")

        const jawsShadowAnim = this.anims.create({
            key: "jawsShadow",
            frames: this.anims.generateFrameNumbers("jawsShadow", {}),
            frameRate: 1
        }) as Phaser.Animations.Animation
        jawsShadowAnim.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.jawsShadow!.destroy()
            this.diver!.anims.stop()
            this.pause = true
            this.add.image(200, 380, "waterMovement2").setOrigin(0)
            this.time.delayedCall(500, () => {
                this.add.image(200, 350, "waterMovement").setOrigin(0)
                const splash = this.sound.add("splash").play({ volume: 0.5 })
                this.time.delayedCall(500, () => {
                    this.add.image(200, 350, "waterMovement").setOrigin(0)
                    this.jawsInWater!.alpha = 1
                    this.tweens.add({
                        targets: this.jawsInWater,
                        y: 150,
                        duration: 666,
                        ease: Phaser.Math.Easing.Expo,
                        onComplete: this.showJawsTitle,
                        onCompleteScope: this
                    })
                }, [], this)
            }, [], this)
        }, this)
        this.time.delayedCall(4500, () => {
            this.jawsShadow!.alpha = 0.2
            this.jawsShadow!.play("jawsShadow")
        }, [], this)
        
        const bso: Phaser.Sound.BaseSound = this.sound.add("jaws_theme")
        bso.play()

        this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
            this.scene.start(SceneKeys.InitialOptions, { music: bso, language: this.lang })
        })
    }

    update() {
        if (this.pause) return
        this.diver!.x += .1
        this.orca!.x -= .4
        this.shallowSea!.tilePositionX -= .3
        this.corals2!.tilePositionX += .2
        this.corals!.tilePositionX += .5
    }

    showJawsTitle() {
        const jawsTitle = this.add.image(187, 170, "jawsTitle").setOrigin(0)
        const text = this.add.text(680, 100, "COMPANION" , { fontFamily: "Elite", color: "#004258", align: "center", fontSize: 50 })
        this.sound.add("bigger_boat").play({ volume: 0.3 })
        this.tweens.add({
            targets: text,
            rotation: .5,
            duration: 1000,
            ease: Phaser.Math.Easing.Expo
        })
    }

}