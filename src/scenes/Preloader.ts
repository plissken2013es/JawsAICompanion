import Phaser from "phaser"
import SceneKeys from "~/consts/SceneKeys"

export default class Preloader extends Phaser.Scene {
    constructor() {
        super(SceneKeys.Preloader)
    }

    preload() {
        this.load.setPath("img/")
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

            .image("flag_en", "flag_en.png")
            .image("flag_es", "flag_es.png")
    
            .image("brody", "Brody.png")
            .image("hooper", "Hooper.png")
            .image("quint", "Quint.png")

            .setPath("audio/")
            .audio("jaws_theme", [
                "jaws_theme.ogg",
                "jaws_theme.mp3"
            ]);
    }

    create() {
        this.scene.start(SceneKeys.LanguageSelection)
    }
}