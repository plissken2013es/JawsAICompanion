/**
 * Act II texts (SPECS §5, D-8): Spanish and English in full, with the official card names of each
 * edition; Italian is a draft for Adriano Barsali to review (card names not yet checked against the
 * Italian edition, see docs/acto2/italiano-da-rivedere.md); any other language falls back to English. Kept apart from the
 * Act I LocaleManager table (whose keys are the English sentences) but with the same getLocale API.
 * "{0}", "{1}"... are replaced by the arguments; an argument that is itself a key is translated.
 */
type Entry = { readonly EN: string; readonly ES: string; readonly [lang: string]: string }

export const ACT2_STRINGS: Readonly<Record<string, Entry>> = {
    // ---------------------------------------------------------------- names
    'act2.crew.brody': { EN: 'Brody', ES: 'Brody', IT: 'Brody' },
    'act2.crew.quint': { EN: 'Quint', ES: 'Quint', IT: 'Quint' },
    'act2.crew.hooper': { EN: 'Hooper', ES: 'Hooper', IT: 'Hooper' },
    'act2.shark': { EN: 'Shark', ES: 'Tiburón', IT: 'Squalo' },

    'act2.ability.rammingSpeed': { EN: 'Ramming Speed', ES: 'Embestida Rápida', IT: 'Speronamento' },
    'act2.ability.secondHelping': { EN: 'Second Helping', ES: 'Segunda Ración', IT: 'Bis' },
    'act2.ability.maulAgain': { EN: 'Maul Again', ES: 'Ataque Bifásico', IT: 'Doppio Morso' },
    'act2.ability.hardTarget': { EN: 'Hard Target', ES: 'Blanco Difícil', IT: 'Bersaglio Difficile' },
    'act2.ability.bigMouth': { EN: 'Big Mouth', ES: 'Gran Mordida', IT: 'Boccone Grosso' },
    'act2.ability.makingWaves': { EN: 'Making Waves', ES: 'Fuerte Oleaje', IT: 'Onde Alte' },
    'act2.ability.dominoEffect': { EN: 'Domino Effect', ES: 'Efecto Dominó', IT: 'Effetto Domino' },
    'act2.ability.extraStrength': { EN: 'Extra Strength', ES: 'Fuerza Brutal', IT: 'Forza Bruta' },

    'act2.gear.bat': { EN: 'Baseball Bat', ES: 'Bate de Béisbol', IT: 'Mazza da Baseball' },
    'act2.gear.pistol': { EN: 'Pistol', ES: 'Pistola', IT: 'Pistola' },
    'act2.gear.machete': { EN: 'Machete', ES: 'Machete', IT: 'Machete' },
    'act2.gear.flare': { EN: 'Flare', ES: 'Bengala', IT: 'Razzo di Segnalazione' },
    'act2.gear.hammer': { EN: 'Hammer', ES: 'Martillo', IT: 'Martello' },
    'act2.gear.rifle': { EN: 'Rifle', ES: 'Rifle', IT: 'Fucile' },
    'act2.gear.ammo': { EN: 'Ammo', ES: 'Munición', IT: 'Munizioni' },
    'act2.gear.chum': { EN: 'Chum', ES: 'Carnada', IT: 'Esca' },
    'act2.gear.sharkCage': { EN: 'Shark Cage', ES: 'Jaula Antitiburones', IT: 'Gabbia Antisqualo' },
    'act2.gear.harpoonGun': { EN: 'Harpoon Gun', ES: 'Fusil de Pesca', IT: 'Fucile Subacqueo' },
    'act2.gear.hook': { EN: 'Hook', ES: 'Gancho', IT: 'Gancio' },
    'act2.gear.tranqSpear': { EN: 'Tranq Spear', ES: 'Arpón Tranquilizante', IT: 'Arpione Tranquillante' },
    'act2.gear.fishingNet': { EN: 'Fishing Net', ES: 'Red de Pesca', IT: 'Rete da Pesca' },
    'act2.gear.fishingPole': { EN: 'Fishing Pole', ES: 'Caña de Pescar', IT: 'Canna da Pesca' },
    'act2.gear.canister': { EN: 'Canister', ES: 'Bombona', IT: 'Bombola' },

    // ---------------------------------------------------------------- table instructions
    'act2.msg.newGame': { EN: 'The shark draws {0} Shark Ability cards (the app keeps them hidden).', ES: 'El Tiburón roba {0} cartas de Habilidad (la app las guarda en secreto).', IT: 'Lo Squalo pesca {0} carte Abilità (l\'app le tiene segrete).' },
    'act2.msg.round': { EN: 'Round {0}: turn over 3 Resurface cards.', ES: 'Ronda {0}: da la vuelta a 3 cartas de Reaparición.', IT: 'Round {0}: scopri 3 carte Riemersione.' },
    'act2.msg.sharkDecided': { EN: 'The shark has chosen.', ES: 'El Tiburón ha decidido.', IT: 'Lo Squalo ha deciso.' },
    'act2.msg.abilityFaceDown': { EN: 'It plays a Shark Ability face down.', ES: 'Juega una Habilidad boca abajo.', IT: 'Gioca un\'Abilità a faccia in giù.' },
    'act2.msg.chumShown': { EN: 'Chum: the shark is NOT at option {0}.', ES: 'Carnada: el Tiburón NO está en la opción {0}.', IT: 'Esca: lo Squalo NON è nell\'opzione {0}.' },
    'act2.msg.surfaces': { EN: 'The shark surfaces in zone {0}.', ES: 'El Tiburón emerge en la zona {0}.', IT: 'Lo Squalo riemerge nella zona {0}.' },
    'act2.msg.findAbility': { EN: 'Find the card {0} and leave it face up.', ES: 'Busca la carta {0} y déjala a la vista.', IT: 'Cerca la carta {0} e lasciala scoperta.' },
    'act2.msg.shakeOff': { EN: 'It shakes off: {0}. Discard them.', ES: 'Se sacude: {0}. Descártalas.', IT: 'Si scrolla di dosso: {0}. Scartale.' },
    'act2.msg.crewAttack': { EN: '{0} deals {1} wounds (shark: {2}).', ES: '{0} hace {1} Heridas (Tiburón: {2}).', IT: '{0} infligge {1} Ferite (Squalo: {2}).' },
    'act2.msg.pistolShift': { EN: '{0} moves the Pistol token to water {1}.', ES: '{0} mueve la ficha de la Pistola al agua {1}.', IT: '{0} sposta il segnalino della Pistola nell\'acqua {1}.' },
    'act2.msg.batReroll': { EN: '{0} missed with the Bat: roll both dice again.', ES: '{0} falla con el Bate: repite los dos dados.', IT: '{0} manca con la Mazza: ritira entrambi i dadi.' },
    'act2.msg.rams': { EN: 'Ramming Speed: move the shark to water {0} (+2 hits).', ES: 'Embestida Rápida: mueve el Tiburón al agua {0} (+2 Alcances).', IT: 'Speronamento: sposta lo Squalo nell\'acqua {0} (+2 Colpi).' },
    'act2.msg.cage': { EN: '{0} plays the Shark Cage: no wounds this round.', ES: '{0} juega la Jaula: no recibe Heridas esta ronda.', IT: '{0} gioca la Gabbia: nessuna Ferita in questo round.' },
    'act2.msg.holds': { EN: 'The shark does not attack.', ES: 'El Tiburón no ataca.', IT: 'Lo Squalo non attacca.' },
    'act2.msg.attacksDeck': { EN: 'The shark attacks boat space {0}.', ES: 'El Tiburón ataca la pieza {0}.', IT: 'Lo Squalo attacca la sezione {0}.' },
    'act2.msg.attacksCrew': { EN: 'The shark attacks {0} in the water.', ES: 'El Tiburón ataca a {0} en el agua.', IT: 'Lo Squalo attacca {0} in acqua.' },
    'act2.msg.maul': { EN: 'Maul Again: reroll die {0}.', ES: 'Ataque Bifásico: repite el dado {0}.', IT: 'Doppio Morso: ritira il dado {0}.' },
    'act2.msg.deck.ok': { EN: 'Boat space {0} holds ({1} hits).', ES: 'La pieza {0} aguanta ({1} Alcances).', IT: 'La sezione {0} regge ({1} Colpi).' },
    'act2.msg.deck.damaged': { EN: 'Boat space {0} is damaged: flip the tile.', ES: 'La pieza {0} queda dañada: dale la vuelta.', IT: 'La sezione {0} è danneggiata: girala.' },
    'act2.msg.deck.gone': { EN: 'Boat space {0} is destroyed: remove the tile.', ES: 'La pieza {0} queda destruida: retírala.', IT: 'La sezione {0} è distrutta: rimuovila.' },
    'act2.msg.falls': { EN: '{0} falls into water {1}.', ES: '{0} cae al agua {1}.', IT: '{0} cade nell\'acqua {1}.' },
    'act2.msg.bites': { EN: '{0} takes {1} wounds.', ES: '{0} recibe {1} Heridas.', IT: '{0} subisce {1} Ferite.' },
    'act2.msg.bigMouth': { EN: 'Big Mouth: 1 wound to {0}.', ES: 'Gran Mordida: 1 Herida a {0}.', IT: 'Boccone Grosso: 1 Ferita a {0}.' },
    'act2.msg.makingWaves': { EN: 'Making Waves: everyone on the boat falls into the water.', ES: 'Fuerte Oleaje: todos los del barco caen al agua.', IT: 'Onde Alte: tutti quelli sulla barca cadono in acqua.' },
    'act2.msg.secondHelping': { EN: 'Second Helping: attack boat space {0} with 2 dice.', ES: 'Segunda Ración: ataca la pieza {0} con 2 dados.', IT: 'Bis: attacca la sezione {0} con 2 dadi.' },
    'act2.msg.bonusAttack': { EN: 'Bonus attack against {0}: 1 die.', ES: 'Ataque Extra contra {0}: 1 dado.', IT: 'Attacco Bonus contro {0}: 1 dado.' },
    'act2.msg.bonus': { EN: 'Bonus attack: {0} takes {1} wounds.', ES: 'Ataque Extra: {0} recibe {1} Heridas.', IT: 'Attacco Bonus: {0} subisce {1} Ferite.' },
    'act2.msg.eliminated': { EN: '{0} is eliminated: discard their gear.', ES: '{0} queda eliminado: descarta su Equipamiento.', IT: '{0} è eliminato: scarta il suo Equipaggiamento.' },
    'act2.msg.flareRoll': { EN: 'The Flare burns: roll 1 die for the shark.', ES: 'La Bengala quema: tira 1 dado por el Tiburón.', IT: 'Il Razzo brucia: tira 1 dado per lo Squalo.' },
    'act2.msg.flare': { EN: 'Flare: the shark takes {0} wounds.', ES: 'Bengala: el Tiburón recibe {0} Heridas.', IT: 'Razzo: lo Squalo subisce {0} Ferite.' },
    'act2.msg.winner.shark': { EN: 'THE SHARK WINS', ES: 'GANA EL TIBURÓN', IT: 'VINCE LO SQUALO' },
    'act2.msg.winner.crew': { EN: 'THE CREW WINS', ES: 'GANA LA TRIPULACIÓN', IT: 'VINCE L\'EQUIPAGGIO' },

    // ---------------------------------------------------------------- screens
    'act2.title': { EN: 'ACT II: THE ORCA', ES: 'ACTO II: LA ORCA', IT: 'ATTO II: L\'ORCA' },
    'act2.ui.ok': { EN: 'OK', ES: 'Aceptar', IT: 'OK' },
    'act2.ui.next': { EN: 'Next', ES: 'Siguiente', IT: 'Avanti' },
    'act2.ui.undo': { EN: 'Undo', ES: 'Deshacer', IT: 'Annulla' },
    'act2.ui.log': { EN: 'Log', ES: 'Registro', IT: 'Registro' },
    'act2.ui.settings': { EN: 'Settings', ES: 'Ajustes', IT: 'Impostazioni' },
    'act2.ui.back': { EN: 'Back', ES: 'Volver', IT: 'Indietro' },
    'act2.ui.none': { EN: 'Nobody', ES: 'Nadie', IT: 'Nessuno' },
    'act2.ui.zone': { EN: 'Zone {0}', ES: 'Zona {0}', IT: 'Zona {0}' },
    'act2.ui.card': { EN: 'Z{0} · Evade {1} · {2} dice', ES: 'Z{0} · Evasión {1} · {2} dados', IT: 'Z{0} · Evasione {1} · {2} dadi' },
    'act2.ui.card1': { EN: 'Z{0} · Evade {1} · 1 die', ES: 'Z{0} · Evasión {1} · 1 dado', IT: 'Z{0} · Evasione {1} · 1 dado' },
    'act2.ui.shake': { EN: 'shake', ES: 'sacude', IT: 'scrolla' },
    'act2.ui.options': { EN: 'Tap the 3 Resurface cards (A, B, C)', ES: 'Toca las 3 cartas de Reaparición (A, B, C)', IT: 'Tocca le 3 carte Riemersione (A, B, C)' },
    'act2.ui.prepare': { EN: 'Move the crew tokens that changed (tap token, then space). Then reveal.', ES: 'Mueve las fichas que hayan cambiado (toca ficha y luego espacio). Después, revela.', IT: 'Sposta le pedine che sono cambiate (tocca la pedina e poi lo spazio). Poi rivela.' },
    'act2.ui.reveal': { EN: 'Reveal the shark', ES: 'Revelar al Tiburón', IT: 'Rivela lo Squalo' },
    'act2.ui.chum': { EN: 'Play Chum ({0})', ES: 'Jugar Carnada ({0})', IT: 'Gioca Esca ({0})' },
    'act2.ui.hits': { EN: 'Who aimed at zone {0}? Tap them (weapon below).', ES: '¿Quién apuntó a la zona {0}? Tócalos (arma debajo).', IT: 'Chi ha mirato alla zona {0}? Toccali (arma sotto).' },
    'act2.ui.pistolShift': { EN: 'Pistol from the next water', ES: 'Pistola desde el agua vecina', IT: 'Pistola dall\'acqua vicina' },
    'act2.ui.crewRoll': { EN: '{0} rolls {1} dice with {2}: total hits?', ES: '{0} tira {1} dados con {2}: ¿cuántos Alcances?', IT: '{0} tira {1} dadi con {2}: quanti Colpi?' },
    'act2.ui.cage': { EN: 'Does anyone play the Shark Cage now?', ES: '¿Alguien juega la Jaula ahora?', IT: 'Qualcuno gioca la Gabbia adesso?' },
    'act2.ui.sharkRoll': { EN: 'Roll {0} dice for the shark: total hits?', ES: 'Tira {0} dados por el Tiburón: ¿cuántos Alcances?', IT: 'Tira {0} dadi per lo Squalo: quanti Colpi?' },
    'act2.ui.sharkRollPole': { EN: 'Roll {0} dice for the shark (Fishing Pole: 2 counts as 1): total?', ES: 'Tira {0} dados por el Tiburón (Caña: el 2 vale 1): ¿total?', IT: 'Tira {0} dadi per lo Squalo (Canna: il 2 vale 1): totale?' },
    'act2.ui.sharkDie': { EN: 'Die {0} of {1}: how many hits?', ES: 'Dado {0} de {1}: ¿cuántos Alcances?', IT: 'Dado {0} di {1}: quanti Colpi?' },
    'act2.ui.summary': { EN: 'End of round {0}.', ES: 'Fin de la ronda {0}.', IT: 'Fine del round {0}.' },
    'act2.ui.nextRound': { EN: 'Next round', ES: 'Siguiente ronda', IT: 'Round successivo' },
    'act2.ui.status': { EN: 'Shark {0}/18 · Brody {1} · Quint {2} · Hooper {3}', ES: 'Tiburón {0}/18 · Brody {1} · Quint {2} · Hooper {3}', IT: 'Squalo {0}/18 · Brody {1} · Quint {2} · Hooper {3}' },

    'act2.setup.title': { EN: 'ACT II SETUP', ES: 'PREPARACIÓN DEL ACTO II', IT: 'PREPARAZIONE DELL\'ATTO II' },
    'act2.setup.fromAct1': { EN: 'Swimmers eaten in Act I: {0}', ES: 'Bañistas comidos en el Acto I: {0}', IT: 'Bagnanti mangiati nell\'Atto I: {0}' },
    'act2.setup.standalone': { EN: 'Act II on its own (6 abilities, 7 gear)', ES: 'Acto II suelto (6 Habilidades, 7 Equipamiento)', IT: 'Solo l\'Atto II (6 Abilità, 7 Equipaggiamento)' },
    'act2.setup.swimmers': { EN: 'Swimmers eaten (difficulty)', ES: 'Bañistas comidos (dificultad)', IT: 'Bagnanti mangiati (difficoltà)' },
    'act2.setup.counts': { EN: 'Shark: {0} abilities · Crew: {1} common gear cards', ES: 'Tiburón: {0} Habilidades · Tripulación: {1} cartas de Equipamiento común', IT: 'Squalo: {0} Abilità · Equipaggio: {1} carte Equipaggiamento comune' },
    'act2.setup.gear': { EN: 'Tap the common gear each crew member got ({0} of {1})', ES: 'Toca el Equipamiento común de cada tripulante ({0} de {1})', IT: 'Tocca l\'Equipaggiamento comune di ogni membro dell\'equipaggio ({0} di {1})' },
    'act2.setup.positions': { EN: 'Start: tap a boat space for each crew member', ES: 'Inicio: toca un espacio de barco para cada tripulante', IT: 'Inizio: tocca uno spazio barca per ogni membro dell\'equipaggio' },
    'act2.setup.start': { EN: 'Start Act II', ES: 'Empezar el Acto II', IT: 'Inizia l\'Atto II' },

    'act2.settings.appDice': { EN: 'Shark dice: {0}', ES: 'Dados del Tiburón: {0}', IT: 'Dadi dello Squalo: {0}' },
    'act2.settings.dice.app': { EN: 'the app rolls them', ES: 'los tira la app', IT: 'li tira l\'app' },
    'act2.settings.dice.table': { EN: 'at the table', ES: 'en la mesa', IT: 'sul tavolo' },
    'act2.settings.variant': { EN: 'Unofficial variant (bonus attacks with the card dice): {0}', ES: 'Variante no oficial (Ataques Extra con los dados de la carta): {0}', IT: 'Variante non ufficiale (Attacchi Bonus con i dadi della carta): {0}' },
    'act2.settings.antiStall': { EN: 'Anti-stall: {0}', ES: 'Anti-bloqueo: {0}', IT: 'Anti-stallo: {0}' },
    'act2.on': { EN: 'on', ES: 'sí', IT: 'sì' },
    'act2.off': { EN: 'off', ES: 'no', IT: 'no' },

    'act2.menu.continueAct2': { EN: 'CONTINUE TO ACT II', ES: 'CONTINUAR AL ACTO II', IT: 'CONTINUA CON L\'ATTO II' },
    'act2.menu.playAct2': { EN: 'PLAY ACT II ONLY', ES: 'JUGAR SOLO EL ACTO II', IT: 'GIOCA SOLO L\'ATTO II' },
    'act2.menu.resumeAct2': { EN: 'CONTINUE ACT II GAME', ES: 'CONTINUAR PARTIDA DEL ACTO II', IT: 'CONTINUA LA PARTITA DELL\'ATTO II' },
    'act2.end.again': { EN: 'New Act II game', ES: 'Nueva partida del Acto II', IT: 'Nuova partita dell\'Atto II' },
    'act2.end.menu': { EN: 'Main menu', ES: 'Menú principal', IT: 'Menu principale' },
    'act2.end.rounds': { EN: '{0} rounds · shark wounds {1}/18 · boat {2}/8 destroyed', ES: '{0} rondas · Heridas del Tiburón {1}/18 · barco {2}/8 destruido', IT: '{0} round · Ferite dello Squalo {1}/18 · barca {2}/8 distrutta' },
}

const ARG = /\{(\d+)\}/g

/** Messages whose single {0} is a list. */
const LIST_KEYS: readonly string[] = ['act2.msg.shakeOff', 'act2.msg.bigMouth', 'act2.msg.maul']

export function translate(lang: string, key: string, args: readonly (string | number)[] = []): string {
    const entry = ACT2_STRINGS[key]
    const text = entry ? (entry[lang] || entry.EN) : key
    return text.replace(ARG, (_m, i) => {
        const a = args[Number(i)]
        if (a === undefined) return ''
        return typeof a === 'string' && a.indexOf('act2.') === 0 ? translate(lang, a) : String(a)
    })
}

/** Same API as the Act I LocaleManager. */
export default class Act2Locale {
    constructor(private readonly lang: string) {}

    getLocale(key: string, args: readonly (string | number)[] = []): string {
        return translate(this.lang, key, args)
    }

    /** A table line; for the messages that take a list (cards, crew, dice) the list is joined with commas. */
    line(key: string, args: readonly (string | number)[] = []): string {
        if (LIST_KEYS.indexOf(key) < 0) return translate(this.lang, key, args)
        const parts = args.map(a => (typeof a === 'string' && a.indexOf('act2.') === 0 ? translate(this.lang, a) : String(a)))
        return translate(this.lang, key, [parts.join(', ')])
    }
}
