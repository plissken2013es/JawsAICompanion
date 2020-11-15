import Phaser from "phaser"

import Buttons from '~/consts/Buttons'
import Characters from '~/consts/Characters'
import DialogType from '~/consts/DialogType'
import TitleType from '~/consts/TitleType'
import Languages from '~/consts/Languages'
import SceneKeys from "~/consts/SceneKeys"
import Board from '~/objects/Board'
import Dialog from '~/objects/Dialog'
import Hunter from '~/objects/Hunter'
import HunterButton from "~/objects/HunterButton"
import Michael from '~/objects/Michael'
import IGame from '~/objects/IGame'
import LocaleManager from '~/utils/LocaleManager'
import JawsAI from '~/utils/JawsAI'
import PhaseTitle from './PhaseTitle'
import LogScreen from './LogScreen'
import TextButton from '~/objects/TextButton'
import SharkButtons from '~/consts/SharkButtons'
import Swimmer from '~/objects/Swimmer'
import Zone from '~/objects/Zone'
import FlavorTextsManager from '~/utils/FlavorTextsManager'
import Barrel from '~/objects/Barrel'
import { GameDataToSave } from "~/consts/GameDataToSave"
import LocalStorage from '~/utils/LocalStorage'
import Actions from '~/consts/Actions'
import LogManager from '~/utils/LogManager'

export default class Game extends Phaser.Scene implements IGame {

    readonly logEnabled:boolean = false // deactivate for DIST version

    private lang: string = Languages.English
    private music?: Phaser.Sound.BaseSound
    private _audioOn: Boolean = true
    public get audioOn(): Boolean {
        return this._audioOn
    }
    private board?: Board
    private locales?: LocaleManager
    private dialog?: any
    private lastDisplayedMessage?: string
    private logButton?: Phaser.GameObjects.Image
    interactiveObjects: Phaser.GameObjects.GameObject[] = []
    private _currentPhaseTitle: string
    public get currentPhaseTitle(): string {
        return this._currentPhaseTitle
    }
    private hunters: Hunter[] = []
    private jawsAI?: JawsAI
    private logManager?: LogManager
    private localStorage: LocalStorage = LocalStorage.getInstance()
    private flavorTexts?: FlavorTextsManager
    private characterEyes?: Phaser.GameObjects.Image
    private characterText?: Phaser.GameObjects.Text
    private phaseTitle?: Phaser.GameObjects.Text
    readonly boardCenter = new Phaser.Geom.Point(0, 0)
    private _michael?: Michael
    public get michael(): Michael | undefined {
        return this._michael
    }
    private swimmersEatenText?: Phaser.GameObjects.Text
    private barrelsAttachedToJawsText?: Phaser.GameObjects.Text
    private usedPowersText?: Phaser.GameObjects.Text
    readonly numBarrelsObjetive: number = 2

	constructor() {
		super(SceneKeys.Game)
    }
    
    init(data) {
        this.lang = data.language
        this.music = data.music
        if (data.numBarrelsObjetive) {
            this.numBarrelsObjetive = data.numBarrelsObjetive
        }
        if (this.music) {
            this.tweens.add({
                targets: this.music,
                volume: 0,
                duration: 2000,
                onComplete: () => {
                    this.music!.stop()
                },
                onCompleteScope: this
            })
        }

        this.interactiveObjects = []
        this.hunters = []
        this.locales = new LocaleManager(this.lang)
        this.board = new Board(this)
        this.flavorTexts = new FlavorTextsManager(this.lang)
        this.add.existing(this.board)
        this.localStorage = LocalStorage.getInstance()

        this.logManager = LogManager.getInstance(this.logEnabled)

        const savedJaws = this.localStorage.loadGameData() && this.localStorage.loadGameData()[GameDataToSave.JAWS]
        this.jawsAI = JawsAI.getInstance(this, savedJaws)
    }

	preload() { 
        this.load.scenePlugin({
            key: "rexuiplugin",
            url: "scripts/rexuiplugin.min.js",
            sceneKey: "rexUI"
        })
    }

    create() {
        this.addCharacters()
        this.addButtons()
        this.addAudioButton()
        this.bindButtonEvents()
        this.addBodyCounters()
        this.disableInteractiveObjects()

        this.addBarrelsIfNeeded()
        this.addSwimmersIfNeeded()
        this.moveMichaelIfNeeded()
        this.loadLogsIfNeeded()

        this.addProperPhaseButtons()

        this.jawsAI.updateBodyCount()

        this.launchProperPhaseTitle()
    }

    addProperPhaseButtons() {
        const savedPhaseTitle = this.localStorage.loadGameData() && this.localStorage.loadGameData()[GameDataToSave.CURRENT_PHASE_TITLE]
        switch (savedPhaseTitle) {
            case TitleType.CREW_PHASE:
                this.addEndTurnButton()
                this.addFlavorText()
                break

            default:
                this.addSharkButtons()
                break
        }        
    }

    launchProperPhaseTitle() {
        const savedPhaseTitle = this.localStorage.loadGameData() && this.localStorage.loadGameData()[GameDataToSave.CURRENT_PHASE_TITLE]
        if (savedPhaseTitle) {
            this.launchPhaseTitle(savedPhaseTitle)
        } else {
            this.launchPhaseTitle(TitleType.EVENT_SHARK_PHASE)
        }
    }

    addBarrelsIfNeeded() {
        const savedBarrelPositions = this.localStorage.loadGameData() && this.localStorage.loadGameData()[GameDataToSave.BARREL_POSITIONS]
        if (savedBarrelPositions) {
            for (let index in savedBarrelPositions) {
                const zone = this.board?.getZoneByName(savedBarrelPositions[index])
                const barrel = new Barrel(this, zone?.zoneCfg.barrelX, zone?.zoneCfg.barrelY, Buttons.BARREL, zone)
                this.add.existing(barrel)
                this.interactiveObjects.push(barrel)
            }
        }
    }

    addSwimmersIfNeeded() {
        const savedSwimmerPositions = this.localStorage.loadGameData() && this.localStorage.loadGameData()[GameDataToSave.SWIMMER_POSITIONS]
        if (savedSwimmerPositions) {
            for (let index in savedSwimmerPositions) {
                const swimmerData = savedSwimmerPositions[index]
                const zone = this.board?.getZoneByName(swimmerData["zoneName"])
                const numSwimmers = swimmerData["numSwimmers"]
                const swimmer = new Swimmer(this, zone.zoneCfg.swimmerX, zone.zoneCfg.swimmerY, "swimmer_sprite", zone)
                swimmer.play("swimmerDroppedAnim")
                this.add.existing(swimmer)
                this.interactiveObjects.push(swimmer)
                for (let q=1; q<numSwimmers; q++) {
                    zone?.updateSwimmers(Actions.ADD)
                }
            }
        }
    }

    moveMichaelIfNeeded() {
        const savedMichaelPosition = this.localStorage.loadGameData() && this.localStorage.loadGameData()[GameDataToSave.MICHAEL_POSITION]
        if (savedMichaelPosition) {
            const zone = this.board?.getZoneByName(savedMichaelPosition)
            this.michael?.moveTo(zone)
        }        
    }

    loadLogsIfNeeded() {
        const savedLogs = this.localStorage.loadGameData() && this.localStorage.loadGameData()[GameDataToSave.SAVED_LOGS]
        if (this.logManager && savedLogs) {
            this.logManager.reset(savedLogs)
        }
    }

    addAudioButton() {
        const audioButton = this.add.sprite(this.cameras.main.width - 30, 15, "audio_button", 1)
        audioButton.setInteractive().on(Phaser.Input.Events.POINTER_DOWN, (pointer) => {
            this._audioOn = !this._audioOn
            audioButton.setFrame(this.audioOn ? 1 : 0)
        })
    }

    addLogButton() {
        this.logButton = this.add.image(this.cameras.main.width - 100, 15, "log_button")
        this.logButton.setInteractive().on(Phaser.Input.Events.POINTER_DOWN, (pointer) => {
            this.launchMessage(this.lastDisplayedMessage || "", false, 50)
        })
        this.interactiveObjects.push(this.logButton)
    }

    addBodyCounters() {
        const x = this.boardCenter.x * 2  + 30
        const y = this.boardCenter.y*2 - 60
        const textCfg = {
            fontFamily: "Elite", 
            color: "#fff", 
            align: "center", 
            fontSize: 30 
        }
        this.add.image(x, y, "bodycount")
        this.swimmersEatenText = this.add.text(x, y + 50, "0", textCfg)
        this.swimmersEatenText.setOrigin(0.5)
        this.barrelsAttachedToJawsText = this.add.text(x + 90, y + 50, "0", textCfg)
        this.barrelsAttachedToJawsText.setOrigin(0.5)
        this.add.image(x + 90, y, "shark_bodycount")

        this.add.image(x + 44, y, "jaws_power")
        this.usedPowersText = this.add.text(x + 44, y + 50, "0", textCfg)
        this.usedPowersText.setOrigin(0.5)
    }

    addCharacters() {
        [Characters.BRODY, Characters.HOOPER, Characters.QUINT].forEach((charName) => {
            const savedHunterPositions = this.localStorage.loadGameData() && this.localStorage.loadGameData()[GameDataToSave.HUNTER_POSITIONS]
            const hunterSavedPosition = savedHunterPositions && savedHunterPositions[charName]
            const hunter = new Hunter(this, 0, 0, charName, hunterSavedPosition)
            this.interactiveObjects.push(hunter)
            this.hunters.push(hunter)
            this.add.existing(hunter)
        })
    }

    addButtons() {
        const swimmerSelectAnim = this.anims.create({
            key: "swimmerSelectAnim",
            frames: this.anims.generateFrameNumbers("swimmer_sprite", { start: 0, end: 2 }),
            frameRate: 16,
            repeat: -1
        })
        const swimmerDroppedAnim = this.anims.create({
            key: "swimmerDroppedAnim",
            frames: this.anims.generateFrameNumbers("swimmer_sprite", { start: 3, end: 5 }),
            frameRate: 4,
            yoyo: true,
            repeat: -1
        })

        this._michael = new Michael(this, 920, 80, Buttons.MICHAEL)
        this.add.existing(this._michael)
        this.interactiveObjects.push(this._michael);
        [
            { 
                btnName: Buttons.ADD_SWIMMER, 
                spriteSelectAnim: "swimmerSelectAnim",
                spriteDroppedAnim: "swimmerDroppedAnim"
            },
            { btnName: Buttons.ADD_BARREL }, 
            { btnName: Buttons.FISH_FINDER, onlyClickable: true },
            { btnName: Buttons.BINOCULARS, onlyClickable: true }
        ].forEach((btnCfg, index) => {
            const hunterButton = new HunterButton(this, 920, 160 + (index * 70), btnCfg)
            this.add.existing(hunterButton)
            this.interactiveObjects.push(hunterButton)
        })
    }

    addEndTurnButton() {
        const y = ((this.cameras.main.height - (this.boardCenter.y * 2)) / 2) + (this.boardCenter.y * 2)
        const buttonsCfg = { 
            fill: "#fff",
            backgroundColor: "#004258",
            padding: { x: 6, y: 6 },
            fontSize: 20
        }
        const btn = new TextButton(this, this.cameras.main.width - 20, y, " " + this.getLocale("End Turn") + " ", buttonsCfg, "endTurn", this.onEndTurnButtonPressed)
                .setOrigin(1, 0.5)
        this.add.existing(btn)
        this.interactiveObjects.push(btn)
    }

    addFlavorText() {
        if (new Phaser.Math.RandomDataGenerator().integerInRange(0, 1) == 0) return

        const y = ((this.cameras.main.height - (this.boardCenter.y * 2)) / 2) + (this.boardCenter.y * 2)
        const flavor = this.flavorTexts!.getText()
        let eyes = "brody_eyes"
        switch (flavor.char) {
            case Characters.BRODY:
                eyes = "brody_eyes"
                break
            case Characters.HOOPER:
                eyes = "hooper_eyes"
                break
            case Characters.QUINT:
                eyes = "quint_eyes"
                break
        }

        this.characterEyes = this.add.image(20, y, eyes)
        this.characterEyes.setOrigin(0, 0.5)
        this.characterText = this.add.text(160, y, "'" + flavor.text + "'", {
            fontFamily: "Elite", 
            color: "#e9c29f", 
            align: "left", 
            fontSize: 20 })
        this.characterText.setOrigin(0, 0.5)
    }

    addSharkButtons() {
        const y = ((this.cameras.main.height - (this.boardCenter.y * 2)) / 2) + (this.boardCenter.y * 2)

        const sharkButtons = [
            { text: this.getLocale("Jaws 3 actions").toUpperCase(), key: SharkButtons.JAWS_3 },
            { text: this.getLocale("Jaws 4 actions (wrong shark)").toUpperCase(), key: SharkButtons.JAWS_4 },
            { text: this.getLocale("Jaws (Gardner's boat)").toUpperCase(), key: SharkButtons.JAWS_G },
        ]
        const buttonsCfg = { 
            fill: "#fff",
            backgroundColor: "#004258",
            padding: { x: 6, y: 6 },
            fontSize: 20
        }

        let widthsSum = 0
        sharkButtons.forEach((btnCfg) => {
            const btn = new TextButton(this, 10 + widthsSum, y, " " + btnCfg.text + " ", buttonsCfg, btnCfg.key, this.onSharkActionButtonPressed)
                .setOrigin(0, 0.5)
            this.add.existing(btn)
            this.interactiveObjects.push(btn)
            widthsSum += btn.getBounds().width + 10
        })
    }

    removeFlavorText() {
        this.characterText?.destroy()
        this.characterEyes?.destroy()
    }

    removeTextButtons() {
        this.interactiveObjects = this.interactiveObjects.filter((item) => {
            if (item.isTextButton) {
                item.destroy()
                return false
            } else {
                return true
            }
        })
    }

    bindButtonEvents() {
        const dragSounds = [
            this.sound.add("swipe1"),
            this.sound.add("swipe2"),
            this.sound.add("swipe3"),
            this.sound.add("swipe4")
        ]

        const dropSounds = [
            this.sound.add("drop1"),
            this.sound.add("drop2"),
            this.sound.add("drop3"),
            this.sound.add("drop4"),
            this.sound.add("drop5")
        ]

        this.input.on(Phaser.Input.Events.DRAG_START, (pointer, gameObject) => {
            gameObject.positionOnDragStart =  new Phaser.Geom.Point(gameObject.x, gameObject.y)
            gameObject.setTint(0xff0000)
            if (gameObject.spriteSelectAnim) {
                gameObject.play(gameObject.spriteSelectAnim)
            }
            const snd = Phaser.Utils.Array.GetRandom(dragSounds)
            if (this.audioOn) snd.play()
        })
    
        this.input.on(Phaser.Input.Events.DRAG, (pointer, gameObject, dragX, dragY) => {    
            gameObject.x = dragX | 0
            gameObject.y = dragY | 0
        })

        this.input.on(Phaser.Input.Events.DRAG_END, (pointer, gameObject, dropped) => {
            const snd = Phaser.Utils.Array.GetRandom(dropSounds)
            if (this.audioOn) snd.play()
            if (gameObject.shouldRemove) { // barrels and swimmers can be removed
                gameObject.shouldRemove()
            }
            if (!dropped && gameObject.positionOnDragStart) { // barrels and swimmers
                gameObject.x = gameObject.positionOnDragStart.x
                gameObject.y = gameObject.positionOnDragStart.y
            }
            if (!dropped && gameObject.returnHome) { // Michael
                gameObject.returnHome()
            }
            if (gameObject.anims && gameObject.anims.currentAnim && !gameObject.shouldRemove) {
                gameObject.anims.stopOnFrame(gameObject.anims.currentAnim.frames[0])
            }
            gameObject.clearTint()
        })

        this.input.on(Phaser.Input.Events.DROP, (pointer, gameObject, dropZone) => {
            if (!dropZone || !dropZone.zoneCfg) return
            if (gameObject.moveTo) { // Michael && hunters can move
                gameObject.moveTo(dropZone)
            }
            if (gameObject.addTo) { // barrels and swimmers can be added
                gameObject.addTo(dropZone, this._currentPhaseTitle)
            }
        })
    }

    disableInteractiveObjects() {
        this.interactiveObjects.forEach((obj) => {
            this.input.disable(obj)
        })
    }

    shouldBeInteractiveObjectFor(currentPhase: string, object: Phaser.GameObjects.GameObject) {
        let name = object.buttonName || object.hunterName
        if (object.isTextButton  || name == Characters.BRODY || name == Characters.HOOPER || name == Characters.QUINT) { 
            return true
        }
        switch (currentPhase) {
            case TitleType.EVENT_SHARK_PHASE:
                if (name == Buttons.ADD_SWIMMER || name == Buttons.ADD_BARREL ||
                    name == Buttons.BARREL || name == Buttons.MICHAEL) {
                    return true
                }
                return false

            case TitleType.CREW_PHASE:
                if (name == Buttons.FISH_FINDER || name == Buttons.BINOCULARS ||
                    name == Buttons.ADD_BARREL || name == Buttons.ADD_SWIMMER ||
                    name == Buttons.BARREL || name == Buttons.MICHAEL) {
                    return true
                }
                return false   
                
            default:
                return false
        }
    }

    enableInteractiveObjects(phaseTitle: string) {
        this.interactiveObjects.forEach((obj) => {
            if (this.shouldBeInteractiveObjectFor(phaseTitle, obj) || obj === this.logButton) {
                this.input.enable(obj)
            }         
        })
    }

    findCharacterBy(name: string): Hunter | undefined {
        return this.hunters.find(hunter => hunter.hunterName === name)
    }

    findBarrelAt(beachName: string): Barrel {
        const barrel = this.interactiveObjects.find(barrel => {
            if (barrel && barrel.linkedTo && barrel.animate) {
                return barrel.linkedTo.zoneName === beachName
            }
            return false
        })
        return barrel as Barrel
    }

    findSwimmerAt(beach: Zone): Swimmer {
        const swimmer = this.interactiveObjects.find(swimmer => {
            if (swimmer && swimmer.linkedTo && swimmer.eatenByJaws) {
                return swimmer.linkedTo.zoneName === beach.zoneName
            }
            return false
        })
        return swimmer as Swimmer
    }

    getMap(): Phaser.GameObjects.GameObject | undefined {
        return this.board
    }

    getLocale(word: string | string[]): string {
        return this.locales?.getLocale(word)
    }    

    getJawsPosition(): string {
        return this.jawsAI!.getJawsPosition()
    }

    isJawsVisible(): boolean {
        return this.jawsAI!.isJawsVisible()
    }

    launchMessage(msg: string, isSharkTurnFinished?: boolean, delay?: number) {
        let delayInMilliseconds = delay || 500
        this.time.delayedCall(delayInMilliseconds, () => {
            const callback = (button, index) => {
                this.enableInteractiveObjects(this._currentPhaseTitle)
                if (isSharkTurnFinished) {
                    if (!this.logButton) {
                        this.addLogButton()
                    }
                    this.lastDisplayedMessage = msg
                    const messageCallback = () => {
                        this.launchPhaseTitle(TitleType.CREW_PHASE)
                        this.removeTextButtons()
                        this.addEndTurnButton()
                        this.addFlavorText()
                        this.disableInteractiveObjects()
                    }
                    this.launchJawsWinMessageIfNeeded(messageCallback.bind(this))
                }
            }
            const dialog = new Dialog(this, DialogType.OK, msg, callback)
            this.disableInteractiveObjects()
        }, [], this)
    }

    launchPhaseTitle(type: string) {
        if (type != TitleType.EVENT_SHARK_PHASE && type != TitleType.CREW_PHASE) return
        this._currentPhaseTitle = type
        this.disableInteractiveObjects()
        this.scene.add(SceneKeys.PhaseTitle, PhaseTitle, true, { 
            boardCenter: this.boardCenter, 
            mainScene: this,
            type: type,
            callback: () => {
                this.saveGameData()
                this.enableInteractiveObjects(type)
                this.scene.remove(SceneKeys.PhaseTitle)
            }
        })

        // phase title on screen
        const textCfg = { 
            fill: "#fff",
            backgroundColor: "#00425899",
            padding: { x: 6, y: 6 },
            fontSize: 20
        }

        let text = type === TitleType.CREW_PHASE ? this.getLocale("CREW PHASE") : this.getLocale("EVENT PHASE + SHARK PHASE")
        if (this.phaseTitle) this.phaseTitle.destroy()
        this.phaseTitle = this.add.text(5, 5, text, textCfg)
    }

    saveGameData() {
        let gameData = {}

        // jaws
        gameData[GameDataToSave.JAWS] = this.jawsAI?.Jaws
        
        // hunter positions
        gameData[GameDataToSave.HUNTER_POSITIONS] = {};
        [Characters.BRODY, Characters.HOOPER, Characters.QUINT].forEach((charName) => {
            let hunterPosition = this.hunters.find((hunterItem) => {
                return hunterItem.hunterName == charName
            })?.currentZone.zoneName            
            if (hunterPosition) {
                gameData[GameDataToSave.HUNTER_POSITIONS][charName] = hunterPosition
            }
        })

        // barrel positions
        gameData[GameDataToSave.BARREL_POSITIONS] = this.jawsAI?.barrelPositions()
        
        // swimmers
        let swimmersPositions: any[] = []
        this.board.mapZones.forEach((zone) => {
            const numSwimmers = this.jawsAI.findZoneBy(zone.zoneName)!.numSwimmers
            if (numSwimmers > 0) {
                swimmersPositions.push({ "zoneName": zone.zoneName, "numSwimmers": numSwimmers })
            }
        })
        gameData[GameDataToSave.SWIMMER_POSITIONS] = swimmersPositions

        // michael
        if (this.michael.linkedTo) {
            gameData[GameDataToSave.MICHAEL_POSITION] = this.michael.linkedTo.zoneName
        }

        // saved logs
        if (this.logManager) {
            gameData[GameDataToSave.SAVED_LOGS] = this.logManager.savedLogs
        }

        // current phase
        if (this.currentPhaseTitle) {
            gameData[GameDataToSave.CURRENT_PHASE_TITLE] = this.currentPhaseTitle
        }

        this.localStorage.saveGameData(gameData)
    }

    onEndTurnButtonPressed(buttonKey: string) {
        this.removeTextButtons()
        this.removeFlavorText()
        this.addSharkButtons()
        this.launchPhaseTitle(TitleType.EVENT_SHARK_PHASE)
    }

    onSharkActionButtonPressed(buttonKey: string) {
        let numActions = 3
        let isGardnersBoat = false
        switch (buttonKey) {
            case SharkButtons.JAWS_3:
                break

            case SharkButtons.JAWS_4:
                numActions = 4
                break

            case SharkButtons.JAWS_G:
                isGardnersBoat = true
                break

            default:
                return
        }
        if (this.jawsAI) {
            this.disableInteractiveObjects()
            this.jawsAI.setInitialJawsPositionIfNeeded(false)
            this.jawsAI.selectTaskIfNeeded(numActions, isGardnersBoat)
            this.jawsAI.performJawsActions(numActions, isGardnersBoat)
        }
    }

    attachBarrelToJaws() {
        this.jawsAI?.attachBarrelToJaws()
        if (this.jawsAI?.numAttachedBarrelsToJaws() >= this.numBarrelsObjetive) {
            const callback = (button, index) => {
                switch (button.text) {
                    case this.getLocale("Yes"):
                        this.launchLogScreen()
                        break
                    default:
                        break
                }
                this.enableInteractiveObjects(this.currentPhaseTitle)
            }
            const dialog = new Dialog(this, DialogType.YES_NO, this.getLocale("Enough barrels! Do you want to end game?"), callback)
            this.disableInteractiveObjects()
        }
    }

    numAttachedBarrelsToJaws(): number {
        return this.jawsAI?.numAttachedBarrelsToJaws() || 0
    }

    launchLogScreen() {
        this.scene.add(SceneKeys.LogScreen, LogScreen, true, { 
            mainScene: this,
            boardCenter: this.boardCenter,
            language: this.lang,
            callback: () => {
                this.scene.remove(SceneKeys.LogScreen)
                this.scene.start(SceneKeys.FinalOptions, { language: this.lang })
            }
        })
    }

    updateBodyCount(swimmers: number, barrels: number, usedPowers: number) {
        this.swimmersEatenText.text = swimmers
        this.barrelsAttachedToJawsText.text = barrels
        this.usedPowersText.text = usedPowers
    }

    launchJawsWinMessageIfNeeded(messageCallback: Function) {
        if (parseInt(this.swimmersEatenText.text) >= 9) {
            const callback = (button, index) => {
                switch (button.text) {
                    case this.getLocale("Yes"):
                        this.launchLogScreen()
                        break
                    default:
                        messageCallback()
                        break
                }
                this.enableInteractiveObjects(this.currentPhaseTitle)
            }
            const dialog = new Dialog(this, DialogType.YES_NO, this.getLocale("The shark had eaten a lot of people. End game?"), callback)
            this.disableInteractiveObjects()
        } else {
            messageCallback()
        }
    }
}
