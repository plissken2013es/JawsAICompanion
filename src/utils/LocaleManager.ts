import Languages from "~/consts/Languages"

const Locale = {
    "EVENT PHASE + SHARK PHASE": {
      ES: "FASE SUCESOS + FASE TIBURÓN",
      DE: "EREIGNIS-PHASE + HAI-PHASE",
      RU: "ФАЗА СОБЫТИЯ + ФАЗА АКУЛЫ",
      IT: "FASE EVENTI + FASE SQUALO"
    },
    "Draw Amity Event card.\nDeploy swimmers.\nClick on any Shark Action button.": {
      ES: "Roba una carta Sucesos Amity.\nColoca bañistas.\nPulsa en el botón de Acción del Tiburón.",
      DE: "Ziehe Amity-Ereigniskarte.\nVerteile Schwimmer.\nKlicke einen Hai-Aktions-Button.",
      RU: "Возьмите карту Событие Эмити.\nРазместите купальщиков.\nНажмите на любую кнопку Действия Акулы.",
      IT: "Pesca una carta Evento di Amity.\nPosiziona i bagnanti.\nPremi un pulsante Azione dello Squalo."
    },
    "CREW PHASE": {
      ES: "FASE TRIPULACIÓN",
      DE: "BESATZUNGS-PHASE",
      RU: "ФАЗА КОМАНДЫ",
      IT: "FASE EQUIPAGGIO"
    },
    "Move characters.\nPerform actions.\nWhen finished, click 'End turn' button.": {
      ES: "Mueve a los personajes.\nLleva a cabo acciones.\nCuando termines, pulsa en el botón 'Fin Turno'.",
      DE: "Bewege Figuren.\nFühre Aktionen durch.\nWenn fertig, klicke 'Zug beenden'.",
      RU: "Передвиньте персонажей.\nВыполните действия.\nНажмите на кнопку 'Конец хода'.",
      IT: "Muovi i personaggi.\nEsegui le azioni.\nAl termine, premi il pulsante 'Fine Turno'."
    },
    "End Turn": {
      ES: "Fin Turno",
      DE: "Zug beenden",
      RU: "Конец хода",
      IT: "Fine Turno"
    },
    "Ok": {
      ES: "De acuerdo",
      DE: "Ok",
      RU: "Хорошо",
      IT: "Ok"
    },
    "Yes": {
      ES: "Sí",
      DE: "Ja",
      RU: "Да",
      IT: "Sì"
    },
    "No": {
      ES: "No",
      DE: "Nein",
      RU: "Нет",
      IT: "No"
    },
    "ninja": {
      ES: "silencioso",
      DE: "ninja",
      RU: "ниндзя",
      IT: "furtivo"
    },
    "hungry": {
      ES: "hambriento",
      DE: "hungrig",
      RU: "голодна",
      IT: "affamato"
    },
    "N": {
      ES: "N",
      DE: "N",
      RU: "С",
      IT: "N"
    },
    "S": {
      ES: "S",
      DE: "S",
      RU: "Ю",
      IT: "S"
    },
    "W": {
      ES: "O",
      DE: "W",
      RU: "З",
      IT: "O"
    },
    "E": {
      ES: "E",
      DE: "O",
      RU: "В",
      IT: "E"
    },
    "Binoculars used at: ": {
      ES: "Prismáticos activados en: ",
      DE: "Fernglas benutzt an Strand ",
      RU: "Бинокль использован в: ",
      IT: "Binocolo usato a: "
    },
    "Fish Finder activated at: ": {
      ES: "Detector de peces activado en: ",
      DE: "Fischfinder aktiviert in Zone ",
      RU: "Эхолот активирован в: ",
      IT: "Ecoscandaglio attivato in zona: "
    },
    "Barrel launch at: ": {
      ES: "Se lanza un barril en: ",
      DE: "Fass ausgeworfen in Zone ",
      RU: "Бочка заброшена в: ",
      IT: "Lancio del barile in zona: "
    },
    "Jaws status is: ": {
      ES: "El comportamiento del tiburón es: ",
      DE: "Hai Status ist: ",
      RU: "Статус Акулы: ",
      IT: "Lo stato dello squalo è: "
    },
    "Jaws uses SPEED BURST to go to ": {
      ES: "El tiburón utiliza la RÁFAGA de VELOCIDAD para ir a ",
      DE: "Hai benutzt TURBO, denn er will nach Zone ",
      RU: "Акула использует ИМПУЛЬС СКОРОСТИ, чтобы переместиться в ",
      IT: "Lo squalo usa lo SCATTO per andare in "
    },
    "Jaws uses FEEDING FRENZY power at ": {
      ES: "El tiburón usa el poder FRENESÍ ALIMENTICIO en ",
      DE: "Hai benutzt FRESSRAUSCH an Strand ",
      RU: "Акула использует НЕИСТОВОЕ ПОЖИРАНИЕ в ",
      IT: "Lo squalo usa la FRENESIA ALIMENTARE a "
    },
    "Jaws uses EVASIVE MOVES power": {
      ES: "El tiburón usa el poder MOVIMIENTOS EVASIVOS",
      DE: "Hai benutzt AUSWEICHMANÖVER",
      RU: "Акула использует УКЛОНЕНИЕ",
      IT: "Lo squalo usa il potere MANOVRE EVASIVE"
    },
    "Jaws uses OUT OF SIGHT power": {
      ES: "El tiburón usa el poder FUERA DE LA VISTA",
      DE: "Hai benutzt UNSICHTBARKEIT",
      RU: "Акула использует ИСЧЕЗНОВЕНИЕ",
      IT: "Lo squalo usa il potere FUORI DALLA VISTA"
    },
    "Jaws has used a POWER.": {
      ES: "El tiburón ha utilizado un PODER especial.",
      DE: "Hai hat eine ZUSATZFÄHIGKEIT genutzt ",
      RU: "Акула использовала жетон СИЛЫ.",
      IT: "Lo squalo ha usato un POTERE speciale."
    },
    "You've attached a barrel to the shark!": {
      ES: "¡Diana! ¡Has enganchado un barril al tiburón!",
      DE: "Du hast ein Fass am Hai befestigt!",
      RU: "Вы прицепили бочку к акуле!",
      IT: "Colpito! Hai attaccato un barile allo squalo!"
    },
    "Jaws has kicked captain: ": {
      ES: "El tiburón ha lanzado al agua a: ",
      DE: "Hai hat einen Kapitän ins Wasser befördert in Zone ",
      RU: "Акула столкнула капитана: ",
      IT: "Lo squalo ha gettato in acqua il capitano: "
    },
    "Jaws has activated barrels at: ": {
      ES: "El tiburón ha activado barriles en: ",
      DE: "Hai hat ein Fass aktiviert in Zone ",
      RU: "Акула задела бочку в: ",
      IT: "Lo squalo ha attivato i barili in: "
    },
    "Are you sure that you want to launch a barrel\nat zone ": {
      ES: "¿Seguro que quieres lanzar un barril\nen la zona ",
      DE: "Willst Du ein Fass auswerfen in Zone ",
      RU: "Вы уверены, что хотите забросить\nбочку в ",
      IT: "Sei sicuro di voler lanciare un barile\nnella zona "
    },
    "Do you want to use binoculars at Brody's location?": {
      ES: "¿Quieres que Brody use los prismáticos en su posición actual?",
      DE: "Willst Du das Fernglas an Brodys Position verwenden?",
      RU: "Хотите использовать бинокль в локации Броуди?",
      IT: "Vuoi usare il binocolo nella posizione di Brody?"
    },
    "Sorry. Brody can only use the binoculars at a swimming beach (N, S, E or W).": {
      ES: "Brody sólo puede usar los prismáticos en una playa (N, S, E u O).",
      DE: "Brody kann das Fernglas nur am Strand benutzen (N, S, O oder W).",
      RU: "Извините. Броуди может использовать бинокль\nтолько на пляже для купания (С, Ю, З или В).",
      IT: "Spiacente. Brody può usare il binocolo solo su una spiaggia (N, S, E o O)."
    },
    "Nothing on the water...": {
      ES: "No hay nada en el agua...",
      DE: "Nichts im Wasser zu sehen...",
      RU: "На воде все тихо…",
      IT: "Niente sull'acqua..."
    },
    "Jaws current mission now is: ": {
      ES: "La misión actual del tiburón es: ",
      DE: "Aktuelle Mission des Hais ist nun: ",
      RU: "Текущая миссия Акулы: ",
      IT: "La missione attuale dello squalo è: "
    },
    "END TURN ": {
      ES: "FIN TURNO ",
      DE: "ENDE RUNDE ",
      RU: "КОНЕЦ ХОДА ",
      IT: "FINE TURNO "
    },
    "Jaws 3 actions": {
      ES: "3 acciones",
      DE: "Hai 3 Aktionen",
      RU: "Акула 3 действия",
      IT: "3 azioni"
    },
    "Jaws 4 actions (wrong shark)": {
      ES: "4 acciones (tiburón equivocado)",
      DE: "Hai 4 Aktionen (Falscher Hai)",
      RU: "Акула 4 действия (не та акула)",
      IT: "4 azioni (squalo sbagliato)"
    },
    "Jaws (Gardner's boat)": {
      ES: "Bote de Gardner",
      DE: "Hai (Gardners Boot)",
      RU: "Акула (лодка Гарднера)",
      IT: "Barca di Gardner"
    },
    "Jaws chooses INITIAL position ": {
      ES: "El tiburón elige la posición inicial ",
      DE: "Hai wählt Startfeld ",
      RU: "Акула выбрала НАЧАЛЬНУЮ позицию ",
      IT: "Lo squalo sceglie la posizione INIZIALE "
    },
    "Jaws' task path is: ": {
      ES: "La ruta de la misión del tiburón es: ",
      DE: "Missionsroute des Hais ist: ",
      RU: "Маршрут Акулы: ",
      IT: "Il percorso della missione dello squalo è: "
    },
    "Jaws current target now is: ": {
      ES: "El objetivo actual del tiburón es ",
      DE: "Aktuelles Ziel des Hais ist nun: ",
      RU: "Текущая цель Акулы ",
      IT: "L'obiettivo attuale dello squalo è: "
    },
    "No current target...?": {
      ES: "¿No hay un objetivo?",
      DE: "Kein aktuelles Ziel?",
      RU: "Нет текущей цели…?",
      IT: "Nessun obiettivo attuale...?"
    },
    "Jaws remaining actions: ": {
      ES: "Acciones restantes del tiburón: ",
      DE: "Verbleibende Aktionen: ",
      RU: "Осталось действий у Акулы: ",
      IT: "Azioni rimanenti dello squalo: "
    },
    "Jaws eats Michael Brody on beach ": {
      ES: "El tiburón devora a Michael Brody en la playa ",
      DE: "Hai frißt Michael Brody an Strand ",
      RU: "Акула съела Майкла Броуди на пляже ",
      IT: "Lo squalo divora Michael Brody sulla spiaggia "
    },
    "Jaws eats 1 swimmer on beach ": {
      ES: "El tiburón devora a un bañista en la playa ",
      DE: "Hai frißt 1 Schwimmer an Strand ",
      RU: "Акула съела 1 купальщика на пляже ",
      IT: "Lo squalo divora 1 bagnante sulla spiaggia "
    },
    "Jaws eats ": {
      ES: "El tiburón ha devorado ",
      DE: "Hai frißt ",
      RU: "Акула съела ",
      IT: "Lo squalo divora "
    },
    " swimmer(s) on beach ": {
      ES: " bañista(s) en la playa ",
      DE: " Schwimmer an Strand ",
      RU: " купальщика(ов) на пляже ",
      IT: " bagnante/i sulla spiaggia "
    },
    "Jaws moves to ": {
      ES: "El tiburón se mueve a ",
      DE: "Hai schwimmt nach ",
      RU: "Акула переместилась в ",
      IT: "Lo squalo si sposta in "
    },
    "Jaws ends its turn.": {
      ES: "El tiburón ha terminado su turno",
      DE: "Hai beendet seinen Zug",
      RU: "Акула закончила ход.",
      IT: "Lo squalo termina il suo turno."
    },
    "Do you want to activate the Fish Finder at Hooper's location?": {
      ES: "¿Quieres activar el DETECTOR de peces en la posición de Hooper?",
      DE: "Willst Du den Fischfinder an Hoopers Position verwenden?",
      RU: "Хотите активировать Эхолот в локации Хупера?",
      IT: "Vuoi attivare l'ECOSCANDAGLIO nella posizione di Hooper?"
    },
    "SHAAARK!!": {
      ES: "¡TIBURÓOOON!",
      DE: "HAAAAAI!",
      RU: "АКУЛА!!!",
      IT: "SQUAAALOOO!!"
    },
    "The shark is nearby from here...": {
      ES: "El tiburón anda cerca...",
      DE: "Der Hai ist IN DER NÄHE...",
      RU: "Акула поблизости...",
      IT: "Lo squalo è nelle vicinanze..."
    },
    "NOTHING on the screen...": {
      ES: "No hay NADA en la pantalla...",
      DE: "Der Hai ist NICHT HIER und auch NICHT IN DER NÄHE...",
      RU: "На экране ЧИСТО...",
      IT: "NIENTE sullo schermo..."
    },
    "TURN ": {
      ES: "TURNO ",
      DE: "RUNDE ",
      RU: "ХОД ",
      IT: "TURNO "
    },
    "Enough barrels! Do you want to end game?": {
      ES: "¡Suficientes bidones! ¿Terminamos la partida?",
      DE: "Genug Fässer! Willst Du das Spiel beenden?",
      RU: "Достаточно бочек! Хотите завершить игру?",
      IT: "Abbastanza barili! Vuoi terminare la partita?"
    },
    "The shark had eaten a lot of people. End game?": {
      ES: "El tiburón se ha hartado de comer gente. ¿Terminamos?",
      DE: "Der Hai hat eine Menge Schwimmer gefressen. Spiel beenden?",
      RU: "Акула съела слишком много людей. Закончить игру?",
      IT: "Lo squalo ha divorato molte persone. Terminare la partita?"
    },
    "THE JAWS LOG": {
      ES: "EL DIARIO DE TIBURÓN",
      DE: "DAS HAI PROTOKOLL",
      RU: "ЖУРНАЛ АКУЛЫ",
      IT: "IL REGISTRO DELLO SQUALO"
    },
    "END GAME": {
      ES: "TERMINAR PARTIDA",
      DE: "SPIEL BEENDEN",
      RU: "КОНЕЦ ИГРЫ",
      IT: "TERMINA PARTITA"
    },
    "I want to PLAY AGAIN": {
      ES: "Quiero JUGAR OTRA VEZ",
      DE: "Ich will ERNEUT SPIELEN",
      RU: "Сыграть ЕЩЕ РАЗ",
      IT: "Voglio GIOCARE DI NUOVO"
    },
    "I want to get the source code of this App": {
      ES: "Quiero ver/descargar el código fuente de esta App",
      DE: "Ich will den Quellcode dieser App sehen",
      RU: "Получить исходный код приложения",
      IT: "Voglio ottenere il codice sorgente di questa App"
    },
    "I'd like to rate this App and/or suggest another one": {
      ES: "Quiero valorar esta App y/o sugerir otro juego",
      DE: "Ich möchte die App bewerten oder eine andere vorschlagen",
      RU: "Оценить приложение и/или что-то предложить",
      IT: "Vorrei valutare questa App e/o suggerirne un'altra"
    },
    "I want to invite the App creator to a coffee": {
      ES: "Quiero invitar a un café al creador de la App",
      DE: "Ich möchte dem App-Ersteller einen Kaffee spendieren",
      RU: "Купить создателю приложения чашечку кофе",
      IT: "Voglio offrire un caffè all'autore dell'App"
    },
    "CONTINUE LAST GAME": {
        ES: "CONTINUAR ÚLTIMA PARTIDA",
        DE: "LETZTES SPIEL FORTSETZEN",
        RU: "ПРОДОЛЖИТЬ ИГРУ",
        IT: "CONTINUA ULTIMA PARTITA"
    },
    "NEW GAME": {
        ES: "NUEVA PARTIDA",
        DE: "NEUES SPIEL",
        RU: "НОВАЯ ИГРА",
        IT: "NUOVA PARTITA"
    },
    "Credits": {
      ES: "Créditos",
      DE: "Credits",
      RU: "Авторы",
      IT: "Crediti"
    },
    "quint": {
      ES: "Quint",
      DE: "Quint",
      RU: "Квинт",
      IT: "Quint"
    },
    "hooper": {
      ES: "Hooper",
      DE: "Hooper",
      RU: "Хупер",
      IT: "Hooper"
    },
    "brody": {
      ES: "Brody",
      DE: "Brody",
      RU: "Броуди",
      IT: "Brody"
    }
}

export default class LocaleManager {
    private readonly selectedLang: string = Languages.English

    constructor(lang: string) {
        this.selectedLang = lang
    }

    getLocale = (key: string  | string[]) => {
        if (Array.isArray(key)) {
            const result: any[] = []
            key.forEach((item) => {
                if (Locale[item] && Locale[item][this.selectedLang]) {
                    result.push(Locale[item][this.selectedLang])
                } else {
                    result.push(item)
                }
            })
            return result
        }
        if (Locale[key] && Locale[key][this.selectedLang]) {
            return Locale[key][this.selectedLang]
        }
        return key
    }
}
