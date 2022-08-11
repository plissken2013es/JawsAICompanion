import Phaser from "phaser"
import Characters from '~/consts/Characters'
import Languages from "~/consts/Languages"

const FlavorTexts = {
    "Here lies the body of Mary Lee; died at the age of\na hundred and three.": {
        text: {
          ES: "Ahí va el cadáver de María Castaños, ha muerto\ncuando tenía 103 años.",
          DE: "Hier liegt die Leiche von Mary Sky, sie starb im Alter\nvon einhundertdrei."
        },
        char: Characters.QUINT
    },
    "There are too many captains on this island.": {
        text: {
          ES: "Hay demasiados capitanes en esta isla.",
          DE: "Es gibt zu viele Kapitäne in dieser Gegend."
        },
        char: Characters.QUINT
    },
    "Ten thousand dollars for me, by myself.": {
        text: {
          ES: "Los 10 mil dólares han de ser para mí solo.",
          DE: "Für zehntausend Dollar übernehme ich den Job."
        },
        char: Characters.QUINT
    },
    "You'll get the head, the tail, the whole damned thing.": {
        text: {
          ES: "Tendrán la cabeza, la cola y el animal entero.",
          DE: "Dafür kriegt ihr die Zähne, den Schädel, das ganze\nverdammte Ding."
        },
        char: Characters.QUINT
    },
    "Farewell and adieu to you fair Spanish ladies.": {
        text: {
          ES: "Ya me marcho de aquí, linda dama española...",
          DE: "Farewell and adieu to you fair Spanish ladies."
        },
        char: Characters.QUINT
    },
    "This shark, swallow ya whole.": {
        text: {
          ES: "Ese tiburón se traga a uno entero.",
          DE: "Dieser Hai beansprucht einen ganz."
        },
        char: Characters.QUINT
    },
    "What are you, some kind of half-ass astronaut?": {
        text: {
          ES: "Oiga, ¿qué es usted? ¿Una especie de astronauta?",
          DE: "Was sind Sie, ein halbärschiger Astronaut, hä?"
        },
        char: Characters.QUINT
    },
    "Cage goes in the water, you go in the water. Shark's in the water.\nOur shark?": {
        text: {
          ES: "¿La jaula en el agua y usted en su interior?\n¿Y un tiburón cerca? ¿Nuestro tiburón?",
          DE: "Sie steigen in diesen Kasten und gehen darin ins Wasser. Sie\ngehen ins Wasser und der Hai ist im Wasser. UNSER Hai?"
        },
        char: Characters.QUINT
    },
    "Stop playin' with yourself Hooper.": {
        text: {
          ES: "Déjese de solitarios, Hooper.",
          DE: "Hören Sie auf, mit sich selber zu spielen, Hooper."
        },
        char: Characters.QUINT
    },
    "Slow ahead. I can slow ahead! Come down and chum some of this shit!": {
        text: {
          ES: "Avante media... Avante media puedo llevarlo yo.\n¡Baje a echar esta porquería!",
          DE: "Langsam voraus. Das kann ich auch, langsam voraus. Kommen Sie\ndoch mal und ködern diese Scheiße!"
        },
        char: Characters.BRODY
    },
    "Let Polly do the printing!": {
        text: {
          ES: "¡Que Polly dibuje las letras!",
          DE: "Polly soll die Schablonen machen!"
        },
        char: Characters.BRODY
    },
    "Everybody out! Get them out! Get out of the water!": {
        text: {
          ES: "¡Todo el mundo fuera! ¡Fuera del agua! ¡Fuera!",
          DE: "Kommt raus! Alle raus! Holt die Kinder aus dem Wasser!"
        },
        char: Characters.BRODY
    },
    "That's some bad hat, Harry.": {
        text: {
          ES: "Qué gorro de baño tan feo, Harry.",
          DE: "Mir gefällt ihr Hut auch nicht, Harry."
        },
        char: Characters.BRODY
    },
    "I never liked the water.": {
        text: {
          ES: "Con razón yo odiaba el mar.",
          DE: "Ich haße Wasser!"
        },
        char: Characters.BRODY
    },
    "Larry, summer’s over. You’re the mayor of Shark City!": {
        text: {
          ES: "Larry, se acabó el verano. ¡Eres el alcalde de Ciudad Tiburón!",
          DE: "Larry, der Sommer ist vorüber, man nennt uns schon Hai City!"
        },
        char: Characters.BRODY
    },
    "I can do anything I'm the chief of police.": {
        text: {
          ES: "Puedo hacer lo que quiera. Soy el jefe de policía.",
          DE: "Na klar, ich darf alles, ich bin der Chief der Polizei."
        },
        char: Characters.BRODY
    },
    "It's only an island if you look at it from the water.": {
        text: {
          ES: "Sólo es una isla si se la mira desde el mar.",
          DE: "Es ist nur dann eine Insel wenn man es vom Wasser\naus betrachtet."
        },
        char: Characters.BRODY
    },
    "All this machine does is swim and eat and make little sharks,\nand that’s all.": {
        text: {
          ES: "Todo lo que esa máquina hace es comer, nadar y\nprocrear tiburoncitos.",
          DE: "Alles was diese Maschine tut ist schwimmen und fressen\nund immer neue Haie zeugen, das ist alles."
        },
        char: Characters.HOOPER
    },
    "Do not smoke in here!": {
        text: {
          ES: "¡No fume aquí! Muchisimas gracias.",
          DE: "Sie dürfen hier nicht rauchen, danke vielmals!"
        },
        char: Characters.HOOPER
    },
    "That's a 20 footer.": {
        text: {
          ES: "Mide unos siete metros.",
          DE: "Das is'n 6-Meter-Bursche."
        },
        char: Characters.HOOPER
    },
    "Fast fish!": {
        text: {
          ES: "¡Qué rápido es!",
          DE: "Mann, ist das ein Fisch!"
        },
        char: Characters.HOOPER
    },
    "Mary Ellen Moffit. She broke my heart.": {
        text: {
          ES: "Aquí dentro Mary Ellen Moffit me rompió el corazón.",
          DE: "Mary Ellen Moffit. Hat mir's Herz gebrochen."
        },
        char: Characters.HOOPER
    },
    "They caught A shark. Not THE shark.": {
        text: {
          ES: "Han pescado un tiburón. No EL tiburón.",
          DE: "Es wurde EIN Hai gefangen. Nicht DER Hai."
        },
        char: Characters.HOOPER
    },
    "Do you want a pretzel?": {
        text: {
          ES: "¿Quiere una pasta?",
          DE: "Wollen Sie 'ne Brezel?"
        },
        char: Characters.HOOPER
    },
    "I am familiar with the fact that you are going to ignore\nthis problem until it swims up and bites you in the ass.": {
        text: {
          ES: "Lo que comprendo es que seguirá ignorando el problema hasta que\nse meta en el agua y le muerda el culo.",
          DE: "Sie beabsichtigen, dieses spezielle Problem zu ignorieren\nund zwar so lange, bis es Ihnen selbst in den Arsch beißt!"
        },
        char: Characters.HOOPER
    },
    "I’m not going to waste my time arguing with a man who’s lining up\nto be a hot lunch.": {
        text: {
          ES: "No perderé el tiempo discutiendo con un hombre que está\ndispuesto a ser pasto de tiburones.",
          DE: "Ich kann nicht länger mit einem Mann debattieren, der sich\nselbst den Haien zum Lunch anbietet."
        },
        char: Characters.HOOPER
    },
    "You open the beaches on the Fourth of July, it’s is like ringing\nthe dinner bell": {
        text: {
          ES: "Si abres las playas el 4 de julio es como agitar la campanilla\nanunciando la hora de comer.",
          DE: "Wenn Sie die Strände am 4. Juli öffnen, dann ist es so als ob Sie\nfür ihn die Essensglocke läuten."
        },
        char: Characters.BRODY
    }

}

export default class FlavorTextsManager {
    private readonly selectedLang: string = Languages.English
    private readonly random: Phaser.Math.RandomDataGenerator
    private readonly flavorTexts: any[] = []

    constructor(lang: string) {
        this.selectedLang = lang
        this.random = new Phaser.Math.RandomDataGenerator()
        for (let text in FlavorTexts) {
            const toReturn = { text: "", char: FlavorTexts[text]["char"] }
            if (FlavorTexts[text]["text"][this.selectedLang]) {
                toReturn.text = FlavorTexts[text]["text"][this.selectedLang]
            } else {
                toReturn.text = text
            }
            this.flavorTexts.push(toReturn)
        }
    }

    getText(): any {
        return this.random.pick(this.flavorTexts)
    }
}
