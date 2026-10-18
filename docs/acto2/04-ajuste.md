# Ajuste de la IA del Tiburón con el simulador (P-20)

**Fecha:** 2026-10-18 · **Rama:** `acto2` · **Herramienta:** `npm run sim:act2 -- [--games N] [--level easy|normal|hard|all] [--swimmers b] [--variant] [--set clave=valor …]`

El simulador juega partidas completas con el motor real, el `SharkBrain` y una tripulación-bot (`tools/act2/crewBot.ts`) que solo ve información pública. Simula la mesa: mazo de Reaparición barajado con rebarajado, reparto de Equipamiento al azar, dados de la tripulación con su propio generador y dados del Tiburón con el de la partida.

## 1. Resultado final (5.000 partidas por nivel, Acto II suelto 6/7)

| Nivel | Gana el Tiburón | Por barco (de sus victorias) | Rondas (media / p95) | Bloqueo ≤ 3 rondas sin atacar |
|---|---|---|---|---|
| Fácil | **7,8 %** | 89 % | 9,6 / 16 | 99,9 % |
| Normal | **16,9 %** | 80 % | 9,8 / 15 | 99,8 % |
| Difícil | **17,4 %** | 80 % | 9,7 / 15 | 99,6 % |

- **Anti-bloqueo**: cumplido de sobra (objetivo ≥ 95 % de partidas sin más de 3 rondas seguidas sin atacar).
- **Normal 40-50 %** (SPECS §7, M3): **no se alcanza** en el Acto II suelto con las reglas oficiales. Ver §3: es una decisión del autor.
- Uso de Habilidades por partida (Normal): Segunda Ración 0,75 · Efecto Dominó 0,75 · Blanco Difícil 0,72 · Fuerza Brutal 0,71 · Embestida Rápida 0,71 · Ataque Bifásico 0,35 · Gran Mordida 0,30 · Fuerte Oleaje 0,05.
- Heridas al Tiburón por partida y fuente (Normal): Rifle 3,9 · Machete 3,3 · Bengala 2,6 · Bate 2,2 · Pistola 1,6 · Martillo 1,3 · Gancho 1,3 · Fusil de Pesca 1,3 · Arpón Tranquilizante 0,4.

## 2. Qué se ajustó y por qué

| Parámetro | Antes | Ahora | Motivo (medido) |
|---|---|---|---|
| `riskCurve` | 2 | 1,2 | El Acto II es una carrera de desgaste: el Tiburón tiene 18 de vida y necesita ~28 Alcances para hundir el barco. Con un riesgo muy convexo, las primeras Heridas le salían casi gratis y se dejaba herir pronto (7,8 % → 15 %). |
| `lambdaBase` / `lambdaGrowth` | 0,5 / 2 | 1 / 0,5 | Mismo motivo: peso del riesgo más uniforme a lo largo de la partida. |
| `threatWeight` | 0,3 | 1 | Valorar más el arsenal que le queda a la tripulación (+2-3 puntos). |
| `temperature` | 0,02 | 0,1 | Casi no influye (16-19 % entre 0,05 y 1); 0,1 es el mejor medido. |
| `hardTargetReserve` | 0,05 | 0,05 | Con la nueva escala, Blanco Difícil vale 0,11 con el Tiburón sano y 0,25-0,32 herido. Reserva 0 → 15,8 %; 0,05 → 17,4 %; 0,15 → 14,9 %. Se queda en 0,05: **el Tiburón lo juega pronto**, no solo «con mucho riesgo» como decía el SPECS. |
| `rammingReserve` | 0,05 | 0,05 | 0 → 16,7 %; 0,05 → 17,4 %; 0,1 → 16,3 %. |

**La tripulación-bot no conoce los parámetros del Tiburón.** Si el bot usa exactamente los mismos parámetros que el Tiburón, lo «lee» perfectamente y Normal cae al ~10 %. Ninguna mesa humana puede hacer eso, así que el bot usa su propio modelo fijo (los parámetros iniciales, antes del ajuste: `CREW_MODEL`).

**Niveles redefinidos con datos** (sustituye a la tabla de SPECS §4.8). La primera hipótesis era errónea: hacer más difusa la elección vuelve al Tiburón *más difícil* de leer, no más fácil. Lo que de verdad lo debilita es usar mal sus Habilidades (sin Habilidades gana el 6,8 %).
- **Fácil**: juega las Habilidades con reparo (`abilityBase` 0,1), ignora la Jaula y es predecible (`p_min` 2 %).
- **Normal**: los valores de `DEFAULT_PARAMS`.
- **Difícil**: mantiene viva cada opción (`p_min` 20 %), lo más difícil de leer que se ha medido.

## 3. Por qué no se llega al 40-50 % (decisión pendiente)

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

Opciones para el autor:
1. **Aceptar el equilibrio oficial** y presentar la dificultad como «bañistas comidos» (selector 0-9 en la preparación, D-6) más la variante no oficial; los niveles solo matizan.
2. **Un nivel Difícil no oficial** que dé al Tiburón ventaja de reparto (por ejemplo +2 Habilidades) o active la variante.
3. **Reformular el objetivo** del SPECS (por ejemplo Normal 15-25 % contra un bot fuerte) y validar con partidas reales en el P-27.

## 4. Cómo reproducir
```
npm run sim:act2 -- --games 5000 --level all
npm run sim:act2 -- --games 500 --level normal --swimmers 9
npm run sim:act2 -- --games 500 --level normal --variant
npm run sim:act2 -- --games 1000 --level normal --set hardTargetReserve=0.15
```
Unas 15 partidas por segundo; 5.000 partidas por nivel tardan ~5,5 minutos.
