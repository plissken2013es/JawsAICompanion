# Acto II en solitario/cooperativo — investigación y opciones

> Fecha: 2026-10-18. Objetivo: ampliar Jaws Companion para que la app haga de **Tiburón en el Acto II** (La Orca), sin reproducir el juego: la gente debe seguir necesitando su copia física.
> Fuentes: manual inglés `UNI_Jaws_60001818_InstLR.pdf` (12 págs.; fuera de git) y foros de BGG (juego 272738) volcados en `reference/bgg/` (fuera de git): **Variants** completo (17 hilos), **Rules** completo (125 hilos) y 11 hilos escogidos de **General**. La sección **Files** de BGG no se pudo leer: Cloudflare pide verificación.

## 1. Qué hace el Tiburón en el Acto II (manual, págs. 7-11)

Cada ronda tiene 6 pasos. El Tiburón decide en tres de ellos, siempre con información oculta:

| Paso | Quién | Decisión del Tiburón |
|---|---|---|
| 1. Opciones | mazo | Se destapan 3 cartas de Resurface (A, B, C): zona de emersión, valor de Evasión, nº de dados de ataque y, a veces, símbolo de "sacudirse" (*Shake Off*) |
| 2. El Tiburón elige | **Tiburón** | **Elige en secreto A, B o C** (ficha grande boca abajo) y, si quiere, **juega una carta de Habilidad** boca abajo |
| 3. La tripulación se prepara | tripulación | Mueve (hasta 2), elige 1 arma, coloca su diana. Si juega **Chum**, el Tiburón **revela una de las dos opciones que no eligió** (decisión) |
| 4. El Tiburón se revela | — | Se aplica la Habilidad; *Shake Off* descarta las armas adjuntas |
| 5. La tripulación ataca | tripulación | Dados − Evasión = heridas; las adjuntables se enganchan sin tirar |
| 6. El Tiburón ataca | **Tiburón** | **Ataca un espacio de barco adyacente o a un tripulante en el agua** (su espacio o agua adyacente); después, ataques de bonificación de 1 dado a cada tripulante en el agua cercano |

Fin: gana el Tiburón si elimina a los 3 tripulantes o destruye las 8 piezas de la Orca; gana la tripulación si elimina al Tiburón.
Material: 16 cartas de Habilidad, 16 de Resurface, 22 de Equipo (6 personales + 16 comunes), 8 losetas de barco, 3 dados.
Del Acto I al II: el marcador de bañistas comidos fija cuántas cartas de Habilidad recibe el Tiburón y cuántas de Equipo la tripulación (ej.: 7 comidos → 8 y 5). **Acto II suelto: 6 de Habilidad y 7 de Equipo** (pág. 12).

## 2. Lo que dicen los foros

### 2.1 Aclaraciones del diseñador (FilmWise, diseñador principal, Prospero Hall)
Son canon para la IA; el FAQ que anunció no llegó a publicarse como hilo.
- **Cada zona sigue siendo un espacio aparte** aunque su loseta se destruya: con el barco hundido habría 8 espacios de agua, no uno grande (hilos 2229437, 2241185).
- **Las aguas de proa y de popa no son adyacentes** entre sí hasta que las dos piezas de ese extremo estén al menos dañadas (2229532).
- **En el mazo de Resurface hay exactamente 2 cartas por zona**; ninguna zona de esquina da 3 dados (2231479, 2232371).
- *Ramming Speed*: +2 impactos **solo al ataque principal**, no a los de bonificación; además permite moverse a un espacio adyacente después del ataque de la tripulación (2232426, 2373621). Suele guardarse para el final.
- *Second Helping*: el segundo ataque debe ser a un **espacio de barco adyacente**; si se combina con otra carta que limita dados, se tira 1 dado (2230631, 2231476).
- *Maul Again*: vale para un solo ataque, el principal o uno de bonificación (2236208).
- Los tripulantes pueden usar **todas** sus armas desde el agua, a propósito (2228727). Cuesta 1 movimiento saltar al agua y 2 volver a subir (2228838).
- Las armas de un solo uso (y la munición) solo se descartan si se disparan; atacar es siempre opcional (2232426).
- Cada personaje tiene un arma cuerpo a cuerpo personal que nunca pierde (bate, martillo, machete) (2227783).

### 2.2 Reglas que se juegan mal a menudo (hilo 2370787, "Easily Missed Rules")
- Un tripulante cae al agua cuando su pieza se **daña**, no solo cuando se destruye. Jugarlo mal favorece a la tripulación.
- Un tripulante en el agua con arma cuerpo a cuerpo puede atacar su espacio **o un espacio de agua vecino**; el Tiburón también ataca a agua adyacente.
- La pistola permite mover la diana a un espacio adyacente.
- Ataques de varios tripulantes al mismo espacio no se suman: cada uno resta la Evasión por separado.

### 2.3 Equilibrio y estrategia
- La tripulación gana el Acto II la mayoría de las veces, pero **casi todas las partidas acaban muy ajustadas** (encuesta 2248910, hilos 2389128, 2266843). Parte del desequilibrio viene de reglas mal jugadas que favorecen a la tripulación (adyacencia, caída al agua).
- Estrategias del Tiburón: comerse tripulantes del agua antes que el barco; aparecer **fuera de alcance** para esperar mejores cartas; guardar *Ramming Speed* para el final (2266843, 2373621).
- **Bloqueo**: al final de la partida, un Tiburón con poca vida puede escoger siempre la zona lejana y la tripulación no bajar nunca del barco; la partida se para (2304478, 2465472, 2803830, 3301739). Un usuario propone retirar las cartas de Resurface sin barco adyacente (3228546). La IA no debe provocar ese bloqueo.

### 2.4 Modos solitarios caseros existentes
| Modo | Autor | Acto II | Dónde |
|---|---|---|---|
| *Solo Jaws* | catosulla (Tim Korchnoi), 2019 | Ficha A/B/C **al azar**; 1 carta de Habilidad al azar por ronda hasta agotarlas | Hilo 2229798 (completo en el hilo) |
| *JAWS solo – AI Shark* | riddle13 (Don Riddle), 2020 | Ficha **al azar**; las cartas de Habilidad **se ignoran** y se usan como un segundo ataque desde otra opción de Resurface | Hilo 2513739 (completo) y PDF en Files. **El más recomendado en los foros** |
| *Jaws solo guide* v2 | Hyvll (Eric P), 2020 | Borrador centrado en el Acto I | Fichero 196799 (404); texto pegado en el hilo 2229798 |
| *Solo/Co-op Rules* | AllLuck0013, 2020 | **Solo Acto I** (8 cartas de acción impresas) | Google Doc, descargado en `reference/variants/` |
| *Orca Event deck* | The Warp, 2019 | Mazo de eventos para el Acto II (no es solitario) | Prometido en Files (hilo 2264770) |
| *Movie Endings* | CaptainChunk, 2022 | Cartas nuevas temáticas (no es solitario) | Hilo 2952016 |

Todos los modos solitarios del Acto II **eligen al azar**: el Tiburón no decide nada. La única ayuda digital que existe es esta app, y solo cubre el Acto I. En 2022 su autor respondió en BGG que no haría el Acto II porque ya había guías; en **marzo de 2026** otro usuario se quejaba de que la app termina sin avisar de que solo cubre el Acto I (hilo 2536638).

### 2.5 Ficheros de BGG revisados (2026-10-18; en `reference/files/`, fuera de git)
**Nada de esto es oficial salvo el manual.** Sirve como referencia o inspiración, nunca como canon: el canon son el manual, las respuestas de FilmWise y la copia física.

| Fichero | Autor | Qué aporta |
|---|---|---|
| `solo/Der_weisse_Hai_-_Solomodus.pdf` | Dennis Beck (Joellenbecker, el traductor al alemán de esta app), 2022 | ★ **El único solitario del Acto II con un Tiburón que decide.** Para el Acto I remite a esta app. Elige la opción de Resurface por **lotería ponderada**: cada opción empieza con 1 papeleta y suma fichas por 6 criterios (ver abajo); luego se sortea con d6/d8. Prioridad de ataque: 1) tripulante en el agua con menos vida, 2) pieza con más tripulantes, 3) pieza con menos vida. Usa una Habilidad al azar cada ronda y explica cómo jugar cada una. *Chum* descarta una opción al azar. Modo difícil: los ataques de bonificación tiran los dados de la carta, no 1 |
| `solo/Jaws_SOLO.pdf` | Don Riddle, 2020 | Igual que su hilo: Resurface al azar, Habilidades como segundo ataque |
| `solo/Jaws_Solo_Revised_V2.pdf` | Mike Devison, 2024 | Acto II **con reglas cambiadas**: quita *Maul Again* y *Ramming Speed*, fichas A/B/C sacadas de una bolsa, el Tiburón solo ataca en su propio espacio. No sirve de referencia de reglas |
| `solo/Jaws_SOLO_version.pdf` y `LES_DENTS_DE_LA_MER_SOLO.pdf` (EN/FR), 2024 | Familia Remi39/Baird (Tric Trac) | Acto II: ficha al azar y carta de Habilidad al azar; añade una regla casera (las piezas que quedan sueltas se destruyen) |
| `solo/VARIANTE_SOLO_by_Fab.pdf` / `Regle_Solo_Acte_I.pdf` | Fab, 2021 | Sobre todo Acto I; en el II, d6 para la ficha |
| `solo/Robo_Jaws_v3.py` | Anónimo, 2020 | IA del **Acto I** por consola, con "misiones" y estados de ánimo (asustado/hambriento) y "minimisiones" por eventos. **Es la idea de partida de `JawsAI.ts`** según el autor de esta app |
| `ayudas-y-datos/Jaws_SharkAbilities_Francais_French_v1.2.pdf` | Fan francés, 2023 | **Texto de las 8 Habilidades** (traducido; confirmar con las cartas) — ver §2.6 |
| `ayudas-y-datos/Shark_hooper_quint_brody.pdf` | Fan español, 2021 | Tableros de personaje traducidos y Equipo personal (p. ej. *Flare*: mientras está enganchada, al final de cada ronda el Tiburón tira 1 dado y recibe esas heridas) |
| `ayudas-y-datos/reglas_rapidas_tiburon+_faqs_v02.docx` | Fan español, 2023 | Resumen y FAQ en castellano; **terminología de la edición española**: "Habilidad depredadora", "Embestida rápida" (*Ramming Speed*), "Segunda Ración" (*Second Helping*), cartas de "reaparición", "arma adosable", "Alcances" |
| `ayudas-y-datos/ATTACK_EXAMPLES_v1.2.pdf` | Rob Robinson, 2021 | Diagrama de adyacencias de ataque sobre la Orca (2 filas × 4 zonas) |
| `ayudas-y-datos/Jaws_v1.pdf` | Esoteric Order of Gamers, 2021 | Resumen de reglas (sin cartas) |
| `ayudas-y-datos/Jaws_Contents.pdf` | AddictArts, 2020 | Recuento de componentes |
| `añadidos-no-oficiales/act2events.jpg` | The Warp, 2020 | 18 eventos caseros para el Acto II, con fotogramas de la película (no reutilizables). Inspiración: varios piden decisiones al Tiburón |
| `añadidos-no-oficiales/The_Mayor_(Jaws)_UK_-_Unofficial.pdf` | Steely_Dan, 2020 | Quinto jugador para el **Acto I**: el alcalde Vaughn, aliado del Tiburón (reabre playas, añade bañistas, se lleva barriles). Sin relación con el Acto II |
| *Adjacency Checker Tool* (HTML, 2026) | — | **No descargado todavía**; útil para validar nuestra adyacencia |

**Criterios de Dennis Beck** para puntuar cada opción de Resurface (fichas extra = más probabilidad): 1) si dos opciones comparten zona, la que va sola +1; 2) una opción desde la que no se puede atacar nada → las otras +1; 3) por cada tripulante que solo tenga armas cuerpo a cuerpo y no pueda alcanzar esa opción (moviendo 2 y atacando) +1; 4) *Shake Off* → +1 por cada arma enganchada; 5) Evasión: + la diferencia sobre la más baja; 6) dados de ataque: + la diferencia sobre el mínimo. Es, hecho a mano, lo que propone la opción B.

### 2.6 Las 8 Habilidades del Tiburón (traducción francesa no oficial; confirmar con las cartas)
| Habilidad | Efecto |
|---|---|
| *Second Helping* (Segunda Ración) | Tras un ataque al barco, segundo ataque al barco con 2 dados (misma pieza u otra) |
| *Hard Target* | La Evasión del Tiburón es 3 (el Equipo que modifica la Evasión sigue aplicando) |
| *Big Mouth* | Si daña o destruye una pieza, cada tripulante en ella recibe 1 herida |
| *Making Waves* | Si daña o destruye una pieza, todos los tripulantes que estén en el barco caen al agua de su zona |
| *Maul Again* | Tras tirar, puede repetir los dados que elija una vez; el nuevo resultado es definitivo |
| *Extra Strength* | Si daña una pieza, la destruye |
| *Ramming Speed* (Embestida rápida) | Tras el ataque de la tripulación, puede moverse a un agua adyacente; si lo hace, +2 impactos |
| *Domino Effect* | Si daña o destruye una pieza, 2 de daño a una pieza adyacente |

## 3. Opciones para el Acto II

La idea que hace que la app no sustituya al juego es la misma del Acto I: **la aleatoriedad y el material siguen siendo físicos** (mazo de Resurface, losetas, cartas de Equipo, dados, tablero) y la app **solo pone el cerebro y la información oculta del Tiburón**.

### Opción A — "Oráculo" (mínima)
La app no guarda el estado del barco. Cada ronda pregunta solo lo imprescindible:
1. Las 3 cartas de Resurface destapadas (zona + Evasión + dados + *Shake Off*).
2. La app **bloquea su elección en secreto** y, si toca, nombra una carta de Habilidad que el jugador saca de un montón apartado.
3. Botón *Chum*: la app revela una de las opciones no elegidas, la que menos ayude.
4. Revelación y, en el paso 6, la app pregunta qué objetivos tiene a tiro (piezas adyacentes, tripulantes en el agua) y elige uno.

- ✅ Muy poca introducción de datos, rápido de hacer, sin catálogo de losetas.
- ❌ Decide con poca información: no sabe dónde está la tripulación ni qué armas le quedan. Mejor que el azar de los modos caseros, pero no mucho.

### Opción B — "Orca espejo" (recomendada)
La app mantiene **un esquema propio de la Orca** (las 8 zonas, sin el arte del tablero): estado de cada loseta, posición y heridas de cada tripulante, armas públicas que les quedan, heridas y armas adjuntas del Tiburón, y su mano oculta de Habilidades.
- Entrada por ronda: las 3 cartas de Resurface (2 toques cada una si se elige entre las 2 cartas de esa zona), mover las 3 fichas de tripulante en el esquema y anotar las heridas que le hacen al Tiburón. Los dados del Tiburón los puede tirar la app o los jugadores (opción).
- La IA puntúa cada opción: daño esperado que puede hacer (losetas a tiro, tripulantes en el agua, dados), riesgo de recibir (qué tripulantes pueden alcanzar esa zona con cuerpo a cuerpo moviendo 2, quién conserva armas de fuego, Evasión) y valor de guardar Habilidades. **Elige con aleatoriedad ponderada**, no siempre la mejor, para que no sea predecible; la "temperatura" puede servir de nivel de dificultad.
- Regla anti-bloqueo: la IA acepta algo más de riesgo cuanto más tiempo lleve esperando.
- Continuidad: al acabar el Acto I, la app ya sabe cuántos bañistas se comió y cuántas Habilidades y cartas de Equipo toca repartir; botón "Continuar al Acto II". También Acto II suelto (6 y 7 cartas).
- ✅ Un Tiburón que juega de verdad (esperar, morder al que está en el agua, guardar *Ramming Speed*), coherente con lo que ya hace el Acto I.
- ❌ Más trabajo (núcleo puro con tests, catálogo de datos, escenas nuevas) y algo más de introducción de datos por ronda.

### Opción C — Acto II digital completo
La app reparte cartas, tira el mazo de Resurface, lleva el combate. **Descartada**: sustituiría al juego físico, que es justo lo que queremos evitar.

### Qué datos del juego necesita la app (B; A necesita menos)
Solo números y nombres, sin arte ni el texto de las cartas, que se lee en la carta física:
- 16 cartas de **Resurface**: zona, Evasión, dados, *Shake Off*.
- 8 **losetas** de barco: umbrales de daño y destrucción, y su posición fija en la Orca.
- 16 cartas de **Habilidad**: nombre y un modelo de su efecto (la app tiene que saber usarlas).
- 22 cartas de **Equipo**: nombre, tipo (cuerpo a cuerpo, fuego, adjuntable, accesorio) y dados, para que la IA calcule amenazas.

**Inventario completo** (hilo 2632350, "List of Cards for contents inventory check", confirmado por otro usuario con su copia; volcado en `reference/bgg/general/card_list_2632350.txt`):
- **Habilidades del Tiburón (16)**: 8 tipos × 2 copias — *Ramming Speed*, *Hard Target*, *Making Waves*, *Big Mouth*, *Domino Effect*, *Extra Strength*, *Second Helping*, *Maul Again*. La IA solo tiene que modelar **8 efectos**.
- **Equipo personal (6)**: Brody *Baseball Bat* y *Pistol*; Quint *Machete* y *Flare*; Hooper *Hammer* y *Rifle*.
- **Equipo común (16)**: 5 *Ammo*, 3 *Chum*, *Harpoon Gun*, *Pistol*, *Tranq Spear*, *Hook*, *Fishing Pole*, *Canister*, *Fishing Net*, *Shark Cage* (14 cartas distintas en total con las personales).
- **Resurface (16)**: cada una se identifica por su cita de la película (p. ej. "You're gonna need a bigger boat."); el hilo no da sus valores.
- Las reglas de las copias recientes llevan la marca `USe02` (Brody empieza en el espacio 7); el resto de componentes sigue siendo `USe01`.

## 4. Pendiente de confirmar con la copia física (en castellano)
1. Disposición exacta de las 8 zonas de la Orca y los umbrales de cada loseta.
2. Las 16 cartas de Resurface (zona, Evasión, dados, *Shake Off*).
3. Las 16 cartas de Habilidad y las 22 de Equipo: nombres en castellano y en inglés, y efecto.
4. Los ficheros de la sección Files de BGG, que no se pudieron leer (Cloudflare).
