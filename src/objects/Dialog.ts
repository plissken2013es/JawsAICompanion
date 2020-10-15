import Phaser from "phaser"
import DialogType from '~/consts/DialogType'
import IGame from '~/objects/IGame'

export default class Dialog {

    private rexUI: any
    private dialog: any
    private scene: IGame

    constructor(scene: IGame, type: string, message: string, callback: Function) {
        this.scene = scene
        this.rexUI = this.scene.rexUI

        this.dialog = this.rexUI.add.dialog({
            width: 200,
            height: 150,
            anchor: {
                centerX: "center",
                centerY: "center"
            },

            background: this.rexUI.add.roundRectangle(0, 0, 200, 150, 5, 0x1565c0),

            content: this.scene.add.text(0, 0, message, {
                fontFamily: "Elite",
                align: "center",
                fontSize: 20
            }),

            actions: type === DialogType.YES_NO ? [
                this.createLabel(this.scene, this.scene.getLocale("Yes")),
                this.createLabel(this.scene, this.scene.getLocale("No"))
            ] : [
                this.createLabel(this.scene, this.scene.getLocale("Ok"))
            ],

            space: {
                title: 25,
                content: 25,
                action: 15,

                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
            },

            align: {
                actions: "center",
            },

            expand: {
                content: false,
            }
        })
            .layout()
            //.drawBounds(this.add.graphics(), 0xff0000)
            .popUp(666);

       this.dialog
            .on("button.click", (button, groupName, index) => {
                callback(button, index)
                this.dialog.scaleDownDestroy(666)
            }, this)
            .on("button.over", (button, groupName, index) => {
                button.getElement("background").setStrokeStyle(1, 0xffffff);
            })
            .on("button.out", (button, groupName, index) => {
                button.getElement("background").setStrokeStyle();
            })

        scene.add.existing(this.dialog)
    }

    createLabel(scene: Phaser.Scene, text: string) {
        return this.rexUI.add.label({
            width: 40,
            height: 40,
    
            background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 5, 0x5e92f3),
    
            text: this.scene.add.text(0, 0, text, {
                fontFamily: "Elite",
                color: "#004258",
                align: "center",
                fontSize: 18
            }),
    
            space: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            }
        })
    }

}