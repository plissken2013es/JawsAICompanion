# BLUEPRINT — Acto II (La Orca) en Jaws Companion

**Fecha:** 2026-10-18
**Referencia:** `SPECS.md` (misma carpeta), `02-catalogo.md`, `03-diseno-ia.md`
**Rama:** `acto2`
**Objetivo:** serie de prompts para construir el Acto II de forma incremental con TDD: rojo → verde → commit.

---

## Restricciones del proyecto (comprobadas el 2026-10-18)
- **TypeScript 3.8.3**: nada de sintaxis posterior (tipos de plantilla, tuplas etiquetadas, `satisfies`, `override`…). Sí valen `?.`, `??`, `import type`, `as const`, `readonly`.
- **El proyecto no pasa `tsc` hoy** (errores antiguos del Acto I). El Acto II tiene su propio `tsconfig.act2.json` **estricto** (`strict`, `noImplicitAny: true`) solo para `src/act2/core/` y `tests/act2/`, y el script `npm run typecheck:act2`. No se arreglan errores del Acto I en esta rama.
- **ESLint 6** + `@typescript-eslint` 2: regla `no-restricted-properties`/`no-restricted-globals` para `Math.random` y `Date` en `src/act2/core/` (override por ruta en `.eslintrc.js`).
- **Vitest 4** con `tests/**/*.test.ts` y `tests/setup/phaser.stub.ts`: los tests del núcleo **no** importan Phaser.
- Textos nuevos solo por `LocaleManager`. Nombres de cartas en castellano oficial e inglés original (`02-catalogo.md`).
- Nunca entra en git nada de `reference/`.

## Proceso de iteración
- **Iteración 1 — bloques del SPECS**: motor (M1) → IA (M2) → simulador (M3) → interfaz (M4) → publicación (M5).
- **Iteración 2 — saltos de complejidad**: la resolución de ataques (tripulación, Tiburón, Habilidades) se separa del bucle de ronda; la decisión de Reaparición se separa de sus ingredientes (amenaza, ataque esperado) para poder probar cada pieza.
- **Iteración 3 — granularidad final (28 prompts)**. Criterios: cada prompt deja código que compila, tests en verde y un consumidor; el núcleo no conoce Phaser; **MVP jugable en el navegador en P-24**.

## Mapa de dependencias
```
M1 motor        P-01 andamiaje + RNG
                 └─ P-02 tipos + datos del catálogo
                     ├─ P-03 adyacencia
                     ├─ P-04 dados exactos
                     └─ P-05 estado + preparación + serialización
                         └─ P-06 movimiento y alcance de la tripulación
                             └─ P-07 ataque de la tripulación (armas)
                                 └─ P-08 ataque del Tiburón (barco, tripulantes, Jaula, extras)
                                     └─ P-09 Habilidades
                                         └─ P-10 ronda completa (máquina de pasos) + finales
M2 IA                                        └─ P-11 valoración V(estado)
                                                 ├─ P-12 amenaza por opción
                                                 └─ P-13 ataque esperado por opción
                                                     └─ P-14 D1 Reaparición (juego de adivinar)
                                                         └─ P-15 D2 Habilidad
                                                             └─ P-16 D3 Carnada + D4 Embestida
                                                                 └─ P-17 D5 ataque y repeticiones
                                                                     └─ P-18 fachada SharkBrain + niveles
M3 simulador                                                             └─ P-19 tripulación-bot + partida completa
                                                                             └─ P-20 CLI sim:act2 + ajuste
M4 interfaz                                                                      └─ P-21 esquema de la Orca (Phaser)
                                                                                     └─ P-22 Act2Setup
                                                                                         └─ P-23 Act2Round pasos 1-4
                                                                                             └─ P-24 Act2Round pasos 5-7 ← MVP
                                                                                                 └─ P-25 Act2End, ajustes, accesos
M5 publicación                                                                                       └─ P-26 idiomas
                                                                                                         └─ P-27 partidas reales + humo e2e
                                                                                                             └─ P-28 7.0.0
```

---

## Prompts

Formato de cada prompt: **Objetivo** · **Ficheros** · **Tests primero (rojo)** · **Implementación** · **Hecho cuando**. Al terminar cada uno: `npm test`, `npm run typecheck:act2`, `npm run lint` y commit en `acto2`.

### M1 — Motor de reglas (`src/act2/core/`)

#### P-01 — Andamiaje y RNG
- **Objetivo**: carpeta del Acto II lista para TDD estricto.
- **Ficheros**: `src/act2/core/rng.ts`, `tsconfig.act2.json`, `.eslintrc.js` (override), `package.json` (scripts `typecheck:act2`, más adelante `sim:act2`), `tests/act2/rng.test.ts`.
- **Tests primero**: `mulberry32(seed)` es determinista (misma semilla, misma secuencia), devuelve `[0,1)`, `int(a,b)` cubre los extremos, `shuffle` es una permutación y reproducible.
- **Implementación**: `createRng(seed)` → `{ next, int, pick, shuffle }`. Override de ESLint: en `src/act2/core/**` prohibidos `Math.random` y `Date`.
- **Hecho cuando**: tests verdes; `typecheck:act2` limpio; `lint` falla si se mete `Math.random` en el núcleo (comprobado a mano y revertido).

#### P-02 — Tipos y datos del catálogo
- **Ficheros**: `types.ts`, `data.ts`, `tests/act2/data.test.ts`.
- **Tests primero** (integridad, SPECS §2): 16 cartas de Reaparición, **2 por zona**, en cada zona una de Evasión 1 y otra de 2, ninguna esquina con 3 dados, exactamente 4 que sacuden y todas en zonas 2/3/6/7; 16 Habilidades = 8 × 2; 6 personales + 16 comunes (5 Munición, 3 Carnada); umbrales por columna; dado `[0,1,1,1,2,2]`; vidas 6 y 18; tabla de reparto `b+1` / `12−b` y el ejemplo del manual (7 → 8 y 5).
- **Implementación**: tipos `Zone`, `TileState`, `Space`, `ResurfaceCard`, `AbilityId`, `GearId`, `CrewId`; datos tal cual del catálogo, con nombres ES/EN como claves de `LocaleManager` (no texto en el núcleo).

#### P-03 — Adyacencia
- **Ficheros**: `adjacency.ts`, `tests/act2/adjacency.test.ts`.
- **Tests primero**: tabla de las **40 combinaciones** validadas (pares de zonas vecinas × intacta/dañada → qué pares barco/agua son adyacentes); proa/popa: aguas 4-8 y 1-5 no adyacentes con alguna intacta y sí con las dos dañadas o destruidas [FW 2229532]; zona destruida = un agua no fusionada [FW 2241185]; simetría para todos los estados; nada en diagonal.
- **Implementación**: port del modelo del *Adjacency Checker* (`02-catalogo.md` §2) como función pura `adjacent(tiles, space)`.

#### P-04 — Dados exactos
- **Ficheros**: `dice.ts`, `tests/act2/dice.test.ts`.
- **Tests primero**: distribución de 1, 2 y 3 dados (suma 1, media `n · 7/6`); con Caña de Pescar (2 → 1); `woundsDist(n, bonus, evade)`; probabilidad de alcanzar un umbral; `P(Martillo hiere)` = 5/6 con Evasión 0.
- **Implementación**: convolución exacta con fracciones o enteros sobre 6ⁿ; nada de simulación.

#### P-05 — Estado, preparación y serialización
- **Ficheros**: `state.ts`, `setup.ts`, `tests/act2/state.test.ts`.
- **Tests primero**: preparación desde bañistas comidos (0-9) y suelta (6/7); mano oculta de N Habilidades sacada con el RNG del mazo de 16; personales automáticas; posiciones iniciales solo en barco; serializar → deserializar da el mismo estado; versión de formato.
- **Implementación**: estado inmutable (funciones que devuelven estado nuevo); `GameState` con `tiles`, `crew`, `shark`, `round`, `resurfaceDiscard`, `log`.

#### P-06 — Movimiento y alcance de la tripulación
- **Ficheros**: `movement.ts`, `tests/act2/movement.test.ts`.
- **Tests primero**: hasta 2 espacios; barco→agua cuesta 1; agua→barco cuesta los 2 [FW 2228838]; a través de zonas destruidas; `reachableTargets(crew, weapon)` (cuerpo a cuerpo/adherible: su espacio o adyacentes al agua objetivo tras mover; fuego: todas las aguas; Pistola: + aguas adyacentes al blanco).

#### P-07 — Ataque de la tripulación
- **Ficheros**: `crewAttack.ts`, `tests/act2/crewAttack.test.ts`.
- **Tests primero** (SPECS §3.3.5): `max(0, Alcances + bonif − Evasión)`; Evasión efectiva (Blanco Difícil = 3, Red −1 después, Martillo 0); ataques que no se suman; Bate repite si no hiere; Gancho se rompe con ≥ 4 Alcances y hiere igual; Arpón Tranquilizante marca "1 dado" si hiere y se descarta; Pistola/Rifle gastan Munición o el arma; Fusil de Pesca se descarta; Bombona explota (+3) con Pistola o Rifle; adheribles sin tirada; no atacar no descarta nada [FW 2232426].
- **Implementación**: la tirada llega como entrada (caras de cada dado), para poder usar dados físicos.

#### P-08 — Ataque del Tiburón
- **Ficheros**: `sharkAttack.ts`, `tests/act2/sharkAttack.test.ts`.
- **Tests primero**: objetivos legales (pieza adyacente a su agua o tripulante en agua propia o adyacente, nunca en barco); umbrales intacta/dañada; caída al agua al **dañar** y al destruir; Heridas a tripulantes; Jaula anula todas las Heridas de la ronda; Caña de Pescar; Arpón Tranquilizante (1 dado); Ataques Extra (1 dado a cada tripulante en el agua cercano; variante: dados de la carta); eliminación a 6 Heridas.

#### P-09 — Habilidades
- **Ficheros**: `abilities.ts`, `tests/act2/abilities.test.ts`.
- **Tests primero**, una por carta y con las aclaraciones de FilmWise: Fuerza Brutal (dañar → destruir); Gran Mordida; Fuerte Oleaje; Efecto Dominó (2 Alcances a pieza adyacente); Segunda Ración (2.º ataque al barco con 2 dados, 1 con Arpón [FW 2231476], pieza adyacente [FW 2230631]); Ataque Bifásico (repite los dados elegidos, un solo ataque [FW 2236208]); Blanco Difícil; Embestida Rápida (moverse a agua adyacente, +2 solo al principal [FW 2232426]); la Habilidad sale de la partida al final de la ronda.

#### P-10 — Ronda completa y finales
- **Ficheros**: `round.ts`, `tests/act2/round.test.ts`.
- **Tests primero**: máquina de pasos 1-7 con entradas guionizadas (3 cartas, elección, Carnada, posiciones, ataques, dados); sacudirse descarta todo lo adherido; Bengala al final de ronda; la tripulación gana en el paso 5 antes del ataque del Tiburón; el Tiburón gana por barco o por tripulación; lo adherido sigue si muere su dueño; dos rondas seguidas reproducibles con la misma semilla.
- **Hecho cuando**: una partida guionizada de principio a fin pasa en un test.

### M2 — IA del Tiburón (`src/act2/core/ai/`)

#### P-11 — Valoración
- **Ficheros**: `ai/evaluate.ts`, `tests/act2/ai/evaluate.test.ts`.
- **Tests primero**: monotonía (más losetas dañadas o más Heridas a la tripulación → más V; más Heridas al Tiburón → menos V); rematar vale más que herir a un sano; `λ` crece al bajar la vida.
- **Implementación**: SPECS §4.2 con coeficientes en un objeto `AiParams` (se ajustan en P-20).

#### P-12 — Amenaza por opción
- **Ficheros**: `ai/threat.ts` + tests.
- **Tests primero**: zona fuera del alcance de todos y sin armas de fuego → amenaza 0; con Rifle en la mesa nunca es 0; la Evasión 2 reduce el daño esperado frente a 1; Martillo ignora la Evasión; Blanco Difícil (si se juega) baja la amenaza.

#### P-13 — Ataque esperado por opción
- **Ficheros**: `ai/offense.ts` + tests.
- **Tests primero**: valor 0 si no hay objetivo; un tripulante a 1 Herida en el agua al alcance vale más que una pieza intacta; 3 dados contra pieza de extremo intacta > 1 dado; los tripulantes en el agua que pueden subir al barco cuentan menos.

#### P-14 — D1: Reaparición
- **Ficheros**: `ai/chooseResurface.ts` + tests.
- **Tests primero**: devuelve probabilidades que suman 1 y respetan `p_min`; ante una opción claramente dominante, no la elige siempre; nunca elige una opción sin objetivo si otra lo tiene con riesgo igual o menor; anti-bloqueo (más rondas sin atacar → más probabilidad de las opciones con objetivo); con la misma semilla, misma elección.
- **Implementación**: juego de adivinar con *fictitious play* (≤ 3³ asignaciones de blancos de la tripulación), softmax con `τ`.

#### P-15 — D2: Habilidad
- **Ficheros**: `ai/chooseAbility.ts` + tests.
- **Tests primero**: Fuerza Brutal con pieza central intacta al alcance > guardar; no juega Segunda Ración si no hay barco al alcance; guarda Embestida Rápida en el medio juego y la usa en el final (opción segura lejos del barco); con la mano grande juega más; Blanco Difícil con mucho riesgo.

#### P-16 — D3 Carnada y D4 Embestida
- **Ficheros**: `ai/respondChum.ts`, `ai/rammingMove.ts` + tests.
- **Tests primero**: la Carnada revela el duplicado de zona si lo hay [FW 2231479]; si no, el señuelo menos creíble; Embestida elige el agua adyacente con mejor ataque (o quedarse).

#### P-17 — D5: ataque y repeticiones
- **Ficheros**: `ai/chooseAttack.ts` + tests.
- **Tests primero**: remata al tripulante a 1 Herida; descuenta al que puede usar la Jaula; Ataque Bifásico repite solo dados que mejoran el valor esperado (enumeración ≤ 2³); objetivos de Segunda Ración y Efecto Dominó.

#### P-18 — Fachada `SharkBrain` y niveles
- **Ficheros**: `ai/sharkBrain.ts`, `ai/params.ts` + tests.
- **Tests primero**: una función por paso (`decideResurface`, `decideAbility`, `onChum`, `afterCrewAttacks`, `decideAttack`, `decideRerolls`) que no muta el estado; Fácil/Normal/Difícil cambian `τ`, `p_min`, `λ`, reserva y Jaula según SPECS §4.8; nunca lee el mazo.

### M3 — Simulador

#### P-19 — Tripulación-bot y partida completa
- **Ficheros**: `tools/act2/crewBot.ts`, `tools/act2/runGame.ts` + tests.
- **Tests primero**: el bot solo usa información pública; juega acciones legales; una partida con semilla termina y es reproducible; el mazo de Reaparición y el reparto de Equipamiento se simulan como en la mesa.
- **Implementación**: bot de respuesta razonable (blancos a las opciones más probables según su propio modelo, sube al barco si está herido, usa Carnada y Jaula con criterio).

#### P-20 — CLI `npm run sim:act2` y ajuste
- **Ficheros**: `tools/act2/sim.ts`, `docs/acto2/04-ajuste.md`.
- **Hecho cuando**: ≥ 5.000 partidas por nivel con informe (victorias, rondas, rondas seguidas sin ataque, uso de cada Habilidad, Heridas por fuente); **Normal 40-50 %**; bloqueo ≤ 3 rondas en el 95 %; parámetros finales anotados en `04-ajuste.md`.

### M4 — Interfaz (`src/act2/scenes/`, `src/act2/ui/`)

#### P-21 — Esquema de la Orca
- **Ficheros**: `ui/OrcaSchematic.ts`.
- **Contenido**: cuadrícula 2 × 4 dibujada con gráficos de Phaser (sin arte del juego): estado de cada loseta, fichas de los tres tripulantes (tocar para mover entre barco/agua de una zona), selección de zona, resaltado del Tiburón y del objetivo.
- **Hecho cuando**: escena de prueba en el navegador; sin errores en consola.

#### P-22 — `Act2Setup`
- Desde el Acto I (bañistas comidos) o suelto (6/7 o selector 0-9); marcar Equipamiento común de cada tripulante; colocar a los tres en el barco; nivel y ajustes.

#### P-23 — `Act2Round`, pasos 1-4
- Entrada de las 3 cartas (zona + una de las 2), "El Tiburón ha decidido", aviso de carta boca abajo, botón Carnada, actualización de posiciones, revelación (opción + Habilidad: "busca la carta *X*") y sacudirse.

#### P-24 — `Act2Round`, pasos 5-7 ← **MVP**
- Heridas al Tiburón y cambios de Equipamiento; Embestida; pregunta de Jaula; ataque con dados de mesa (marcar cada dado) o de la app; instrucciones de mesa; Ataques Extra; fin de ronda (Bengala); deshacer; guardado tras cada paso; registro.
- **Hecho cuando**: una partida completa jugable en el navegador con ≤ 10 toques por ronda normal.

#### P-25 — `Act2End`, ajustes y accesos
- Pantalla de final; ajustes (dados mesa/app, nivel, variante no oficial, anti-bloqueo); "Continuar al Acto II" en `FinalOptions` y "Jugar solo el Acto II" al inicio; reanudar partida guardada.

### M5 — Publicación

#### P-26 — Idiomas
- Todas las claves nuevas en ES y EN (nombres oficiales); DE, RU e IT con el inglés de respaldo hasta tener traducción; test de paridad de claves.

#### P-27 — Partidas reales y prueba de humo
- Partidas del autor con la copia física; arreglos; prueba e2e de humo con `playwright-core` (una ronda completa en el navegador, consola limpia) siguiendo las trampas de Phaser 3.90 del `CLAUDE.md` (ver cada animación hasta el final).

#### P-28 — Versión 7.0.0
- `versionCode 70000`, notas ES/EN, `CLAUDE.md` y la ficha del índice del laboratorio al día; AAB firmado; web en `JawsDist` (receta del `CLAUDE.md`); subida a Play.
