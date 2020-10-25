import Hunter from './Hunter';
import Swimmer from './Swimmer';
import Zone from './Zone';

interface IGame {
    boardCenter: Phaser.Geom.Point
    interactiveObjects: Phaser.GameObjects.GameObject[]
    getLocale(): string
    getMap(): Phaser.GameObjects.GameObject | undefined
    enableInteractiveObjects()
    disableInteractiveObjects()
    findCharacterBy(name: string): Hunter | undefined
    findSwimmerAt(beach: Zone): Swimmer
}

export default IZoneCfg