# Acto II — diseño de la app y de la IA del Tiburón

> Fecha: 2026-10-18. Opción elegida: **B, "Orca espejo"** (ver `01-investigacion-y-opciones.md` §3). Datos del juego: `02-catalogo.md`.
> Este documento es el diseño; las decisiones abiertas están marcadas **[D-n]** (§10) y se cierran antes de escribir `SPECS.md`.

## 1. Principios

1. **La app es el cerebro y la memoria oculta del Tiburón; el juego sigue siendo físico.** El mazo de Reaparición, el tablero, las losetas, las cartas de Equipamiento, las fichas y (si se quiere) los dados están en la mesa. Sin la copia física no se puede jugar.
2. **Nada de arte ni de texto de cartas.** La app nombra la carta ("Embestida Rápida") y remite a la carta física; internamente guarda solo números y un modelo del efecto. La Orca se dibuja como un esquema abstracto de 2 × 4 zonas, no con el arte del tablero.
3. **Información oculta de verdad.** La mano de Habilidades, la elección de Reaparición y su razonamiento viven solo en la app hasta que el juego dice que se revelan. Pensado para jugar en solitario: el jugador nunca debe poder ver algo que la tripulación no sabría.
4. **Poca introducción de datos.** Objetivo: **≤ 10 toques por ronda** en una ronda normal.
5. **Un Tiburón que juega bien, no uno que hace trampas.** Decide solo con lo que sabría un jugador humano (posiciones y equipo públicos de la tripulación, cartas destapadas, su propia mano). Nunca mira el mazo.
6. **Núcleo puro y reproducible** (regla de oro del laboratorio): `src/act2/core/` sin Phaser ni DOM, con RNG sembrable (mulberry32) y tests de Vitest antes de tocar escenas.

## 2. Partida y ronda vistas desde la app

### 2.1 Preparación
- **Desde el Acto I**: la app ya sabe cuántos bañistas se comió el Tiburón y aplica la tabla (p. ej. 7 → 8 Habilidades y 5 de Equipamiento). Botón nuevo en `FinalOptions`: "Continuar al Acto II".
- **Acto II suelto**: 6 Habilidades y 7 de Equipamiento (manual), o elegir "bañistas comidos" de 0 a 9 como nivel de dificultad (idea de Dennis Beck) **[D-6]**.
- **Mano del Tiburón**: la app saca al azar N cartas de las 16 (8 tipos × 2) **sin decir cuáles**. Las cartas físicas se quedan en su mazo; cuando la app juega una, el jugador busca esa carta en el mazo para leerla y dejarla a la vista. Así el jugador nunca ve la mano **[D-5]**.
- **Equipamiento de la tripulación**: se reparte físicamente, como en el juego. El jugador marca en la app qué cartas comunes tiene cada tripulante (lista de 10 tipos con contador); las personales se ponen solas.
- **Posiciones iniciales**: el jugador coloca a Brody, Quint y Hooper en espacios de barco y lo refleja tocando el esquema de la Orca.

### 2.2 Ronda (los 6 pasos del manual)
| Paso | Mesa | App | Toques |
|---|---|---|---|
| 1. Posibles zonas | Se destapan 3 cartas de Reaparición | El jugador indica las 3 cartas: toca la zona en el esquema y, de las 2 cartas de esa zona, la correcta (Evasión/dados/sacude a la vista, cita como confirmación) | 6 |
| 2. El Tiburón escoge | Se pone la ficha grande boca abajo | **Decide en secreto** opción y, si quiere, Habilidad. Muestra "Decidido" y si ha jugado carta boca abajo (eso sí es público) | 1 |
| 3. La tripulación se prepara | Mover, elegir arma, Fichas de Blanco | Botón **Carnada**: la app revela una de las opciones no elegidas. Al terminar, el jugador actualiza las posiciones que hayan cambiado | 0-3 |
| 4. El Tiburón se muestra | Se revela | La app revela opción y Habilidad (nombre + "lee tu carta"). Si sacude, recuerda retirar las armas adheridas | 1 |
| 5. La tripulación ataca | Se tira y se resuelve | El jugador anota las Heridas al Tiburón, las armas que se adhieren y las que se gastan (solo cambios). Si jugó *Embestida Rápida*, la app decide si se mueve | 1-4 |
| 6. El Tiburón ataca | — | La app **elige objetivo**, tira o pide los dados **[D-1]**, decide repeticiones (*Ataque Bifásico*), aplica daños y dice qué hacer en la mesa ("Daña la pieza 3; Quint cae al agua"). Pregunta antes de tirar si alguien juega la **Jaula**. Hace los Ataques Extra | 1-2 |
| Fin de ronda | — | *Bengala*: 1 dado de Heridas al Tiburón. Comprueba fin de partida. Guarda | 0 |

Siempre: **deshacer el último paso**, registro de la partida (como el `LogScreen` del Acto I) y guardado automático tras cada paso.

## 3. Modelo de estado (núcleo)
- `Zone = 1..8` (1-4 arriba, 5-8 abajo, de popa a proa). `Tile = { state: 'ok' | 'damaged' | 'gone' }` con umbrales fijos por columna (1|3 y 1 en los extremos; 2|4 y 2 en el centro).
- `Crew = { id: 'brody' | 'quint' | 'hooper', zone, space: 'boat' | 'water', wounds 0..6, alive, gear: contadores por tipo }`.
- `Shark = { wounds 0..18, hand: AbilityId[], attached: GearId[] }`.
- `ResurfaceCard = { id, zone, evade 1|2, dice 1|2|3, shakeOff }` (las 16 del catálogo), y lo ya visto del mazo (descarte), para estimar qué puede salir.
- `Round = { options: [A, B, C], choice?, playedAbility?, phase }`.
- **Adyacencia**: el modelo validado del *Adjacency Checker* (catálogo §2), como función pura `adjacent(tiles, space) → Space[]`, con tests de las 40 combinaciones validadas y de los casos de FilmWise.
- **Dado**: `P(0) = 1/6, P(1) = 1/2, P(2) = 1/3`. Las distribuciones de "n dados + bonificación − Evasión" se calculan de forma exacta (convolución), no por simulación.

## 4. La IA del Tiburón

### 4.1 Cómo valora el estado
Una función de valor para el Tiburón, en "puntos":
- **Progreso hacia ganar**: piezas de barco (dañada = medio paso, destruida = paso entero; ganar = las 8 destruidas) y tripulantes (heridas con peso creciente cuanto más cerca de morir; un tripulante muerto también quita sus ataques futuros). Se toma el camino más avanzado de los dos, con algo de peso del otro.
- **Riesgo propio**: heridas del Tiburón respecto a 18, con peso creciente cuanto menos vida le queda.
- **Equipo enemigo**: armas de fuego y adheribles que le quedan a la tripulación (amenaza futura).

`U(acción) = Δprogreso − λ · Δriesgo` en valor esperado. **λ** (miedo) es un parámetro de personalidad que sube al bajar la vida.

### 4.2 D1 — Elegir la Reaparición (el corazón)
Para cada opción (zona *z*, Evasión *e*, dados *d*, sacude *s*):
1. **Ataque esperado**: desde el agua de *z*, el mejor objetivo alcanzable (piezas de barco adyacentes; tripulantes en el agua de *z* o adyacentes) con *d* dados contra los umbrales reales, más Ataques Extra. Se usan las posiciones actuales, descontando a los tripulantes que estén en el agua y puedan subir al barco (cuesta los 2 movimientos).
2. **Daño esperado recibido**: qué tripulantes podrían atacar *z*. Con arma de fuego, cualquiera; con la Pistola, también las aguas vecinas de su blanco. Con cuerpo a cuerpo o adherible, solo si moviendo hasta 2 pueden quedar en *z* o junto a su agua. Daño exacto de su mejor arma contra la Evasión *e* (Martillo con Evasión 0, Bate con repetición, etc.) y valor de lo que podrían adherirle.
3. **Sacudirse**: si *s*, valor de librarse de lo que lleve adherido (sobre todo *Bengala*: ≈ 7/6 heridas por ronda).
4. **La tripulación también adivina.** No basta con "dónde me pueden atacar": la tripulación pone sus Fichas de Blanco **antes** de saber la elección. Se modela como un juego: el Tiburón elige con una **estrategia mixta** (probabilidades sobre A, B y C) y la tripulación, como equipo, reparte sus blancos (hasta 3³ = 27 combinaciones) para hacer el máximo daño esperado contra esa mezcla. Unas pocas iteraciones de respuesta óptima (*fictitious play*) dan una mezcla en la que a la tripulación no le basta con adivinar lo obvio.
5. **Elección final**: se sortea con esas probabilidades (con un suelo mínimo por opción para no ser nunca 100 % predecible). La **temperatura** de la mezcla es el nivel de dificultad **[D-3]**.
6. **Anti-bloqueo** (foros: hilos 2304478, 2465472, 2803830): esperar fuera de alcance es legal y a veces lo mejor, pero cada ronda seguida sin poder atacar baja el peso del riesgo, para que la partida no se atasque **[D-4]**.

Es la idea de los seis criterios de Dennis Beck (Evasión, dados, alcance de la tripulación, sacudirse, opciones duplicadas, opciones inútiles), calculada de verdad en lugar de con fichas.

### 4.3 D2 — Jugar o guardar una Habilidad (paso 2)
Para la opción elegida, valor esperado de cada Habilidad de la mano **ahora** frente a **guardarla**:
| Habilidad | Cuándo vale más |
|---|---|
| Blanco Difícil (Evasión 3) | Mucho riesgo esperado y Evasión baja en la opción |
| Embestida Rápida (+2, moverse tras el ataque) | Opción segura pero lejos de objetivos; final de partida con poco barco (foros: "guárdala para el final") |
| Segunda Ración (2.º ataque al barco con 2 dados) | Hay piezas de barco al alcance |
| Ataque Bifásico (repetir dados) | Muchos dados o umbrales altos (piezas centrales intactas) |
| Fuerza Brutal (dañar = destruir) | Pieza intacta al alcance, sobre todo central (2\|4) |
| Fuerte Oleaje (todos al agua) | Tripulación repartida por el barco: los tira al agua y abre Ataques Extra |
| Gran Mordida (1 herida a quien esté en la pieza) | Tripulantes en la pieza objetivo |
| Efecto Dominó (2 Alcances a una pieza adyacente) | Piezas vecinas frágiles (extremos, o ya dañadas) |

Regla de uso: se juega si la ganancia supera un umbral que **baja cuanto más grande es la mano** y cuanto más cerca está el final (no morirse con cartas sin usar). Las cartas se juegan boca abajo **antes** de que la tripulación se mueva, así que la estimación usa posiciones previas.

### 4.4 D3 — Responder a la Carnada
De las dos opciones no elegidas, revela la que **menos** ayude a la tripulación: conserva oculta la que parezca más creíble como elección del Tiburón. Si hay duplicados de zona, revela el duplicado (FilmWise, hilo 2231479).

### 4.5 D4 — Moverse con Embestida Rápida (tras el ataque de la tripulación)
Ya conoce las posiciones reales: compara quedarse con moverse a cada agua adyacente (+2 Alcances) y elige el mejor ataque resultante.

### 4.6 D5 — Ataque (paso 6)
- **Objetivo**: maximiza `U` con las posiciones reales. Descuenta a quien pueda jugar la **Jaula** (si a la tripulación le queda alguna).
- **Ataque Bifásico**: decide qué dados repetir enumerando los subconjuntos (≤ 2³) y eligiendo el de mayor valor esperado.
- **Segunda Ración y Efecto Dominó**: segundo objetivo con el mismo criterio. **Ataques Extra**: automáticos (1 dado a cada tripulante en el agua de su espacio o adyacente).
- Aclaraciones de FilmWise que se cumplen: *Embestida Rápida* no suma a los Ataques Extra; *Ataque Bifásico*, un solo ataque.

## 5. Niveles de dificultad [D-3]
- **Fácil**: mezcla con mucha temperatura (más azar), juega las Habilidades sin cálculo de "guardar" y no anticipa la Jaula.
- **Normal**: el diseño de arriba.
- **Difícil**: temperatura baja y λ menor (más agresivo).
- **Variante no oficial**, opcional y marcada como tal: Ataques Extra con los dados de la carta (modo difícil de Dennis Beck).

Los foros dicen que la tripulación suele ganar el Acto II y que las partidas acaban ajustadas: el objetivo de "Normal" es una tasa de victoria del Tiburón alrededor del 40-50 % contra una tripulación razonable, medida con el simulador (§6).

## 6. Validación
- **Tests del motor** (Vitest): adyacencia (las 40 combinaciones validadas + proa/popa de FilmWise), daños y umbrales, efectos de las 8 Habilidades y del Equipamiento, distribuciones exactas de dados, fin de partida.
- **Tests de decisiones**: escenarios con respuesta esperada (p. ej. con un tripulante a 1 de vida en el agua al alcance, lo ataca; con Bengala adherida y una opción que sacude, esa opción sube; nunca elige una opción imposible).
- **Simulador por consola** (`npm run sim:act2`, como en `34_W1815` y `40_Scavenger`): tripulación-bot (respuesta óptima con información pública) contra la IA, miles de partidas con semillas → tasa de victoria, duración, rondas sin ataque (bloqueo), uso de cada Habilidad. Sirve para ajustar λ, temperatura y umbrales.
- **Partidas reales** del autor con la copia física, que mandan sobre el simulador.

## 7. Integración en la app
- Escenas nuevas: `Act2Setup`, `Act2Round` (máquina de pasos) y `Act2End`; esquema de la Orca como objeto reutilizable para entrada (tocar zonas y fichas) y salida (qué ha pasado).
- Botones nuevos: "Continuar al Acto II" en `FinalOptions` y "Jugar solo el Acto II" al empezar.
- Textos por `LocaleManager`. Nombres de cartas en **castellano oficial** e **inglés original** desde el principio; alemán y ruso necesitan traductor (¿Dennis Beck otra vez para el alemán?) **[D-8]**.
- Guardado en `LocalStorage` separado del Acto I, con versión de formato.
- Versión **7.0.0** (Android y web por `JawsDist`).

## 8. Construcción por hitos (TDD, proceso ligero del laboratorio)
| Hito | Contenido | Hecho cuando |
|---|---|---|
| M0 | `SPECS.md` del Acto II con el canon cerrado (manual, FilmWise, catálogo) y las [D-n] decididas | Revisado por el autor |
| M1 | Motor de reglas puro: tipos, adyacencia, daños, Habilidades, Equipamiento, dados exactos | Tests verdes, cobertura alta del núcleo |
| M2 | IA: D1-D5 | Tests de escenarios verdes |
| M3 | Simulador + tripulación-bot + ajuste | Tasa de victoria y bloqueos dentro de objetivo |
| M4 | Escenas, entrada de datos, guardado, deshacer | Una partida completa jugable en el navegador |
| M5 | Enlace con el Acto I, idiomas, publicación 7.0.0 | Probado en emulador y móvil real; subido |

## 9. Lo que la app no hará
- No barajará ni sacará cartas de Reaparición: salen del mazo físico.
- No mostrará el texto de las cartas ni el arte del juego.
- No jugará por la tripulación.
- No incluirá añadidos caseros (eventos del Acto II, el Alcalde) salvo la variante opcional del §5.

## 10. Decisiones abiertas
| # | Pregunta | Propuesta |
|---|---|---|
| D-1 | ¿Los dados del Tiburón los tira la app o la mesa? | Elegible en ajustes; por defecto **la mesa** (más físico). Con dados físicos, el jugador marca el resultado de cada dado (0/1/2) y la app decide igual las repeticiones |
| D-2 | ¿Cuánto Equipamiento hay que llevar al día? | Solo **cambios** tras el paso 5 (gastado, adherido, roto). Si no se actualiza, la IA asume que la tripulación aún lo tiene (peor caso para el Tiburón) |
| D-3 | Niveles | Fácil / Normal / Difícil + variante no oficial opcional |
| D-4 | Anti-bloqueo | Activado, suave (el Tiburón arriesga más tras rondas sin atacar) |
| D-5 | Mano de Habilidades | Virtual en la app; la carta física se busca al jugarla |
| D-6 | Acto II suelto | 6/7 del manual por defecto; selector de "bañistas comidos" 0-9 como dificultad |
| D-7 | Versión | 7.0.0 |
| D-8 | Idiomas del Acto II | Castellano e inglés al publicar; alemán y ruso cuando haya traductor |
