import Hunter from './Hunter';

interface IGame {
    getLocale(): string
    getMap(): Phaser.GameObjects.GameObject | undefined
    enableInteractiveObjects()
    disableInteractiveObjects()
    findCharacterBy(name: string): Hunter | undefined
}

export default IZoneCfg