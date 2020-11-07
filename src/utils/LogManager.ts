export default class LogManager {
    
    private _savedLogs: string[] = []
    public get savedLogs(): string[] {
        return this._savedLogs
    }
    private logEnabled: boolean = false
    private static instance: LogManager

    private constructor(logEnabled: boolean) {
        this.reset()
        this.logEnabled = logEnabled || false
    }

    public static getInstance(logEnabled: boolean): LogManager {
        if (!LogManager.instance) {
            LogManager.instance = new LogManager(logEnabled)
        }

        return LogManager.instance
    }

    reset(savedLogs: string[] = []) {
        this._savedLogs = savedLogs || []
    }

    log(msg: string | string[], saveLogMsg?: boolean) {
        if (this.logEnabled) {
            console.log(msg)
        }
        if (saveLogMsg) {
            this._savedLogs.push(msg)
        }
    }

}