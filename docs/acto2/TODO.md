# TODO — Acto II

**Referencia:** `BLUEPRINT.md` · `SPECS.md` · rama `acto2`
**Leyenda:** `[ ]` pendiente · `[x]` hecho · `[~]` en curso · `[!]` bloqueado

## M0 — Canon y diseño
- [x] Investigación de foros y ficheros de BGG (`01-investigacion-y-opciones.md`)
- [x] Catálogo desde la copia física + adyacencia validada (`02-catalogo.md`)
- [x] Diseño de la app y de la IA (`03-diseno-ia.md`)
- [x] `SPECS.md` con decisiones D-1..D-8 cerradas
- [x] `BLUEPRINT.md` y este `TODO.md`

## M1 — Motor de reglas
- [x] P-01 Andamiaje, `tsconfig.act2.json`, override de ESLint, RNG
- [x] P-02 Tipos y datos del catálogo
- [x] P-03 Adyacencia (40 combinaciones + proa/popa)
- [x] P-04 Dados exactos
- [x] P-05 Estado, preparación y serialización
- [x] P-06 Movimiento y alcance de la tripulación
- [x] P-07 Ataque de la tripulación
- [x] P-08 Ataque del Tiburón
- [x] P-09 Habilidades
- [x] P-10 Ronda completa y finales
- [ ] Confirmar con las cartas físicas cinco interpretaciones del motor (cambiar test + código si alguna no cuadra):
  - Arpón Tranquilizante: se descarta siempre tras atacar, hiera o no (`crewAttack.ts`).
  - Munición: la gasta solo el propio tirador, no la de otro tripulante (`crewAttack.ts`).
  - Bate: «si el ataque falla» = no causa ninguna Herida (`crewAttack.ts`).
  - Efecto Dominó: «pieza adyacente» = vecina en la cuadrícula del barco, aunque el Tiburón no llegue a ella (`abilities.ts`).
  - Fuerte Oleaje: caen al agua todos los que estén en cubierta, no solo los de la pieza dañada (`abilities.ts`).

## M2 — IA
- [x] P-11 Valoración
- [x] P-12 Amenaza por opción
- [x] P-13 Ataque esperado por opción
- [x] P-14 D1 Reaparición
- [x] P-15 D2 Habilidad
- [x] P-16 D3 Carnada y D4 Embestida
- [x] P-17 D5 Ataque y repeticiones
- [x] P-18 Fachada `SharkBrain` y niveles

## M3 — Simulador
- [x] P-19 Tripulación-bot y partida completa
- [x] P-20 `npm run sim:act2` y ajuste (`04-ajuste.md`): anti-bloqueo cumplido; Normal 16,9 % (Fácil 7,8 %, Difícil 17,4 %)
- [!] **Decisión del autor**: el 40-50 % de Normal no se alcanza en el Acto II suelto con reglas oficiales (techo ~20 %; 9 bañistas 39 %, variante 45 %). Opciones en `04-ajuste.md` §3

## M4 — Interfaz
- [x] P-21 Esquema de la Orca (`ui/OrcaSchematic.ts`)
- [x] P-22 `Act2Setup`
- [x] P-23 `Act2Round` pasos 1-4 (lógica en `app/controller.ts`, sin Phaser)
- [x] P-24 `Act2Round` pasos 5-7 ← MVP (partida completa probada en el navegador; mediana 10 toques/ronda con dados de mesa, 8 con dados de la app)
- [x] P-25 `Act2End`, ajustes y accesos (menú inicial siempre visible; «Continuar al Acto II» al final del Acto I)

## M5 — Publicación
- [x] P-26 Idiomas: ES/EN completos (`src/act2/i18n.ts`), DE/RU/IT caen al inglés; test de paridad de claves
- [ ] P-27 Partidas reales y prueba de humo e2e
- [ ] P-28 Versión 7.0.0

## Notas
- `main` lleva el `.gitignore` de `reference/` (commit `633f57f`, sin push).
- La traducción italiana del Acto I (PR #1) aún no está en `origin/main` (comprobado el 2026-10-19). Cuando entre: traerla a `acto2` y añadir la columna `IT` a `src/act2/i18n.ts`.
