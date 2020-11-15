import Barrel from './Barrel';
import Hunter from './Hunter';
import Swimmer from './Swimmer';
import Zone from './Zone';

interface IGame extends Phaser.Scene {
    readonly boardCenter: Phaser.Geom.Point
    interactiveObjects: Phaser.GameObjects.GameObject[]
    currentPhaseTitle: string
    logEnabled: boolean
    readonly audioOn: boolean
    getLocale(word: string | string[]): string
    getMap(): Phaser.GameObjects.GameObject | undefined
    enableInteractiveObjects(phaseTitle: string)
    disableInteractiveObjects()
    findCharacterBy(name: string): Hunter | undefined
    findSwimmerAt(beach: Zone): Swimmer
    findBarrelAt(beachName: string): Barrel
    isJawsVisible(): boolean
    getJawsPosition(): string
    launchMessage(msg: string, isSharkTurnFinished?: boolean, delay?: number)
    updateBodyCount(swimmers: number, barrels: number, usedPowers: number)
    attachBarrelToJaws()
    numAttachedBarrelsToJaws(): number
    readonly numBarrelsObjetive: number
}

export default IGame