import Phaser from 'phaser'
import { ZONES } from '~/act2/core/data'
import { deserializeSession } from '~/act2/app/controller'
import Act2Locale from '~/act2/i18n'
import { button, label, loadText, clearSave, UI } from '~/act2/ui/widgets'
import LocalStorage from '~/utils/LocalStorage'
import { GameDataToSave } from '~/consts/GameDataToSave'
import Act2Keys from './Act2Keys'

/** Back to the start without asking the language again, keeping any saved Act I game. */
export function goToMainMenu(lang: string): void {
    const storage = LocalStorage.getInstance()
    const data = storage.loadGameData() || {}
    data[GameDataToSave.TEMPORARY_LANGUAGE] = lang
    storage.saveGameData(data)
    window.location.reload()
}

/** End of Act II (BLUEPRINT P-25): who won and how, then a new Act II game or the main menu. */
export default class Act2End extends Phaser.Scene {
    private lang = 'EN'

    constructor() {
        super(Act2Keys.End)
    }

    init(data: { language?: string }) {
        this.lang = data.language || 'EN'
    }

    create() {
        const t = new Act2Locale(this.lang)
        this.cameras.main.setBackgroundColor('#00001a')
        const saved = loadText()
        const cx = this.cameras.main.centerX
        if (saved) {
            const s = deserializeSession(saved).state
            const winner = s.winner || 'crew'
            label(this, cx, 140, t.getLocale(`act2.msg.winner.${winner}`), 48, winner === 'shark' ? '#ff5050' : UI.accent).setOrigin(0.5)
            const gone = ZONES.filter(z => s.tiles[z] === 'gone').length
            label(this, cx, 230, t.getLocale('act2.end.rounds', [s.round, s.shark.wounds, gone]), 20).setOrigin(0.5)
        }
        clearSave()
        button(this, cx, 380, t.getLocale('act2.end.again'), () => this.scene.start(Act2Keys.Setup, { language: this.lang }), { fontSize: 26, width: 420 })
        button(this, cx, 460, t.getLocale('act2.end.menu'), () => goToMainMenu(this.lang), { fontSize: 22, width: 420 })
    }
}
