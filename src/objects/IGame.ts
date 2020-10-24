interface IGame {
    getLocale(): string
    getMap(): Phaser.GameObjects.GameObject | undefined
    enableInteractiveObjects()
    disableInteractiveObjects()
}

export default IZoneCfg