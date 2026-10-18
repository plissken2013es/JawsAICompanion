# Acto II — catálogo de componentes

> Fuente: fotos de la copia física en castellano (`reference/fotos/`, 2026-10-18; fuera de git), cruzadas con el inventario de BGG (hilo 2632350) y las respuestas del diseñador (FilmWise).
> Solo datos de juego (números, nombres y efectos resumidos): el arte y el texto completo se leen en la carta física.
> Completo a 2026-10-18 (fotos de la copia, inventario de BGG, respuestas de FilmWise y *Adjacency Checker* validado).

## 1. Vida y reparto inicial

**Tripulación**: barra de heridas 0-5 y ✗ → **cada tripulante muere al recibir la 6.ª herida** (Brody, Quint y Hooper iguales).
**Tiburón**: barra de heridas 0-17 y ✗ → **muere al recibir la 18.ª herida**.

**Reparto según los bañistas comidos en el Acto I** (tablero del Tiburón, cara del Acto I):

| Bañistas comidos | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| Habilidades Depredadoras (Tiburón) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| Equipamiento Tripulación (común) | 12 | 11 | 10 | 9 | 8 | 7 | 6 | 5 | 4 | 3 |

Coincide con el ejemplo del manual (7 comidos → 8 y 5). **Acto II suelto**: 6 Habilidades y 7 de Equipamiento (manual, pág. 12).

**Dado** (3 iguales, rojos): **1 cara en blanco, 3 caras de 1 Alcance y 2 caras de 2 Alcances** (confirmado por el autor con la copia). Media 7/6 ≈ 1,17 Alcances por dado; máximo 2.

## 2. La Orca

Cuadrícula de **2 filas × 4 columnas**, con la popa a la izquierda y la proa a la derecha (así se dibuja en las cartas de Reaparición).
Numeración de zonas (la del *Adjacency Checker*): **1-4 la fila de arriba y 5-8 la de abajo, de popa a proa**:

```
popa  1  2  3  4  proa
      5  6  7  8
```
Cada zona tiene un **Espacio de Barco** (lado interior) y un **Espacio de Agua** (lado exterior).

**Umbrales de las losetas** (impactos en un solo ataque):

| | Columna 1 (popa) | Columna 2 | Columna 3 | Columna 4 (proa) |
|---|---|---|---|---|
| Intacta: dañar \| destruir | 1 \| 3 | 2 \| 4 | 2 \| 4 | 1 \| 3 |
| Dañada: destruir | 1 | 2 | 2 | 1 |

Las filas A y B son simétricas. Al dañarse, el barco de la loseta encoge (más agua), lo que cambia adyacencias.

**Adyacencia** — modelo del *JAWS Adjacency Checker* v1.1 (BGG, fichero 324008, `reference/files/ayudas-y-datos/`; no oficial), **validado** el 2026-10-18 contra la geometría de sus propias losetas: en las 40 combinaciones de dos zonas vecinas intactas o dañadas coincide, salvo el contacto de un 5 % entre las aguas de proa, que excluye a propósito por la regla de FilmWise (margen de imprenta). Dos espacios son adyacentes si comparten borde; en diagonal, no.

- **Barco–barco**: vecinos ortogonales en la cuadrícula (1-2-3-4, 5-6-7-8 y cada columna 1-5, 2-6, 3-7, 4-8), si ambas losetas existen.
- **Agua–agua**: vecinos de la misma fila (1-2-3-4, 5-6-7-8). Las aguas de popa (1-5) y de proa (4-8) solo se tocan si **ninguna** de las dos losetas está intacta (FilmWise).
- **Agua y barco de la misma zona**: siempre adyacentes mientras la loseta exista.
- **Loseta dañada**: su barco encoge y su agua pasa a tocar el barco de las losetas **intactas** vecinas de su fila (y la de su pareja de popa/proa).
- **Loseta destruida**: la zona entera es un solo Espacio de Agua (no se fusiona con otras), adyacente a los barcos vecinos que existan, a las aguas de su fila y a las aguas de las zonas vecinas también destruidas.
- Cuerpo a cuerpo y ataques del Tiburón usan esta adyacencia; las armas de fuego apuntan a cualquier agua.

## 3. Reaparición (16 cartas: 2 por zona)

Símbolos: **aleta** con un número = Evasión; **dados** = dados de ataque; **anzuelo con ondas** = el Tiburón se sacude las armas adheridas (*Shake Off*).

| Zona | Evasión | Dados | Sacude | Cita (castellano) |
|---|---|---|---|---|
| 1 | 2 | 1 | | «Era muy fácil. Es un bicho muy listo. ¡Está debajo del barco!» — Quint |
| 1 | 1 | 2 | | «Lo que trato de hacer, jefe, es sacarlo a la superficie…» — Quint |
| 2 | 1 | 3 | ✓ | «Necesitará un barco más grande.» — Jefe Brody |
| 2 | 2 | 2 | | «Antes yo odiaba el agua. No sé por qué…» — Jefe Brody |
| 3 | 2 | 2 | ✓ | «Vamos a hundirnos, ¿verdad?» — Brody |
| 3 | 1 | 3 | | «¡Es un tiburón blanco, Larry, enorme!…» — Brody |
| 4 | 1 | 2 | | «¡Está dando vueltas alrededor del barco! ¡Es enorme!» — Jefe Brody |
| 4 | 2 | 1 | | «¡Qué rápido!» — Hooper |
| 5 | 1 | 2 | | «Tienen algo muy característico… Ojos de muñeca.» — Quint |
| 5 | 2 | 1 | | «¡Quiere cazarnos, es increíble!» — Hooper |
| 6 | 2 | 2 | ✓ | «¡Madre mía!» — Hooper |
| 6 | 1 | 3 | | «¡Amigos, amigos! Me parece que vuelve a buscar su almuerzo.» — Hooper |
| 7 | 2 | 2 | | «Mide siete metros.» — Hooper / «Ocho metros…» — Quint |
| 7 | 1 | 3 | ✓ | «¡Pero, Hooper, idiota, a estribor!…» — Quint |
| 8 | 1 | 2 | | «¿Dónde se ha metido? No vas a tomarme el pelo.» — Quint |
| 8 | 2 | 1 | | «Los 10.000 dólares tienen que ser para mí solo…» — Quint |

Patrones (útiles para la IA y para comprobar la lectura): en cada zona hay una carta de Evasión 1 y otra de Evasión 2; las esquinas nunca dan 3 dados (en ellas, Evasión 1 → 2 dados y Evasión 2 → 1 dado); las 4 cartas que sacuden están en zonas centrales (2, 3, 6, 7).

## 4. Habilidades Depredadoras (16 cartas: 8 tipos × 2)

| Castellano | Inglés | Efecto |
|---|---|---|
| Embestida Rápida | Ramming Speed | Tras el ataque de la Tripulación, el Tiburón puede moverse a un Espacio de Agua adyacente; si se mueve, +2 Alcances a su tirada de ataque |
| Segunda Ración | Second Helping | Tras un ataque contra el barco, segundo ataque contra el barco con 2 dados, al mismo Espacio de Barco o a otro |
| Ataque Bifásico | Maul Again | Tras tirar los dados de un ataque, puede repetir los que quiera; el nuevo resultado es definitivo |
| Blanco Difícil | Hard Target | La Evasión del Tiburón es 3; el Equipamiento que modifica la Evasión sigue aplicando |
| Gran Mordida | Big Mouth | Si daña o destruye un Espacio de Barco, cada tripulante que estaba en él recibe 1 Herida |
| Fuerte Oleaje | Making Waves | Si daña o destruye un Espacio de Barco, todos los tripulantes que estén en cualquier Espacio de Barco caen al Espacio de Agua de su zona |
| Efecto Dominó | Domino Effect | Si daña o destruye un Espacio de Barco, puede aplicar 2 Alcances a un Espacio de Barco adyacente al dañado o destruido |
| Fuerza Brutal | Extra Strength | Si daña un Espacio de Barco, este queda destruido |

Aclaraciones de FilmWise: *Embestida Rápida* suma solo al ataque principal, no a los Ataques Extra; *Ataque Bifásico* vale para un solo ataque (principal o extra); con *Segunda Ración* el segundo ataque es independiente.

## 5. Equipamiento

Tipos: **puño** = cuerpo a cuerpo (hay que estar en el espacio o adyacente); **mira** = arma de fuego (a cualquier distancia); **anzuelo** = adherible (se engancha sin tirar); sin símbolo = accesorio. "+✸" = +1 Alcance.

### 5.1 Personal (6)
| Carta | Inglés | Personaje | Tipo | Dados | Efecto |
|---|---|---|---|---|---|
| Bate de Béisbol | Baseball Bat | Brody | puño | 2 | Si el ataque falla, repite los dos dados (definitivo) |
| Pistola | Pistol | Brody | mira | 2 | Tras revelarse la Reaparición, puede mover su Ficha de Blanco a un Espacio de Agua adyacente; al disparar, descarta 1 Munición o la Pistola |
| Machete | Machete | Quint | puño | 2 +1 | — |
| Bengala | Flare | Quint | anzuelo | — | Mientras esté adherida: al final de cada ronda el Tiburón tira 1 dado y recibe esas Heridas |
| Martillo | Hammer | Hooper | puño | 1 | La Evasión del Tiburón es 0 contra el Martillo |
| Rifle | Rifle | Hooper | mira | 2 +1 | Al disparar, descarta 1 Munición o el Rifle |

Las armas cuerpo a cuerpo personales (Bate, Machete, Martillo) nunca se pierden salvo que muera su dueño.

### 5.2 Común (16)
| Carta | Inglés | Copias | Tipo | Dados | Efecto |
|---|---|---|---|---|---|
| Munición | Ammo | 5 | accesorio | — | Para el Rifle o la Pistola (se descarta en lugar del arma) |
| Carnada | Chum | 3 | accesorio | — | Tras elegir el Tiburón, este revela una de las dos Fichas de Reaparición que NO escogió; se descarta. Máx. 1 por ronda |
| Jaula Antitiburones | Shark Cage | 1 | accesorio | — | Antes de que el Tiburón tire para atacar: quien la juega no recibe Heridas esta ronda; se descarta |
| Pistola | Pistol | 1 | mira | 2 | Como la de Brody |
| Fusil de Pesca | Harpoon Gun | 1 | mira | 3 +1 | Se descarta tras disparar |
| Gancho | Hook | 1 | puño | 3 | Si saca 4 o más Alcances, el Tiburón resulta herido igualmente pero el Gancho se rompe (se descarta) |
| Arpón Tranquilizante | Tranq Spear | 1 | puño | 3 | Si hiere al Tiburón, este tira solo 1 dado al atacar esta ronda; se descarta tras atacar |
| Red de Pesca | Fishing Net | 1 | anzuelo | — | Mientras esté adherida: Evasión del Tiburón −1 |
| Caña de Pescar | Fishing Pole | 1 | anzuelo | — | Mientras esté adherida: en cualquier ataque del Tiburón, los dados que marquen 2 Alcances cuentan como 1 |
| Bombona | Canister | 1 | anzuelo | — | Mientras esté adherida: si un ataque con Pistola o Rifle hiere al Tiburón, explota (se descarta y el Tiburón recibe 3 Heridas más) |

## 6. Terminología oficial de la edición española
Reaparición (cartas, fichas grandes y pequeñas), Posibles Zonas de Reaparición, Habilidad Depredadora, Equipamiento Tripulación, Ficha de Blanco, Espacio de Barco, Espacio de Agua, Alcances (impactos), Heridas, Evasión, Armas adheridas, se sacude de encima, Ataques Extra, Miembros de la Tripulación.
