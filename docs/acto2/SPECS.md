# SPECS — Acto II (La Orca) en solitario/cooperativo

> Versión 1.0 (2026-10-18). Hito **M0** de `03-diseno-ia.md`.
> **Canon**, por orden de autoridad: (1) la copia física en castellano y el manual (`reference/manual/`); (2) las respuestas de **FilmWise**, diseñador principal (hilos de BGG citados por número); (3) el *Adjacency Checker* validado (`02-catalogo.md` §2). Todo lo demás (variantes, ayudas de fans) es inspiración, nunca canon.
> Cada regla lleva su fuente entre corchetes: `[M p.N]` manual, `[FW nnnnnnn]` FilmWise en ese hilo, `[C]` copia física/catálogo, `[AC]` Adjacency Checker, `[D-n]` decisión de diseño.

## 0. Decisiones cerradas
| # | Decisión |
|---|---|
| D-1 | Dados del Tiburón: **por defecto en la mesa**; ajuste para que los tire la app. Con dados físicos, el jugador marca cada dado (0/1/2) y la app decide igual las repeticiones |
| D-2 | Equipamiento: se marca al empezar y después **solo los cambios** tras el paso 5. Si no se anota, la IA asume que la tripulación aún lo tiene |
| D-3 | **Un único nivel: el Tiburón más fuerte medido** (revisado el 2026-10-19 tras el simulador: aun en su mejor versión pierde la mayoría de partidas del Acto II suelto, así que un nivel más flojo no sirve a nadie). La dificultad la dan los bañistas comidos en el Acto I (o el selector 0-9) y la variante **no oficial** opcional: Ataques Extra con los dados de la carta |
| D-4 | Anti-bloqueo **activado** (suave), desactivable en ajustes |
| D-5 | Mano de Habilidades **virtual**: la app no dice qué cartas tiene; la carta física se busca al jugarla |
| D-6 | Acto II suelto: 6 Habilidades y 7 de Equipamiento por defecto; opción de elegir "bañistas comidos" 0-9 |
| D-7 | Versión **7.0.0** |
| D-8 | Idiomas del Acto II: castellano e inglés al publicar; alemán, ruso (y el italiano que está entrando para el Acto I) cuando haya traducción |

## 1. Alcance
- La app **hace de Tiburón** en el Acto II: decide en secreto, guarda su mano oculta y aplica las consecuencias de sus ataques. La tripulación (1-3 personas) juega con la copia física.
- Entrada: continuación del Acto I de la app (bañistas comidos conocidos) o Acto II suelto.
- Fuera de alcance: barajar o robar cartas de Reaparición o Equipamiento (son físicas), mostrar arte o texto completo de cartas, jugar por la tripulación, añadidos caseros (salvo la variante de D-3).

## 2. Componentes y datos
Los datos exactos están en `02-catalogo.md` y se codifican tal cual en `src/act2/core/data.ts`:
- **Zonas** `1..8`: 1-4 fila de arriba, 5-8 fila de abajo, de popa (1/5) a proa (4/8) [AC].
- **Losetas**: columnas 1 y 4 → intacta `1|3`, dañada `1`; columnas 2 y 3 → intacta `2|4`, dañada `2` [C].
- **Reaparición**: 16 cartas, 2 por zona, con `evade ∈ {1,2}`, `dice ∈ {1,2,3}`, `shakeOff` [C]. Identificador `R01..R16` en el orden del catálogo.
- **Habilidades**: 8 tipos × 2 [C]: `rammingSpeed, secondHelping, maulAgain, hardTarget, bigMouth, makingWaves, dominoEffect, extraStrength`.
- **Equipamiento** [C]: personal `bat (Brody), pistol (Brody), machete (Quint), flare (Quint), hammer (Hooper), rifle (Hooper)`; común `ammo ×5, chum ×3, sharkCage, pistol, harpoonGun, hook, tranqSpear, fishingNet, fishingPole, canister`.
- **Dado**: caras `0, 1, 1, 1, 2, 2` [C].
- **Vida**: tripulante eliminado con 6 Heridas; Tiburón eliminado con 18 [C].
- **Reparto** según bañistas comidos `b` (0-9): Habilidades `b + 1`; Equipamiento común `12 − b` [C]. Suelto: 6 y 7 [M p.12].

## 3. Reglas del motor

### 3.1 Espacios y adyacencia
- Cada zona tiene un Espacio de Barco (si su loseta existe) y un Espacio de Agua. Con la loseta destruida, la zona es un solo Espacio de Agua y **no se fusiona** con otras [FW 2229437, 2241185].
- `adjacent(tiles, space)` implementa exactamente el modelo de `02-catalogo.md` §2 [AC], incluida la excepción de proa/popa: las aguas 1-5 y 4-8 solo son adyacentes si **ninguna** de las dos losetas está intacta [FW 2229532].
- La relación es simétrica; en diagonal nunca hay adyacencia.

### 3.2 Preparación
1. Tiburón: N Habilidades al azar de las 16, ocultas [M p.7; D-5].
2. Tripulación: sus 2 personales + M comunes repartidas como quieran (entrada del jugador) [M p.7].
3. 8 losetas intactas; tripulantes en Espacios de Barco a elección; 0 Heridas todos [M p.7].

### 3.3 Ronda
1. **Opciones** [M p.8]: 3 cartas de Reaparición (entrada) → A, B, C. Puede haber zonas repetidas [M p.12].
2. **El Tiburón escoge** [M p.8]: elige A/B/C en secreto y, opcionalmente, **una** Habilidad boca abajo (es público que ha jugado una).
3. **La tripulación se prepara** [M p.8-9]: cada tripulante mueve hasta 2 espacios adyacentes; pasar de agua a barco consume los 2 movimientos [FW 2228838]; elige un arma; coloca su Ficha de Blanco en un Espacio de Agua. Cuerpo a cuerpo y adherible: en ese espacio o adyacente a él. Fuego: cualquiera.
   - **Carnada** (máx. 1 por ronda): el Tiburón revela una de las dos opciones que no eligió [M p.9].
4. **El Tiburón se muestra** [M p.9]: se revela la elección; se descartan las otras dos cartas; Tiburón al agua de esa zona; si la carta sacude, se descartan **todas** las armas adheridas (salen de la partida) [FW 2227783]; se revela la Habilidad y entra en vigor.
   - **Pistola**: tras revelarse, puede mover su Ficha de Blanco a un agua adyacente [C].
5. **La tripulación ataca** [M p.10], en el orden que quiera; solo quien acertó la zona; atacar es opcional y lo no usado no se descarta [FW 2232426]:
   - Cuerpo a cuerpo o fuego: `heridas = max(0, Alcances + bonif − Evasión)`. Varios atacantes no suman sus tiradas [hilo 2370787].
   - Adherible: se engancha sin tirar.
   - Evasión efectiva: la de la carta; `hardTarget` la fija en 3; `fishingNet` adherida resta 1 (tras `hardTarget`); el Martillo la hace 0 para su ataque [C].
   - Efectos de arma: Bate (si no hiere, repite los 2 dados una vez); Gancho (si los dados dan ≥ 4 Alcances, hiere igual y se rompe); Arpón Tranquilizante (si hiere, el Tiburón tira 1 dado en sus ataques esta ronda; se descarta tras atacar); Pistola y Rifle (tras disparar, descartar 1 Munición o el arma); Fusil de Pesca (se descarta tras disparar); Bombona adherida (si un ataque con Pistola o Rifle hiere, explota: +3 Heridas y se descarta) [C].
   - Tras los ataques, **Embestida Rápida** (si se jugó): el Tiburón puede moverse a un agua adyacente a la suya [C].
6. **El Tiburón ataca** [M p.10-11]: o una **pieza de barco adyacente** a su agua, o un **tripulante en el agua** de su espacio o adyacente (nunca a uno en el barco).
   - Dados = los de la carta (`tranqSpear` acertado → 1). Alcances = suma de caras (`fishingPole` adherida → las caras de 2 cuentan 1). `rammingSpeed` usada → +2 al ataque principal, no a los extra [FW 2232426].
   - Barco: intacta con `≥ menor` → dañada, con `≥ mayor` → destruida; dañada con `≥ su número` → destruida. Quien estuviera en esa pieza cae al agua de su zona [M p.10] (también si solo se daña [hilo 2370787]).
   - Tripulante: 1 Herida por Alcance.
   - **Jaula**: un tripulante puede jugarla antes de la tirada; no recibe Heridas esta ronda (de ningún ataque) [C].
   - Habilidades al resolver: `extraStrength` (dañar → destruir), `bigMouth` (1 Herida a cada tripulante que estaba en la pieza), `makingWaves` (todos los tripulantes en barco caen al agua de su zona), `dominoEffect` (2 Alcances a una pieza adyacente a la atacada), `secondHelping` (tras un ataque al barco, otro al barco con 2 dados —1 si `tranqSpear`— a una pieza adyacente, la misma u otra) [C, FW 2230631, 2231476], `maulAgain` (tras tirar, repetir los dados elegidos una vez, en un solo ataque: principal o extra) [C, FW 2236208].
   - **Ataques Extra**: 1 dado contra cada tripulante en el agua de su espacio o adyacente [M p.11] (variante D-3: los dados de la carta).
7. **Fin de ronda** [M p.11]: `flare` adherida → el Tiburón tira 1 dado y recibe esas Heridas [C]; la Habilidad jugada sale de la partida; la carta elegida al descarte; si el mazo se agota, se baraja el descarte (en la mesa).

### 3.4 Eliminaciones y final
- Tripulante con 6 Heridas: sale del tablero; su Equipamiento se descarta; lo que tuviera adherido al Tiburón sigue [M p.11; hilo 2370787].
- **Gana el Tiburón** si los 3 tripulantes están eliminados o las 8 losetas destruidas; **gana la tripulación** si el Tiburón llega a 18 Heridas [M p.11]. Se comprueba en cuanto ocurre (la tripulación puede ganar en el paso 5 antes de que el Tiburón ataque).

## 4. IA del Tiburón

### 4.1 Información
Solo la pública y la propia: estado de losetas, posiciones y Heridas de la tripulación, Equipamiento declarado (D-2), lo adherido, su mano, las 3 opciones y el descarte de Reaparición. Nunca el orden del mazo.

### 4.2 Valoración
`V(estado)` para el Tiburón = `max(progBarco, progTrip) + 0,25 · min(progBarco, progTrip) − λ(h) · riesgo − amenaza`, donde:
- `progBarco` = Σ losetas (dañada 0,5; destruida 1) / 8.
- `progTrip` = Σ tripulantes `f(heridas/6)` / 3, con `f` convexa (rematar vale más) y eliminado = 1.
- `riesgo` = `g(heridas del Tiburón / 18)`, convexa.
- `amenaza` = valor del arsenal de fuego y adherible que le queda a la tripulación.
- `λ(h)` crece al bajar la vida. Los coeficientes iniciales se fijan en M2 y se ajustan con el simulador (M3).

### 4.3 D1 — Reaparición
1. Para cada opción *o* y cada tripulante *c*: zonas que *c* puede atacar (fuego: todas; Pistola: blanco y aguas adyacentes; cuerpo a cuerpo y adherible: las que alcanza moviendo ≤ 2 con la regla agua→barco) y su daño esperado exacto con su mejor arma contra la Evasión de *o*.
2. Valor de ataque esperado desde *o* con las posiciones actuales (descontando a quien pueda subir al barco) y valor de sacudirse.
3. Juego de adivinar: la tripulación reparte sus blancos (≤ 3³ combinaciones) como mejor respuesta a la mezcla del Tiburón; el Tiburón ajusta su mezcla (softmax de su utilidad esperada con temperatura `τ`). 20 iteraciones de *fictitious play*.
4. Suelo: cada opción distinta conserva al menos `p_min` (valor ajustado con el simulador, `04-ajuste.md`). Se sortea con el RNG.
5. Anti-bloqueo (D-4): por cada ronda seguida sin poder atacar nada, `λ ← λ · 0,8` en esta decisión.
6. Restricción: nunca elige una opción sin objetivo posible si otra lo tiene **y** su riesgo no es mayor.

### 4.4 D2 — Habilidad
Para la opción elegida, ganancia esperada de cada carta de la mano frente a no jugar (§3.3 efectos). Se juega la de más ganancia si supera `umbral = base · (1 + rondasEstimadas / tamañoMano)`; *Embestida Rápida* y *Blanco Difícil* llevan un valor de reserva propio (late game / mucho riesgo).

### 4.5 D3 — Carnada
Revela, de las dos opciones no elegidas, la que menor probabilidad tendría según el modelo de la tripulación (conserva el señuelo más creíble). Si una de ellas comparte zona con la elegida, revela esa [FW 2231479].

### 4.6 D4 — Embestida Rápida
Si se jugó, tras los ataques compara quedarse frente a cada agua adyacente (+2) y elige el ataque de mayor `ΔV`.

### 4.7 D5 — Ataque
- Objetivo de mayor `ΔV` esperado, descontando objetivos que puedan usar la Jaula (si la tripulación la tiene declarada).
- `maulAgain`: subconjunto de dados a repetir que maximiza `ΔV` esperado (enumeración exacta).
- `secondHelping` y `dominoEffect`: segundo objetivo por el mismo criterio.
- Ataques Extra: automáticos.

### 4.8 Nivel (D-3, revisado el 2026-10-19)
Un solo nivel, el más fuerte que ha medido el simulador; valores y mediciones en `04-ajuste.md`. La primera idea (Fácil / Normal / Difícil con τ, `p_min` y λ distintos) se descartó con datos: los niveles apenas se distinguían (Normal 16,9 %, Difícil 17,4 %), una elección más difusa hace al Tiburón *más* difícil de leer, y el objetivo de 40-50 % no es alcanzable en el Acto II suelto con las reglas oficiales. La dificultad real es el reparto inicial (0 bañistas comidos: ~3 %; 9: ~39 %) y la variante no oficial (~45 %).

## 5. Interfaz
- **Escenas**: `Act2Setup` → `Act2Round` (pasos 1-7 de §3.3) → `Act2End`. Accesos: "Continuar al Acto II" en `FinalOptions` y "Jugar solo el Acto II" al inicio.
- **Esquema de la Orca** (2 × 4, sin arte del juego) para: elegir zona de cada carta de Reaparición, mover fichas de tripulantes, mostrar estado de losetas y lo que hace el Tiburón.
- **Entrada por ronda** (objetivo ≤ 10 toques): 3 cartas (zona + 1 de 2), posiciones cambiadas, Heridas al Tiburón, cambios de Equipamiento, Jaula sí/no, dados (si son físicos).
- **Salida**: instrucciones de mesa en frases cortas ("Daña la pieza 3", "Quint cae al agua", "Busca la carta *Gran Mordida* y déjala a la vista").
- Ajustes: dados mesa/app, variante no oficial, anti-bloqueo.
- Deshacer el último paso; guardado tras cada paso (clave propia en `LocalStorage`, con versión); registro de la partida.
- Todos los textos por `LocaleManager`; nombres de cartas en castellano oficial e inglés original [C].

## 6. Arquitectura
```
src/act2/core/   — puro (sin Phaser ni DOM): data.ts, types.ts, adjacency.ts, dice.ts, rules.ts, abilities.ts, gear.ts, ai/*.ts, rng.ts
src/act2/scenes/ — Act2Setup, Act2Round, Act2End
src/act2/ui/     — esquema de la Orca, botones, paneles
tests/act2/      — Vitest del núcleo
tools/sim-act2.ts — simulador por consola (npm run sim:act2)
```
RNG `mulberry32` sembrable; ESLint prohíbe `Math.random` y `Date` en `src/act2/core/`.

## 7. Criterios de aceptación
| Hito | Criterio |
|---|---|
| M1 motor | Tests de: las 40 combinaciones de adyacencia validadas y proa/popa; umbrales y caída al agua; cada Habilidad y cada arma según §3.3; distribuciones exactas de 1-3 dados con y sin Caña; finales de partida |
| M2 IA | Tests de escenarios: remata a un tripulante a 1 Herida en el agua; prefiere sacudirse con Bengala adherida; Carnada revela el duplicado; Ataque Bifásico repite solo lo que mejora; nunca elige una opción imposible |
| M3 simulador | ≥ 5.000 partidas; el Tiburón más fuerte medido (el 40-50 % inicial se revisó: ver §4.8); rondas seguidas sin ataque ≤ 3 en el 95 % de partidas |
| M4 interfaz | Partida completa jugable en el navegador con entrada ≤ 10 toques por ronda normal; deshacer y reanudar funcionan |
| M5 publicación | Enlace con el Acto I; ES/EN; probado en emulador y móvil real; 7.0.0 en Play y web |
