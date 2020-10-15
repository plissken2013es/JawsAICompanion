import Phaser from "phaser"
import IGame from '~/objects/IGame'

export default class ScrollablePanel {

    private COLOR_PRIMARY: number = 0x004258
    private COLOR_LIGHT: number = 0x7b5e57
    private COLOR_DARK: number = 0x00001a

    private rexUI: any
    private panel: any
    private scene: Phaser.Scene

    constructor(scene: Phaser.Scene, position: Phaser.Geom.Point, message: string) {
        this.scene = scene
        this.rexUI = this.scene.rexUI
     
        this.panel = this.rexUI.add.scrollablePanel({
            x: position.x,
            y: position.y,
            width: 700,
            height: 500,

            scrollMode: 0,

            background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 10, this.COLOR_PRIMARY),

            panel: {
                child: this.rexUI.add.fixWidthSizer({
                    space: {
                        left: 10,
                        right: 5,
                        top: 10,
                        bottom: 10,
                        item: 10,
                        line: 10,
                    }
                }),

                mask: {
                    padding: 1
                },
            },

            slider: {
                track: this.rexUI.add.roundRectangle(0, 0, 20, 10, 10, this.COLOR_DARK),
                thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 13, this.COLOR_LIGHT),
            },

            space: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10,

                panel: 10,
            }
        }).layout()

        this.updatePanel(this.panel, message)
    }

    updatePanel(panel, content): any {
        const sizer = panel.getElement('panel')
        const scene = panel.scene

        sizer.clear(true)
        let lines = content.split('\n')
        for (let li = 0, lcnt = lines.length; li < lcnt; li++) {
            let words = lines[li].split(' ');
            for (let wi = 0, wcnt = words.length; wi < wcnt; wi++) {
                sizer.add(
                    scene.add.text(0, 0, words[wi], {
                        fontSize: 18
                    })
                )
            }
            if (li < (lcnt - 1)) {
                sizer.addNewLine()
            }
        }

        panel.layout()
        return panel
    }

}