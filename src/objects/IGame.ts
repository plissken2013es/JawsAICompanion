import Barrel from './Barrel';
import Hunter from './Hunter';
import Swimmer from './Swimmer';
import Zone from './Zone';

interface IGame extends Phaser.Scene {
    boardCenter: Phaser.Geom.Point
    interactiveObjects: Phaser.GameObjects.GameObject[]
    currentPhaseTitle: string
    logEnabled: boolean
    getLocale(word: string | string[]): string
    getMap(): Phaser.GameObjects.GameObject | undefined
    enableInteractiveObjects(phaseTitle: string)
    disableInteractiveObjects()
    findCharacterBy(name: string): Hunter | undefined
    findSwimmerAt(beach: Zone): Swimmer
    findBarrelAt(beachName: string): Barrel
    isJawsVisible(): boolean
    getJawsPosition(): string
    launchMessage(msg: string, isSharkTurnFinished?: boolean)
    updateBodyCount(swimmers: number, barrels: number)
    attachBarrelToJaws()
}

export default IGame