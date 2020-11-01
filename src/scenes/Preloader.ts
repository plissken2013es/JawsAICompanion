import Phaser from "phaser"
import SceneKeys from "~/consts/SceneKeys"
import Buttons from "~/consts/Buttons"

export default class Preloader extends Phaser.Scene {
    
    private lang: string = "EN"
    
    constructor() {
        super(SceneKeys.Preloader)
    }

    init(data) {
        this.lang = data.language
        this.launchLegalText()
    }

    preload() {
        const progress = this.add.graphics()

        const jaws = this.add.sprite(0, 500, "jaws-loader", 0).setOrigin(0)
        const jawsAnim = this.anims.create({
            key: "jaws-swim",
            frames: this.anims.generateFrameNumbers("jaws-loader", {}),
            frameRate: 4,
            repeat: -1
        })
        jaws.play("jaws-swim")

        let position = { x: 0 }
        let tweenJaws

        this.load.on(Phaser.Loader.Events.PROGRESS, (value) => {
            progress.fillStyle(0x0058f8, 1)

            if (tweenJaws) { tweenJaws.stop() }
            tweenJaws = this.tweens.add({
                targets: position,
                x: this.cameras.main.width * value,
                duration: 666,
                ease: Phaser.Math.Easing.Expo,
                onUpdate: () => {
                    progress.fillRect(0, 540, position.x + 80, 40)
                    jaws.x = position.x
                }
            })           
        }, this)

        this.load.on(Phaser.Loader.Events.COMPLETE, () => {
            progress.destroy()
            this.time.delayedCall(1500, () => {
                this.scene.start(SceneKeys.StudiosLogo, { language: this.lang })
            }, [], this)
        }, this)
       
            .setPath("img/")
            // map zones
            .image("amityBg", "map_complete.png")
            .image("map_1", "map_1.png")
            .image("map_2", "map_2.png")
            .image("map_3", "map_3.png")
            .image("map_4", "map_4.png")
            .image("map_5", "map_5.png")
            .image("map_6", "map_6.png")
            .image("map_7", "map_7.png")
            .image("map_8", "map_8.png")
            .image("map_N", "map_N.png")
            .image("map_S", "map_S.png")
            .image("map_E", "map_E.png")
            .image("map_W", "map_W.png")
            .image("map_A", "map_A.png")
    
            // hunters
            .image("brody", "Brody.png")
            .image("hooper", "Hooper.png")
            .image("quint", "Quint.png")

            // hunter buttons
            .image(Buttons.ADD_BARREL, Buttons.ADD_BARREL + ".png")
            .spritesheet(Buttons.ADD_SWIMMER, Buttons.ADD_SWIMMER + ".png", { frameWidth: 32, frameHeight: 46 })
            .image(Buttons.MICHAEL, Buttons.MICHAEL + ".png")
            .image(Buttons.FISH_FINDER, Buttons.FISH_FINDER + ".png")
            .image(Buttons.BINOCULARS, Buttons.BINOCULARS + ".png")

            // characters eyes
            .image("brody_eyes", "brody_eyes.png")
            .image("quint_eyes", "quint_eyes.png")
            .image("hooper_eyes", "hooper_eyes.png")

            // bg && UI
            .image("blood_bg", "blood_bg.png")
            .image("jaws_pixel", "jaws_pixel.png")

            // other tokens
            .image("barrel", "barrel.png")
            .image("bodycount", "bodycount.png")
            .image("shark_bodycount", "shark_bodycount.png")
            .spritesheet("shark_attack", "shark_attack_spritesheet.png", { frameWidth: 63, frameHeight: 50 })
            .image("jawsToken", "jaws.png")
            .spritesheet("attack_spritesheet", "attack_spritesheet.png", { frameWidth: 69*4, frameHeight: 33*4 })

            // intro
            .setPath("img/intro/")
            .image("corals2", "corals2.png")
            .image("corals", "corals.png")
            .image("shallow_sea", "shallow_sea.png")
            .image("orca", "orca.png")
            .image("jawsInWater", "jaws_in_water.png")
            .image("jawsTitle", "jaws_title_alt.png")
            .image("waterMovement", "water_movement1.png")
            .image("waterMovement2", "water_movement2.png")
            .spritesheet("diver", "diver_sprite.png", { frameWidth: 72, frameHeight: 60 })
            .spritesheet("jawsShadow", "jaws_shadow_sprite.png", { frameWidth: 140, frameHeight: 142 })
            .spritesheet("studiosLogo", "carpenterSoft_logo_200.png", { frameWidth: 200, frameHeight: 200 })

            // audio
            .setPath("audio/")
            .audio("jaws_theme", [
                "jaws_theme.ogg",
                "jaws_theme.mp3"
            ])
            .audio("jaws_appear", [
                "jaws_appear.ogg",
                "jaws_appear.mp3"
            ])
            // audio - misc effects
            .audio("splash", [
                "splash.ogg",
                "splash.mp3"
            ])
            .audio("siren", [
                "siren.ogg",
                "siren.mp3"
            ])
            .audio("bigger_boat", [
                "bigger_boat.ogg",
                "bigger_boat.mp3"
            ])
            .audio("phase_title", [
                "phase_title.ogg",
                "phase_title.mp3"
            ])
            .audio("chomp", [
                "chomp.ogg",
                "chomp.mp3"
            ])
            // audio - swipes
            .audio("swipe1", [
                "swipe1.ogg",
                "swipe1.mp3"
            ])
            .audio("swipe2", [
                "swipe2.ogg",
                "swipe2.mp3"
            ])
            .audio("swipe3", [
                "swipe3.ogg",
                "swipe3.mp3"
            ])
            .audio("swipe4", [
                "swipe4.ogg",
                "swipe4.mp3"
            ])
            // audio - drops
            .audio("drop1", [
                "drop1.ogg",
                "drop1.mp3"
            ])
            .audio("drop2", [
                "drop2.ogg",
                "drop2.mp3"
            ])
            .audio("drop3", [
                "drop3.ogg",
                "drop3.mp3"
            ])
            .audio("drop4", [
                "drop4.ogg",
                "drop4.mp3"
            ])
            .audio("drop5", [
                "drop5.ogg",
                "drop5.mp3"
            ])
    }

    create() {
        this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
            this.scene.start(SceneKeys.StudiosLogo, { language: this.lang })
        })
    }

    launchLegalText() {
        const legalTextEN = [
            "The following APP is a NON PROFIT tool for entertaiment and educational purposes only.",
            "",
            "You need to OWN the board game physically to find this tool useful.",
            "",
            "All CHARACTERS, all related MARKS, LOGOS and associated NAMES and REFERENCES are",
            "copyright and trademark of their respective holders.",
            "",
            "This FAN PRODUCTION is not open to commercial ADS, and not intended for sales of any sort.",
            "",
            "No commercial exhibition or distribution is permitted (neither this APP",
            "or its SOURCE CODE).",
            "",
            "The content of this APP (or its SOURCE CODE) could not be sold, rented or",
            "used for any commercial enterprise in any way.",
            "",
            "This APP is free and ADS free. And it will stay that way forever.",
            "",
            "",
            "Enjoy."
        ]
    
        const legalTextES = [
            "Esta APP es una herramienta SIN ÁNIMO DE LUCRO y su propósito es la educación y el",
            "entretenimiento.",
            "",
            "Es necesario ser DUEÑO de una copia física del juego de tablero para que",
            "esta herramienta resulte útil.",
            "",
            "Todos los PERSONAJES, MARCAS, LOGOTIPOS, NOMBRES y REFERENCIAS asociadas son copyright",
            "y marca registrada de sus respectivos titulares.",
            "",
            "Este trabajo hecho por un FAN no incluye ANUNCIOS, ni ventas de ningún tipo.",
            "",
            "No se permite su distribución o exhibición comercial (ni de la APP ni de",
            "su CÓDIGO FUENTE).",
            "",
            "El contendido de esta APP (o su CÓDIGO FUENTE) no puede ser vendido, alquilado o usado en",
            "empresa comercial de ningún tipo.",
            "",
            "Esta APP es GRATUITA y no contiene ANUNCIOS. Siempre será así.",
            "",
            "",
            "Que lo disfruten."
        ]            

        this.add.text(50, 50, this.lang == "ES" ? legalTextES : legalTextEN , { fontFamily: "Elite", color: "#5656ee", align: "left", fontSize: 20 })

    }
}