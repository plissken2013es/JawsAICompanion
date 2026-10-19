import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import Act2Locale, { ACT2_STRINGS, translate } from '~/act2/i18n'
import { ABILITY_IDS, GEAR, abilityNameKey, gearNameKey } from '~/act2/core/data'
import { CREW_IDS } from '~/act2/core/state'
import type { GearId } from '~/act2/core/types'

const placeholders = (s: string) => (s.match(/\{\d+\}/g) || []).sort().join()

/** Every 'act2.…' key written literally in the Act II app sources. */
function keysUsedIn(dir: string): string[] {
    const out = new Set<string>()
    const walk = (d: string) => {
        for (const f of fs.readdirSync(d)) {
            const p = path.join(d, f)
            if (fs.statSync(p).isDirectory()) walk(p)
            else if (p.endsWith('.ts') && !p.endsWith('i18n.ts')) {
                const text = fs.readFileSync(p, 'utf8')
                for (const m of text.match(/'act2\.[a-zA-Z0-9.]+'/g) || []) out.add(m.slice(1, -1))
            }
        }
    }
    walk(dir)
    return Array.from(out).filter(k => !k.endsWith('.'))
}

describe('Act II texts (D-8)', () => {
    it('every entry has English, Spanish and Italian with the same placeholders', () => {
        for (const key of Object.keys(ACT2_STRINGS)) {
            const e = ACT2_STRINGS[key]
            expect(e.EN, key).toBeTruthy()
            expect(e.ES, key).toBeTruthy()
            expect(e.IT, key).toBeTruthy()
            expect(placeholders(e.ES), key).toBe(placeholders(e.EN))
            expect(placeholders(e.IT), key).toBe(placeholders(e.EN))
        }
    })

    it('every card name and crew member is there', () => {
        for (const id of ABILITY_IDS) expect(ACT2_STRINGS[abilityNameKey(id)]).toBeDefined()
        for (const id of Object.keys(GEAR) as GearId[]) expect(ACT2_STRINGS[gearNameKey(id)]).toBeDefined()
        for (const id of CREW_IDS) expect(ACT2_STRINGS[`act2.crew.${id}`]).toBeDefined()
    })

    it('every key the app writes exists, including the ones built at run time', () => {
        const used = keysUsedIn(path.resolve(__dirname, '../../src/act2'))
            .concat(['ok', 'damaged', 'gone'].map(t => `act2.msg.deck.${t}`), ['shark', 'crew'].map(w => `act2.msg.winner.${w}`))
        const missing = used.filter(k => !ACT2_STRINGS[k])
        expect(missing).toEqual([])
    })

    it('official names: Spanish edition and English original', () => {
        expect(translate('ES', 'act2.ability.maulAgain')).toBe('Ataque Bifásico')
        expect(translate('EN', 'act2.ability.maulAgain')).toBe('Maul Again')
        expect(translate('ES', 'act2.gear.harpoonGun')).toBe('Fusil de Pesca')
    })

    it('arguments are filled in, and keys among them are translated', () => {
        expect(translate('ES', 'act2.msg.findAbility', ['act2.ability.bigMouth'])).toBe('Busca la carta Gran Mordida y déjala a la vista.')
        expect(translate('EN', 'act2.msg.crewAttack', ['act2.crew.quint', 2, 9])).toBe('Quint deals 2 wounds (shark: 9).')
    })

    it('Italian has its own texts; German and Russian fall back to English for now', () => {
        expect(translate('IT', 'act2.title')).toBe("ATTO II: L'ORCA")
        expect(translate('IT', 'act2.msg.findAbility', ['act2.ability.bigMouth'])).toBe('Cerca la carta Boccone Grosso e lasciala scoperta.')
        for (const lang of ['DE', 'RU']) expect(translate(lang, 'act2.title')).toBe('ACT II: THE ORCA')
    })

    it('a list argument is joined', () => {
        const l = new Act2Locale('ES')
        expect(l.line('act2.msg.shakeOff', ['act2.gear.flare', 'act2.gear.fishingNet'])).toBe('Se sacude: Bengala, Red de Pesca. Descártalas.')
        expect(l.line('act2.msg.bites', ['act2.crew.brody', 3])).toBe('Brody recibe 3 Heridas.')
        // a message with fewer placeholders than arguments is not a list: the extra ones are dropped
        expect(l.line('act2.msg.deck.damaged', [7, 2])).toBe('La pieza 7 queda dañada: dale la vuelta.')
    })
})
