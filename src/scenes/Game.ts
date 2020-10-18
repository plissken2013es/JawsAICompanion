import Phaser from "phaser"
import SceneKeys from "~/consts/SceneKeys"
import Board from '~/objects/Board'

export default class Game extends Phaser.Scene
{
	constructor() {
		super(SceneKeys.Game)
    }
    
    init(data) {
        console.log("Language selected:", data.language)
        this.lang = data.language
        this.music = data.music
        this.tweens.add({
            targets: this.music,
            volume: 0,
            duration: 2000,
            onComplete: () => {
                this.music.stop()
            }
        })
    }

	preload() {}

    create() {
        //let jawsTheme = this.sound.add("jaws_theme", { loop: false }).play()

        this.add.existing(new Board(this))
        
        let brody = this.add.sprite(150, 150, "brody").setInteractive()
        let hooper = this.add.sprite(250, 250, "hooper").setInteractive()
        let quint = this.add.sprite(350, 350, "quint").setInteractive()
    
        let draggableSprites = [brody, hooper, quint]
        draggableSprites.forEach((spr) => {
            this.input.setDraggable(spr)
    
            this.input.on('dragstart', function (pointer, gameObject) {    
                gameObject.setTint(0xff0000);   
            })
        
            this.input.on('drag', function (pointer, gameObject, dragX, dragY) {    
                gameObject.x = dragX | 0
                gameObject.y = dragY | 0
            })
        
            this.input.on('dragend', function (pointer, gameObject) {
                console.log(gameObject.texture.key, gameObject.x, gameObject.y)
                gameObject.clearTint()    
            })
        })
    }
}
