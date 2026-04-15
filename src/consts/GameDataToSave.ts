enum GameDataToSave {
    TEMPORARY_LANGUAGE = "temporaryLanguage",
    JAWS = "jaws",
    HUNTER_POSITIONS = "hunterPositions",
    BARREL_POSITIONS = "barrelPositions",
    SWIMMER_POSITIONS = "swimmerPosittions",
    MICHAEL_POSITION = "michaelPosition",
    SAVED_LOGS = "savedLogs",
    CURRENT_PHASE_TITLE = "currentPhaseTitle"
}

const LOCALSTORAGE_STRING = "JawsAI_gamedata"

export { LOCALSTORAGE_STRING, GameDataToSave }