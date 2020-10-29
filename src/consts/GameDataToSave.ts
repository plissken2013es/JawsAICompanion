enum GameDataToSave {
    TEMPORARY_LANGUAGE = "temporaryLanguage",
    JAWS = "jaws",
    HUNTER_POSITIONS = "hunterPositions",
    BARREL_POSITIONS = "barrelPositions",
    SWIMMER_POSITIONS = "swimmerPosittions"
}

const LOCALSTORAGE_STRING = "JawsAI_gamedata"
const LOCALSTORAGE_DATA_TO_SAVE = [
    GameDataToSave.TEMPORARY_LANGUAGE
]

export { LOCALSTORAGE_DATA_TO_SAVE, LOCALSTORAGE_STRING, GameDataToSave }