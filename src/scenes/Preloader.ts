import Phaser from "phaser"
import SceneKeys from "~/consts/SceneKeys"

export default class Preloader extends Phaser.Scene {
    constructor() {
        super(SceneKeys.Preloader)
    }

    init(data) {
        console.log("Language selected:", data.language)
        this.lang = data.language

        //  Inject our CSS
        const styleEl = document.createElement("style")
        document.head.appendChild(styleEl);
        const sheet = styleEl.sheet
        let styles = "@font-face { font-family: 'troika'; src: url('fonts/troika.otf') format('opentype'); }\n"
        sheet.insertRule(styles, 0);
        styles = "@font-face { font-family: 'Elite'; src: url('fonts/special-elite.ttf') format('truetype'); }"
        sheet.insertRule(styles, 0);
    }

    preload() {
        const progress = this.add.graphics()

        const jaws = this.add.sprite(0, 500, "jaws-loader", 0).setOrigin(0)
        const jawsAnim = this.anims.create({
            key: "jaws-swim",
            frames: this.anims.generateFrameNumbers("jaws-loader"),
            frameRate: 4,
            repeat: -1
        })
        jaws.play("jaws-swim")

        this.load.on(Phaser.Loader.Events.PROGRESS, (value) => {
            progress.clear()
            progress.fillStyle(0x0058f8, 1)
            progress.fillRect(0, 540, this.cameras.main.width * value, 40)
            jaws.x = this.cameras.main.width * value
        })

        this.load.on(Phaser.Loader.Events.COMPLETE, () => {
            progress.destroy()
            this.time.delayedCall(3000, () => {
                this.scene.start(SceneKeys.Intro)
            }, [], this)
        })

        this.load.setPath("scripts/")            
            // fonts
            .script("webfont", "webfont.js")
        
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

            // intro
            .setPath("img/intro/")
            .image("corals2", "corals2.png")
            .image("corals", "corals.png")
            .image("shallow_sea", "shallow_sea.png")
            .image("orca", "orca.png")
            .spritesheet("diver", "diver_sprite.png", { frameWidth: 72, frameHeight: 60 })

            // audio
            .setPath("audio/")
            .audio("jaws_theme", [
                "jaws_theme.ogg",
                "jaws_theme.mp3"
            ]);
    }

    create() {
        WebFont.load({
            custom: {
                families: [ "Elite", "troika" ]
            },
            active: () => {
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
                    "Es necesario ser DUEÑO de una copia del juego de tablero físico para que",
                    "la herramienta sea útil.",
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
        })
    }
}