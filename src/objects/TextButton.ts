import Phaser from "phaser"

import IGame from '~/objects/IGame'

export default class TextButton extends Phaser.GameObjects.Text {

    readonly buttonName: string
    public isTextButton: boolean = true

    constructor(scene: IGame, x: number, y: number, text: string, style: any, key: string, callback: Function) {

        super(scene, x, y, text, style)

        this.buttonName = key

        this.setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.enterButtonHoverState() )
            .on('pointerout', () => this.enterButtonRestState() )
            .on('pointerdown', () => this.enterButtonActiveState() )
            .on('pointerup', () => {
                this.enterButtonHoverState()
                callback.apply(this.scene, [this.buttonName])
            })

    }

    enterButtonHoverState() {
        this.setStyle({ fill: '#ff0 '});
    }

    enterButtonRestState() {
        this.setStyle({ fill: '#0f0 '});
    }

    enterButtonActiveState() {
        this.setStyle({ fill: '#0ff' });
    }

}