import DijkstraManager from '~/utils/DijkstraManager'
import { JawsGraph } from '~/consts/Graph'
import ZoneNames from '~/consts/ZoneNames'
import Board from '~/objects/Board'
import Zone from '~/objects/Zone'
import IGame from '~/objects/IGame'
import Characters from '~/consts/Characters'
import Hunter from '~/objects/Hunter'
import Actions from '~/consts/Actions'
import LogManager from './LogManager'

const beaches = [ZoneNames.N, ZoneNames.S, ZoneNames.E, ZoneNames.W]
const deepOcean = [ZoneNames.ONE, ZoneNames.TWO, ZoneNames.THREE, ZoneNames.FOUR]
const shallowOcean = [ZoneNames.FIVE, ZoneNames.SIX, ZoneNames.SEVEN, ZoneNames.EIGHT]

const PowerTokens = {
    FEEDING_FRENZY: "ff",
    EVASIVE_MOVES: "em",
    OUT_OF_SIGHT: "oos",
    SPEED_BURST: "sb"
}

const powersAvailable = [
    PowerTokens.FEEDING_FRENZY,
    PowerTokens.EVASIVE_MOVES,
    PowerTokens.OUT_OF_SIGHT,
    PowerTokens.SPEED_BURST
]

const JawsStatus = {
    NINJA: "ninja",
    NORMAL: "normal",
    HUNGRY: "hungry"
}

const JawsMissionNames = {
    SILENT_RUNNING: "silentRunning",
    NEAREST_BEACH: "nearestBeach",
    FARTHEST_BEACH: "farthestBeach",
    NORTH_BEACH: ZoneNames.N,
    SOUTH_BEACH: ZoneNames.S,
    EAST_BEACH: ZoneNames.E,
    WEST_BEACH: ZoneNames.W,
    MOST_SWIMMERS: "mostSwimmersBeach",
    LESS_SWIMMERS: "lessSwimmersBeach"
}

const standardMissions = [
    JawsMissionNames.NORTH_BEACH, 
    JawsMissionNames.SOUTH_BEACH, 
    JawsMissionNames.EAST_BEACH, 
    JawsMissionNames.WEST_BEACH
]

const hungryMissions = [
    JawsMissionNames.MOST_SWIMMERS,
    JawsMissionNames.NEAREST_BEACH
]

const ninjaMissions = [
    JawsMissionNames.FARTHEST_BEACH, 
    JawsMissionNames.LESS_SWIMMERS,
    JawsMissionNames.SILENT_RUNNING
]

interface JawsConfig {
    position: string
    numAttachedBarrels: number
    currentTarget: string | null
    lastBeachAttacked: string | null
    path: string[]
    powerEnabledThisTurn: string | null
    powersAvailable: string[]
    turnsPlayed: number
    swimmersEaten: number
    status: string
    activatedBarrelsThisTurn: string[]
    huntersVisitedThisTurn: Hunter[]
    swimmersEatenThisTurn: any
    publicMessages: string[]
}

export default class JawsAI {

    private static instance: JawsAI
    private random: Phaser.Math.RandomDataGenerator
    private dijkstraManager: DijkstraManager
    private zones: Zone[]
    private scene: IGame
    private logManager: LogManager

    private jaws: JawsConfig = {
        position: "",
        numAttachedBarrels: 0,
        currentTarget: null,
        lastBeachAttacked: null,
        path: [],
        powerEnabledThisTurn: null,
        powersAvailable: [],
        turnsPlayed: 0,
        swimmersEaten: 0,
        status: JawsStatus.NORMAL,
        activatedBarrelsThisTurn: [],
        huntersVisitedThisTurn: [],
        swimmersEatenThisTurn: {},
        publicMessages: []
    }
    public get Jaws(): JawsConfig {
        return this.jaws
    }

    private constructor(scene: IGame, savedJaws?: JawsConfig) {
        this.scene = scene
        this.zones = this.scene.getMap().mapZones
        this.random = new Phaser.Math.RandomDataGenerator()
        this.dijkstraManager = DijkstraManager.getInstance()
        this.logManager = LogManager.getInstance(this.scene.logEnabled)
        if (savedJaws) {
            this.jaws = savedJaws
        }
    }

    public static getInstance(scene: IGame, savedJaws?: JawsConfig): JawsAI {
        if (!JawsAI.instance) {
            JawsAI.instance = new JawsAI(scene, savedJaws)
        }

        return JawsAI.instance
    }

    realInRange(min: number, max: number) {
        return this.random.realInRange(min, max)
    }
    
    integerInRange(min: number, max: number) {
        return this.random.integerInRange(min, max)
    }
    
    pick(array: any[]) {
        return this.random.pick(array)
    }

    // AI methods

    getMissionDeckForJawsStatus(): string[] {
        switch (this.jaws.status) {
            case JawsStatus.HUNGRY:
                return hungryMissions
    
            case JawsStatus.NINJA:
                return standardMissions
    
            default:
                return standardMissions
        }
    }

    getJawsTargetForMission(missionName: string): string {
        switch (missionName) {
            case JawsMissionNames.NORTH_BEACH:
            case JawsMissionNames.SOUTH_BEACH:
            case JawsMissionNames.EAST_BEACH:
            case JawsMissionNames.WEST_BEACH:
                return missionName
    
            case JawsMissionNames.NEAREST_BEACH:
                let minDistance = 666
                let nearestBeaches: string[] = []
                beaches.filter(beach => beach != this.jaws.position).forEach((beach) => {
                    let taskConfig = {barrels: this.barrelPositions()} // TODO: review Quint (when to apply & his weight), quint: currentQuintPosition(), desiredDistanceToQuint: 2}
                    let graph = this.dijkstraManager.buildWeightedJawsGraph(taskConfig)
                    let distance = this.dijkstraManager.findShortestPath(graph, this.jaws.position, beach).distance
                    if (distance < minDistance) {
                        nearestBeaches = [beach]
                    } else if (distance == minDistance) {
                        nearestBeaches.push(beach)
                    }
                })
                return this.pick(nearestBeaches) as string
    
            case JawsMissionNames.FARTHEST_BEACH:
                let maxDistance = 0
                let farthestBeaches: string[] = []
                beaches.filter(beach => beach != this.jaws.position).forEach((beach) => {
                    let taskConfig = {barrels: this.barrelPositions()} // TODO: review Quint (when to apply & his weight), quint: currentQuintPosition(), desiredDistanceToQuint: 2}
                    let graph = this.dijkstraManager.buildWeightedJawsGraph(taskConfig)
                    let distance = this.dijkstraManager.findShortestPath(graph, this.jaws.position, beach).distance
                    if (distance > maxDistance) {
                        farthestBeaches = [beach]
                    } else if (distance == maxDistance) {
                        farthestBeaches.push(beach)
                    }
                })
                return this.pick(farthestBeaches) as string
    
            case JawsMissionNames.MOST_SWIMMERS:
                let maxSwimmers = 0
                let crowdedBeaches: string[] = []
                beaches.filter(beach => beach != this.jaws.position).forEach((beach) => {
                    let numSwimmers = this.findZoneBy(beach)!.numSwimmers + (this.findZoneBy(beach)!.isMichaelHere ? 2 : 0)
                    if (numSwimmers > maxSwimmers) {
                        crowdedBeaches = [beach]
                        maxSwimmers = numSwimmers
                    } else if (numSwimmers == maxSwimmers) {
                        crowdedBeaches.push(beach)
                        maxSwimmers = numSwimmers
                    }
                })
                return this.pick(crowdedBeaches) as string
    
            case JawsMissionNames.LESS_SWIMMERS:
                let lessSwimmers = 666
                let emptyBeaches: string[] = []
                beaches.filter(beach => beach != this.jaws.position).forEach((beach) => {
                    let numSwimmers = this.findZoneBy(beach)!.numSwimmers + (this.findZoneBy(beach)!.isMichaelHere ? 2 : 0)
                    if (numSwimmers < lessSwimmers) {
                        emptyBeaches = [beach]
                        lessSwimmers = numSwimmers
                    } else if (numSwimmers == lessSwimmers) {
                        emptyBeaches.push(beach)
                        lessSwimmers = numSwimmers
                    }
                })
                return this.pick(emptyBeaches) as string
    
            case JawsMissionNames.SILENT_RUNNING:
                let bestOptions = deepOcean.filter((zone) => {
                    return !this.findZoneBy(zone)!.hasBarrels() && this.currentQuintPosition() != zone && zone != this.jaws.position
                })
                this.logManager.log(bestOptions)
                if (bestOptions.length > 0) {
                    return this.pick(bestOptions) as string
                }
                bestOptions = shallowOcean.filter((zone) => {
                    return !this.findZoneBy(zone)!.hasBarrels() && this.currentQuintPosition() != zone && zone != this.jaws.position
                })
                this.logManager.log(bestOptions)
                if (bestOptions.length > 0) {
                    return this.pick(bestOptions) as string
                }
                return this.jaws.position
    
            default:
                return this.jaws.position
        }
    }

    barrelPositions(): string[] {
        let positions: string[] = []
        this.zones.forEach((zone) => {
            if (this.findZoneBy(zone.zoneName)!.hasBarrels()) {
                positions.push(zone.zoneName)
            }
        })
        return positions
    }

    numBarrelsInWater(): number {
        return this.barrelPositions().length
    }
    
    currentQuintPosition(): string {
        return this.scene.findCharacterBy(Characters.QUINT).currentZone.zoneName
    }
    
    currentHooperPosition(): string {
        return this.scene.findCharacterBy(Characters.HOOPER).currentZone.zoneName
    }
    
    isJawsAtBeach(): boolean {
        return beaches.includes(this.jaws.position)
    }

    oppositeBeachFromCurrent(): string | null {
        switch (this.jaws.position) {
            case ZoneNames.N:
                return ZoneNames.S
            case ZoneNames.S:
                return ZoneNames.N
            case ZoneNames.W:
                return ZoneNames.E
            case ZoneNames.E:
                return ZoneNames.W
            default:
                return null
        }
    }

    findZoneBy(zoneName: string): Zone {
        return this.zones.filter((zone) => {
            return zone.zoneName === zoneName
        })[0]
    }

    initGame() {
        this.jaws.turnsPlayed = this.jaws.swimmersEaten = 0
        this.jaws.powersAvailable = Array.from(powersAvailable) // we need a fresh copy
    }

    setInitialJawsPositionIfNeeded(force) {
        if (this.jaws.position && !force) return
    
        this.initGame()
    
        let quintZones = this.dijkstraManager.filterNodesByDistance(4, JawsGraph, this.currentQuintPosition()).reverse()
        let bestOptions = quintZones[0].concat(quintZones[1])
        let initialPos = this.pick(bestOptions) as string
        this.logManager.log(this.scene.getLocale("Jaws chooses INITIAL position ") + this.scene.getLocale(initialPos), true)
        this.jaws.publicMessages.push(this.scene.getLocale("Jaws chooses INITIAL position "))
        this.jaws.position = initialPos
    }

    shouldAmbushAtBeach(numActions): boolean {
        let beach = this.findZoneBy(this.jaws.position)
        let beachName = beach.zoneName
        return this.isJawsAtBeach() && beach.hasSomethingToEat() && numActions < 2 && this.jaws.lastBeachAttacked != beachName
    }
    
    shouldTakeMyChancesBecauseQuintIsFarAway(): boolean {
        if (this.jaws.turnsPlayed < 3 || this.numBarrelsInWater() < 2) return false // don't take risks at the beggining of the game
    
        let quintIsFarSoTakeYourChances = this.oppositeBeachFromCurrent() == this.currentQuintPosition() ? this.random.realInRange(0, 10) : 0
        return quintIsFarSoTakeYourChances > 4 // TO-DO: change this value if Jaws fear Quint?
    }

    updateBodyCount() {
        this.scene.updateBodyCount(this.jaws.swimmersEaten, this.jaws.numAttachedBarrels)
    }

    // Start JAWS POWERS -----------------

    shouldUseSpeedBurstPowerToRunAway(numActions): boolean {
        if (!this.jaws.powerEnabledThisTurn && this.jaws.powersAvailable.includes(PowerTokens.SPEED_BURST) && numActions == 2) {
            if (this.integerInRange(2, 4) < this.jaws.turnsPlayed) {
                this.useJawsPower(PowerTokens.SPEED_BURST)
                return true
            }
        }
        return false
    }

    shouldUseFeedingFrenzy(isGoingToRunAwayOrHide): boolean {
        if (!this.jaws.powerEnabledThisTurn && this.jaws.powersAvailable.includes(PowerTokens.FEEDING_FRENZY) && !isGoingToRunAwayOrHide) {
            let beach = this.findZoneBy(this.jaws.position)
            if (this.isJawsAtBeach()) {
                if (beach.numSwimmers > 3 || (beach.numSwimmers > 1 && beach.isMichaelHere)) {
                    this.useJawsPower(PowerTokens.FEEDING_FRENZY)
                    return true
                }
            }
        }
        return false
    }

    shouldUseOutOfSightPower(): boolean {
        if (!this.jaws.powerEnabledThisTurn && this.jaws.powersAvailable.includes(PowerTokens.OUT_OF_SIGHT)) {
            if (this.integerInRange(2, 4) < this.jaws.turnsPlayed) {
                this.useJawsPower(PowerTokens.OUT_OF_SIGHT)
                return true
            }
        }
        return false
    }

    shouldUseEvasiveMovementsToMoveto(zoneName, numActions): boolean {
        return !this.jaws.powerEnabledThisTurn && 
                this.jaws.powersAvailable.includes(PowerTokens.EVASIVE_MOVES) && 
                beaches.includes(zoneName) && 
                this.findZoneBy(zoneName).hasBarrels() &&
                this.jaws.path.length <= numActions
    }

    useJawsPower(power) {
        if (!this.jaws.powersAvailable.includes(power)) {
            return
        }
        this.jaws.powerEnabledThisTurn = power
        this.jaws.powersAvailable = this.jaws.powersAvailable.filter((item) => {
            return item != power
        })
    }

    performSpeedBurstMove(isGardnersBoat) {
        this.jaws.currentTarget = this.getJawsTargetForMission(JawsMissionNames.FARTHEST_BEACH)
        this.calculateRouteToTarget()
        this.logManager.log(this.scene.getLocale("Jaws uses SPEED BURST to go to ") + this.scene.getLocale(this.jaws.currentTarget), true)
        for (let q=0; q<3; q++) {
            if (this.jaws.path.length > 0) {
                this.jawsMovesTo(this.jaws.path.shift(), isGardnersBoat)
            } else {
                this.jaws.currentTarget = null
            }
        }
    }

    // End JAWS POWERS -----------------

    changeJawsBehaviourIfNeeded() {
        this.jaws.status = JawsStatus.NORMAL
        if (this.totalSwimmersOnBeaches() > 8) {
            this.jaws.status = JawsStatus.HUNGRY
        } else if (this.jaws.numAttachedBarrels > 0 && this.integerInRange(1, 10) < 5) { // fear of Quint? 40%
            this.jaws.status = JawsStatus.NINJA
        }
        this.logManager.log(this.scene.getLocale("Jaws status is: ") + this.scene.getLocale(this.jaws.status))
    }
    
    calculateRouteToTarget() {
        let taskConfig = {barrels: this.barrelPositions()} // TODO: review Quint (when to apply & his weight), quint: currentQuintPosition(), desiredDistanceToQuint: 2}
        this.logManager.log(taskConfig)
        let graph = this.dijkstraManager.buildWeightedJawsGraph(taskConfig)
        this.logManager.log(graph)
        let path = this.dijkstraManager.findShortestPath(graph, this.jaws.position, this.jaws.currentTarget).path
        if (path[0] === this.jaws.position) path.shift()
        this.jaws.path = path
        this.logManager.log(this.scene.getLocale("Jaws' task path is: ") + this.scene.getLocale(path))
    }

    totalSwimmersOnBeaches(): number {
        let total = 0
        this.zones.forEach((zone) => {
            total += zone.totalSwimmers()
        })
        return total
    }

    selectTaskIfNeeded(numActions, isGardnersBoat) {
        if (this.jaws.currentTarget) return
    
        this.changeJawsBehaviourIfNeeded()
    
        while (this.jaws.position === this.jaws.currentTarget || this.jaws.currentTarget == null) {
            let task = this.pick(this.getMissionDeckForJawsStatus())
            this.logManager.log(this.scene.getLocale("Jaws current mission now is: ") + task)
            this.jaws.currentTarget = this.getJawsTargetForMission(task as string)
        }
        this.logManager.log(this.scene.getLocale("Jaws current target now is: ") + this.scene.getLocale(this.jaws.currentTarget))
    
        this.calculateRouteToTarget()
    }

    performJawsActions(numActions, isGardnersBoat) {
        if (!this.jaws.currentTarget) {
            this.logManager.log(this.scene.getLocale("No current target...?"))
            return
        }
    
        this.calculateRouteToTarget()
    
        this.jaws.activatedBarrelsThisTurn = []
        this.jaws.huntersVisitedThisTurn = []
        this.jaws.swimmersEatenThisTurn = {
            "N": { "michael": false, "swimmers": 0 },
            "S": { "michael": false, "swimmers": 0 },
            "W": { "michael": false, "swimmers": 0 },
            "E": { "michael": false, "swimmers": 0 }
        }
        this.jaws.powerEnabledThisTurn = null

        this.jaws.turnsPlayed++
        this.jaws.publicMessages.push(this.scene.getLocale("TURN ") + this.jaws.turnsPlayed)
        this.jaws.publicMessages.push("--------")
    
        if (this.shouldUseEvasiveMovementsToMoveto(this.jaws.currentTarget, numActions)) {
            this.useJawsPower(PowerTokens.EVASIVE_MOVES)
        }
    
        while (numActions > 0) {
            if (this.jaws.currentTarget) {
                if (this.executeJawsSingleAction(numActions, isGardnersBoat)) {
                    numActions--
                }
            } else {
                if (this.shouldAmbushAtBeach(numActions)) {
                    numActions = 0 // sleep on the beach, please
                } else {           
                    this.selectTaskIfNeeded(numActions, isGardnersBoat)
                }
            } 
            this.logManager.log(this.scene.getLocale("Jaws remaining actions: ") + numActions, true)
        }

        if (this.jaws.activatedBarrelsThisTurn.length > 0) {
            const shuffledBarrels = Phaser.Utils.Array.Shuffle(this.jaws.activatedBarrelsThisTurn)
            this.logManager.log(this.scene.getLocale("Jaws has activated barrels at: ") + this.scene.getLocale(shuffledBarrels), true)
            this.jaws.publicMessages.push(this.scene.getLocale("Jaws has activated barrels at: ") + this.scene.getLocale(shuffledBarrels))
            this.jaws.activatedBarrelsThisTurn.forEach((zoneName) => {
                const barrel = this.scene.findBarrelAt(zoneName)
                if (barrel && barrel.animate) {
                    barrel.animate()
                }
            })
        }
        if (isGardnersBoat && this.jaws.huntersVisitedThisTurn.length > 0) {
            let captains: string[] = []
            this.jaws.huntersVisitedThisTurn.forEach((captain) => {
                captains.push(captain.hunterName)
            })
            this.jaws.publicMessages.push(this.scene.getLocale("Jaws has kicked captain: ") + captains)
            this.jaws.huntersVisitedThisTurn.forEach((captain) => {
                captain.animate()
            })
        }
        for (let beachName in this.jaws.swimmersEatenThisTurn) {
            if (this.jaws.swimmersEatenThisTurn[beachName]["michael"]) {
                this.jaws.publicMessages.push(this.scene.getLocale("Jaws eats Michael Brody on beach ") + this.scene.getLocale(beachName))
            }
            let numSwimmersEaten = this.jaws.swimmersEatenThisTurn[beachName]["swimmers"]
            if (numSwimmersEaten > 0) {
                this.jaws.publicMessages.push(this.scene.getLocale("Jaws eats ") + numSwimmersEaten + this.scene.getLocale(" swimmer(s) on beach ") + this.scene.getLocale(beachName))
            }
            const jawsFeeds = numSwimmersEaten > 0 || this.jaws.swimmersEatenThisTurn[beachName]["michael"]
            if (beachName && jawsFeeds) {
                this.findZoneBy(beachName)!.showAttack()
            }
        }
        this.scene.updateBodyCount(this.jaws.swimmersEaten, this.jaws.numAttachedBarrels)
        if (this.jaws.powerEnabledThisTurn) {
            this.jaws.publicMessages.push(this.scene.getLocale("Jaws has used a POWER."))
        }
        this.jaws.publicMessages.push(this.scene.getLocale("Jaws ends its turn."))
        this.scene.launchMessage(this.jaws.publicMessages.join("\n"), true)
        this.jaws.publicMessages = []
        this.logManager.log("----------------" + this.scene.getLocale("END TURN ") + this.jaws.turnsPlayed + "-------------", true)
    }

    jawsEatsMichaelAt(beach: Zone) {
        this.logManager.log(this.scene.getLocale("Jaws eats Michael Brody on beach ") + this.scene.getLocale(beach.zoneName), true)
        beach.updateMichael(Actions.REMOVE)
        this.scene.michael.returnHome()
        this.jaws.swimmersEaten += 2
        this.jaws.swimmersEatenThisTurn[beach.zoneName]["michael"] = true
    }
    
    jawsEatsSwimmerAt(beach: Zone) {
        this.logManager.log(this.scene.getLocale("Jaws eats 1 swimmer on beach ") + this.scene.getLocale(beach.zoneName), true)
        const swimmer = this.scene.findSwimmerAt(beach)
        if (swimmer && swimmer.eatenByJaws) {
            swimmer.eatenByJaws()
            this.jaws.swimmersEaten += 1
            this.jaws.swimmersEatenThisTurn[beach.zoneName]["swimmers"]++
        }
    }

    jawsMovesTo(destination, isGardnersBoat) {
        this.jaws.position = destination
        if (this.findZoneBy(destination)!.hasBarrels() && !this.jaws.activatedBarrelsThisTurn.includes(destination) && this.jaws.powerEnabledThisTurn != PowerTokens.EVASIVE_MOVES) {
            this.jaws.activatedBarrelsThisTurn.push(destination)
        }
        if (isGardnersBoat) {
            const hooper = this.scene.findCharacterBy(Characters.HOOPER)
            const quint = this.scene.findCharacterBy(Characters.QUINT)
            if (this.jaws.position == this.currentHooperPosition() && !this.jaws.huntersVisitedThisTurn.includes(hooper)) {
                this.jaws.huntersVisitedThisTurn.push(hooper)
            }
            if (this.jaws.position == this.currentQuintPosition() && !this.jaws.huntersVisitedThisTurn.includes(quint)) {
                this.jaws.huntersVisitedThisTurn.push(quint)
            }
        }
        this.logManager.log(this.scene.getLocale("Jaws moves to ") + this.scene.getLocale(destination), true)
    }

    executeJawsSingleAction(numActions, isGardnersBoat) {
        if (this.jaws.powerEnabledThisTurn == PowerTokens.SPEED_BURST && numActions == 1) {
            this.performSpeedBurstMove(isGardnersBoat)
            return true
        }
    
        if (this.isJawsAtBeach()) {
            let beach = this.findZoneBy(this.jaws.position)
            let isGoingToRunAwayOrHide = this.shouldUseSpeedBurstPowerToRunAway(numActions) || this.shouldUseOutOfSightPower()
            let conditionsArePositive = numActions > 1 || this.shouldTakeMyChancesBecauseQuintIsFarAway() || isGoingToRunAwayOrHide
            if (beach.hasSomethingToEat() && conditionsArePositive) {
                this.jaws.lastBeachAttacked = beach.zoneName
                
                // Feeding Frenzy
                if (this.shouldUseFeedingFrenzy(isGoingToRunAwayOrHide)) {
                    if (!isGoingToRunAwayOrHide) {
                        this.logManager.log(this.scene.getLocale("Jaws uses FEEDING FRENZY power at ") + this.scene.getLocale(beach.zoneName), true)
                        this.useJawsPower(PowerTokens.FEEDING_FRENZY)
                        if (beach.isMichaelHere) {
                            this.jawsEatsMichaelAt(beach)     
                        }
                        const numSwimmersAtTheStartOfAttack = beach.numSwimmers
                        for (let q=0; q<numSwimmersAtTheStartOfAttack; q++) {
                            this.jawsEatsSwimmerAt(beach)
                        }
                        return true
                    }
                }
    
                // Normal feeding
                if (beach.isMichaelHere) {
                    this.jawsEatsMichaelAt(beach)     
                } else {
                    this.jawsEatsSwimmerAt(beach)    
                }
                return true
            } else if (!beach.hasSomethingToEat() && this.jaws.lastBeachAttacked == beach.zoneName && numActions == 1) {
                // if shark have just eaten all swimmers in a beach, maybe it should remain in that beach for a while...
                if (this.integerInRange(1, 10) < 4) { // let's say 30% of times
                    return true
                }
            }
        }
    
        // No eating? Jaws moves...
        if (this.jaws.path.length > 0) {
            this.jawsMovesTo(this.jaws.path.shift(), isGardnersBoat)
            return true
        } else {
            this.jaws.currentTarget = null
            return false
        }    
    }

    isJawsVisible(): boolean {
        return this.jaws.powerEnabledThisTurn != PowerTokens.OUT_OF_SIGHT
    }

    getJawsPosition(): string {
        return this.jaws.position
    }

    attachBarrelToJaws() {
        this.jaws.numAttachedBarrels += 1
        this.scene.updateBodyCount(this.jaws.swimmersEaten, this.jaws.numAttachedBarrels)
    }

    numAttachedBarrelsToJaws(): number {
        return this.jaws.numAttachedBarrels
    }

}