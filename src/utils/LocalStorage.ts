import { LOCALSTORAGE_STRING, GameDataToSave } from "~/consts/GameDataToSave"

export default class LocalStorage {
    
    private static instance: LocalStorage

    private constructor() {}

    public static getInstance(): LocalStorage {
        if (!LocalStorage.instance) {
            LocalStorage.instance = new LocalStorage()
        }

        return LocalStorage.instance
    }

    loadGameData() {
        const savedGameData = window.localStorage.getItem(LOCALSTORAGE_STRING)
        if (savedGameData) {
            const parsedGameData = JSON.parse(savedGameData)
            if (parsedGameData) {
                for (let prop in parsedGameData) {
                    return parsedGameData
                }
            }
        }
    }

    removeItem(key: string) {
        const savedGameData = window.localStorage.getItem(LOCALSTORAGE_STRING)
        if (savedGameData) {
            const parsedGameData = JSON.parse(savedGameData)
            if (parsedGameData && parsedGameData[key]) {
                delete parsedGameData[key]
            }
            this.saveGameData(parsedGameData)
        }
    }

    reset() {
        window.localStorage.removeItem(LOCALSTORAGE_STRING)
    }

    saveGameData(gameData: any) {
        window.localStorage.setItem(LOCALSTORAGE_STRING, JSON.stringify(gameData))
    }

}