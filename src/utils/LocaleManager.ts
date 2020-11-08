import Languages from "~/consts/Languages"

const Locale = {
    "EVENT PHASE + SHARK PHASE": {
        ES: "FASE SUCESOS + FASE TIBURÓN"
    },
    "Draw Amity Event card.\nDeploy swimmers.\nClick on any Shark Action button.": {
        ES: "Roba una carta Sucesos Amity.\nColoca bañistas.\nPulsa en el botón de Acción del Tiburón."
    },
    "CREW PHASE": {
        ES: "FASE TRIPULACIÓN"
    },
    "Move characters.\nPerform actions.\nWhen finished, click 'End turn' button.": {
        ES: "Mueve a los personajes.\nLleva a cabo acciones.\nCuando termines, pulsa en el botón 'Fin Turno'."
    },    
    "End Turn": {
        ES: "Fin Turno"
    },
    "Ok": {
        ES: "De acuerdo"
    },
    "Yes": {
        ES: "Sí"
    },
    "ninja": {
        ES: "silencioso"
    },
    "hungry": {
        ES: "hambriento"
    },
    "W": {
        ES: "O"
    },
    "Binoculars used at: ": {
        ES: "Prismáticos activados en: "
    },
    "Fish Finder activated at: ": {
        ES: "Detector de peces activado en: "
    },
    "Barrel launch at: ": {
        ES: "Se lanza un barril en: "
    },
    "Jaws status is: ": {
        ES: "El comportamiento del tiburón es: "
    },
    "Jaws uses SPEED BURST to go to ": {
        ES: "El tiburón utiliza la RÁFAGA de VELOCIDAD para ir a "
    },
    "Jaws uses FEEDING FRENZY power at ": {
        ES: "El tiburón usa el poder FRENESÍ ALIMENTICIO en "
    },
    "Jaws has used a POWER.": {
        ES: "El tiburón ha utilizado un PODER especial."
    },
    "You've attached a barrel to the shark!": {
        ES: "¡Diana! ¡Has enganchado un barril al tiburón!"
    },
    "Jaws has kicked captain: ": {
        ES: "El tiburón ha lanzado al agua a: "
    },
    "Jaws has activated barrels at: ": {
        ES: "El tiburón ha activado barriles en: "
    },
    "Are you sure that you want to launch a barrel\nat zone ": {
        ES: "¿Seguro que quieres lanzar un barril\nen la zona "
    },
    "Do you want to use binoculars at Brody's location?": {
        ES: "¿Quieres que Brody use los prismáticos en su posición actual?"
    },
    "Nothing on the water...": {
        ES: "No hay nada en el agua..."
    },
    "Jaws current mission now is: ": {
        ES: "La misión actual del tiburón es: "
    },
    "END TURN ": {
        ES: "FIN TURNO "
    },
    "Jaws 3 actions": {
        ES: "Tiburón 3 acciones"
    },
    "Jaws 4 actions": {
        ES: "Tiburón 4 acciones"
    },
    "Jaws (Gardner's boat)": {
        ES: "Tiburón (Bote de Gardner)"
    },
    "Jaws chooses INITIAL position ": {
        ES: "El tiburón elige la posición inicial "
    },
    "Jaws' task path is: ": {
        ES: "La ruta de la misión del tiburón es: "
    },
    "Jaws current target now is: ": {
        ES: "El objetivo actual del tiburón es "
    },
    "No current target...?": {
        ES: "¿No hay un objetivo?"
    },
    "Jaws remaining actions: ": {
        ES: "Acciones restantes del tiburón: "
    },
    "Jaws eats Michael Brody on beach ": {
        ES: "El tiburón devora a Michael Brody en la playa "
    },
    "Jaws eats 1 swimmer on beach ": {
        ES: "El tiburón devora a un bañista en la playa "
    },
    "Jaws eats ": {
        ES: "El tiburón ha devorado "
    },
    " swimmer(s) on beach ": {
        ES: " bañista(s) en la playa "
    },
    "Jaws moves to ": {
        ES: "El tiburón se mueve a "
    },
    "Jaws ends its turn.": {
        ES: "El tiburón ha terminado su turno"
    },
    "Do you want to activate the Fish Finder at Hooper's location?": {
        ES: "¿Quieres activar el DETECTOR de peces en la posición de Hooper?"
    },
    "SHAAARK!!": {
        ES: "¡TIBURÓOOON!"
    },
    "The shark is nearby from here...": {
        ES: "El tiburón anda cerca..."
    },
    "NOTHING on the screen...": {
        ES: "No hay NADA en la pantalla..."
    },
    "TURN ": {
        ES: "TURNO "
    },
    "Enough barrels! Do you want to end game?": {
        ES: "¡Suficientes bidones! ¿Terminamos la partida?"
    },
    "The shark had eaten a lot of people. End game?": {
        ES: "El tiburón se ha hartado de comer gente. ¿Terminamos?"
    },
    "THE JAWS LOG": {
        ES: "EL DIARIO DE TIBURÓN"
    },
    "END GAME": {
        ES: "TERMINAR PARTIDA"
    },
    "I want to PLAY AGAIN": {
        ES: "Quiero JUGAR OTRA VEZ"
    },
    "I want to get the source code of this App": {
        ES: "Quiero ver/descargar el código fuente de esta App"
    },
    "I'd like to rate this App and/or suggest another one": {
        ES: "Quiero valorar esta App y/o sugerir otro juego"
    },
    "I want to invite the App creator to a coffee": {
        ES: "Quiero invitar a un café al creador de la App"
    },
    "CONTINUE LAST GAME": {
        ES: "CONTINUAR ÚLTIMA PARTIDA"
    },
    "NEW GAME": {
        ES: "NUEVA PARTIDA"
    }
}

export default class LocaleManager {
    private readonly selectedLang: string = Languages.English

    constructor(lang: string) {
        this.selectedLang = lang
    }
    
    getLocale = (key:string  | string[]) => {
        if (Array.isArray(key)) {
            let result: any[] = []
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