# Ajuste de la IA del Tiburón con el simulador (P-20)

**Fecha:** 2026-10-18 · **Rama:** `acto2` · **Herramienta:** `npm run sim:act2 -- [--games N] [--swimmers b] [--variant] [--set clave=valor …]`

El simulador juega partidas completas con el motor real, el `SharkBrain` y una tripulación-bot (`tools/act2/crewBot.ts`) que solo ve información pública. Simula la mesa: mazo de Reaparición barajado con rebarajado, reparto de Equipamiento al azar, dados de la tripulación con su propio generador y dados del Tiburón con el de la partida.

## 1. Resultado final: un único Tiburón, el más fuerte medido (revisado el 2026-10-19)

Con 5.000 partidas, Acto II suelto (6/7): **el Tiburón gana el 17,7 %**; 80 % de sus victorias, por barco; 9,7 rondas de media (p95: 15); el 99,7 % de las partidas sin más de 3 rondas seguidas sin atacar.

- **Un solo nivel.** Primero hubo tres (Fácil 7,8 %, Normal 16,9 %, Difícil 17,4 %). Como aun en su mejor versión el Tiburón pierde la mayoría de partidas, un nivel más flojo no sirve a nadie, y Normal y Difícil apenas se distinguían. La dificultad la da el propio juego: los bañistas comidos en el Acto I (o el selector 0-9 del Acto II suelto) y la variante no oficial (§3).
- **Anti-bloqueo**: cumplido de sobra (objetivo ≥ 95 % de partidas sin más de 3 rondas seguidas sin atacar).
- **El 40-50 %** que pedía el SPECS (§7, M3) no es alcanzable en el Acto II suelto con las reglas oficiales (§3).
- Uso de Habilidades por partida: Segunda Ración 0,75 · Efecto Dominó 0,75 · Fuerza Brutal 0,73 · Blanco Difícil 0,73 · Embestida Rápida 0,73 · Ataque Bifásico 0,65 · Gran Mordida 0,42 · Fuerte Oleaje 0,13.
- Heridas al Tiburón por partida y fuente: Rifle 3,9 · Machete 3,3 · Bengala 2,5 · Bate 2,2 · Pistola 1,7 · Gancho 1,3 · Martillo 1,3 · Fusil de Pesca 1,3 · Arpón Tranquilizante 0,4.

Barrido final (2.000 partidas por fila, ±0,85 %): `p_min` 0,05 → 16,8 % · 0,1 → 16,3 % · 0,15 → 16,8 % · **0,2 → 17,4 %** · 0,25 → 17,4 % · 0,3 → 17,4 % · 0,2 con temperatura 0,3 → 17,9 % · 0,2 con `abilityBase` 0,005 → 17,8 %. Las dos últimas, juntas, con 5.000 partidas: 17,7 % (frente a 17,4 % solo con `p_min` 0,2). La diferencia está en el ruido; se adoptan porque el Tiburón queda igual de fuerte y usa más sus Habilidades (Ataque Bifásico 0,35 → 0,65 por partida), que en la mesa es más vistoso.

## 2. Qué se ajustó y por qué

| Parámetro | Antes | Ahora | Motivo (medido) |
|---|---|---|---|
| `riskCurve` | 2 | 1,2 | El Acto II es una carrera de desgaste: el Tiburón tiene 18 de vida y necesita ~28 Alcances para hundir el barco. Con un riesgo muy convexo, las primeras Heridas le salían casi gratis y se dejaba herir pronto (7,8 % → 15 %). |
| `lambdaBase` / `lambdaGrowth` | 0,5 / 2 | 1 / 0,5 | Mismo motivo: peso del riesgo más uniforme a lo largo de la partida. |
| `threatWeight` | 0,3 | 1 | Valorar más el arsenal que le queda a la tripulación (+2-3 puntos). |
| `temperature` | 0,02 | 0,3 | Casi no influye (16-19 % entre 0,05 y 1). |
| `pMin` | 0,05 | 0,2 | Mantener viva cada opción hace al Tiburón más difícil de leer (§1). |
| `abilityBase` | 0,01 | 0,005 | Umbral más bajo: juega más Habilidades, igual de fuerte (§1). |
| `hardTargetReserve` | 0,05 | 0,05 | Con la nueva escala, Blanco Difícil vale 0,11 con el Tiburón sano y 0,25-0,32 herido. Reserva 0 → 15,8 %; 0,05 → 17,4 %; 0,15 → 14,9 %. Se queda en 0,05: **el Tiburón lo juega pronto**, no solo «con mucho riesgo» como decía el SPECS. |
| `rammingReserve` | 0,05 | 0,05 | 0 → 16,7 %; 0,05 → 17,4 %; 0,1 → 16,3 %. |

**La tripulación-bot no conoce los parámetros del Tiburón.** Si el bot usa exactamente los mismos parámetros que el Tiburón, lo «lee» perfectamente y el Tiburón cae al ~10 %. Ninguna mesa humana puede hacer eso, así que el bot usa su propio modelo fijo: los parámetros iniciales, antes del ajuste (`CREW_MODEL`). **Tiene que ser un objeto literal completo**: cuando heredaba de `DEFAULT_PARAMS`, al subir el `p_min` del Tiburón el bot «aprendió» ese valor y el Tiburón bajó del 17,4 % al 13,9 %. Hay un test que lo vigila.

**Por qué no hay niveles.** La primera hipótesis de niveles (SPECS §4.8) era errónea: hacer más difusa la elección vuelve al Tiburón *más* difícil de leer, no más fácil, y lo único que lo debilitaba de verdad era usar mal sus Habilidades (sin Habilidades gana el 6,8 %). Un Tiburón «Fácil» habría ganado el 7,8 %.

## 3. Por qué no se llega al 40-50 % (decidido el 2026-10-19)

Mediciones de 200-500 partidas por fila:

| Configuración | Gana el Tiburón |
|---|---|
| Acto II suelto (6 Habilidades / 7 Equipamiento) | 18,6 % |
| Suelto + variante no oficial (Ataques Extra con los dados de la carta, D-3) | **45,0 %** |
| 0 bañistas comidos (1 / 12) | 2,6 % |
| 3 bañistas (4 / 9) | 10,4 % |
| 5 bañistas (6 / 7) | 18,6 % |
| 7 bañistas (8 / 5) | 25,4 % |
| 9 bañistas (10 / 3) | **38,8 %** |
| Tripulación «ingenua» que no intenta adivinar al Tiburón | 16,5 % |

- **El reparto inicial decide el equilibrio**, no la finura de la IA: con los parámetros legales, el techo medido del Tiburón en el Acto II suelto es ~20 %.
- La tripulación acierta la zona en ~61 % de las rondas aunque el Tiburón elija casi al azar: con tres tripulantes, armas de fuego y la Pistola cubre casi siempre dos de las tres opciones.
- Coincide con los foros: la tripulación gana la mayoría de las partidas del Acto II (BGG, encuesta 2248910).

**Decisión del autor (2026-10-19):** un único nivel, el máximo; la dificultad se elige con los bañistas comidos (o el selector 0-9) y la variante no oficial.

## 4. Cómo reproducir
```
npm run sim:act2 -- --games 5000
npm run sim:act2 -- --games 500 --swimmers 9
npm run sim:act2 -- --games 500 --variant
npm run sim:act2 -- --games 1000 --set hardTargetReserve=0.15
```
Unas 15 partidas por segundo; 5.000 partidas tardan ~5,5 minutos.
