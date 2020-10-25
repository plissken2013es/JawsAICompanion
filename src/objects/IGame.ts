import Hunter from './Hunter';

interface IGame {
    boardCenter: Phaser.Geom.Point
    getLocale(): string
    getMap(): Phaser.GameObjects.GameObject | undefined
    enableInteractiveObjects()
    disableInteractiveObjects()
    findCharacterBy(name: string): Hunter | undefined
}

export default IZoneCfg