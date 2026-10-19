# Atto II in beta — note per Adriano

**Beta:** https://robojaws.netlify.app/acto2-beta/ (non è collegata dalla versione pubblica; la app normale resta su https://robojaws.netlify.app/).

## Che cos'è
Jaws Companion ora gioca anche **l'Atto II (l'Orca)** in solitario o in cooperativo: l'app fa lo **Squalo**. Sceglie in segreto dove riemergere, tiene nascosta la sua mano di carte Abilità, decide i suoi attacchi e dice al tavolo cosa fare. **Tutto il caso e i componenti restano fisici**: carte Riemersione, dadi, sezioni della barca, Equipaggiamento. Serve la scatola del gioco.

## Come provarla
1. Scegli la bandiera italiana e salta l'intro con un tocco.
2. Nel menu: **«GIOCA SOLO L'ATTO II»** (oppure, alla fine dell'Atto I, «CONTINUA CON L'ATTO II», che usa i bagnanti mangiati).
3. Preparazione: bagnanti mangiati (o Atto II da solo, 6/7), l'Equipaggiamento comune di ogni personaggio, le posizioni iniziali sulla barca.
4. Ogni round: tocca le 3 carte Riemersione → lo Squalo decide → sposta le pedine se serve (ed eventualmente Esca) → «Rivela lo Squalo» → chi ha mirato alla zona giusta e i suoi Colpi → i dadi dello Squalo (in ⚙ si può far tirare i dadi all'app).
5. «Annulla» torna indietro di un passo; la partita si salva da sola dopo ogni tocco.

## Cosa ci interessa sapere
- Errori di regole o situazioni in cui l'app chiede qualcosa di impossibile.
- Se lo Squalo gioca in modo sensato (o stupido) e se la partita è divertente.
- Testi poco chiari, troppo lunghi o che non entrano nello schermo.
- Il numero di tocchi per round: è comodo da usare al tavolo?

## Traduzione da rivedere
I testi italiani dell'Atto II sono **una bozza**: non abbiamo l'edizione italiana delle carte. Per favore, controlla soprattutto **i nomi ufficiali** nella tua copia e correggi quello che serve.

| Inglese (originale) | Spagnolo (ufficiale) | Bozza italiana |
|---|---|---|
| Resurface (cards) | Reaparición | Riemersione |
| Shark Ability | Habilidad | Abilità |
| Gear / Crew Gear | Equipamiento | Equipaggiamento |
| Evade | Evasión | Evasione |
| Hits | Alcances | Colpi |
| Wounds | Heridas | Ferite |
| Boat Space / Water Space | Espacio de Barco / de Agua | spazio barca / acqua |
| Boat Tile | Loseta / pieza | sezione |
| Shake Off | se sacude | si scrolla di dosso |
| Bonus Attack | Ataque Extra | Attacco Bonus |
| Target Token | Ficha de Blanco | segnalino (bersaglio) |
| Ramming Speed | Embestida Rápida | Speronamento |
| Second Helping | Segunda Ración | Bis |
| Maul Again | Ataque Bifásico | Doppio Morso |
| Hard Target | Blanco Difícil | Bersaglio Difficile |
| Big Mouth | Gran Mordida | Boccone Grosso |
| Making Waves | Fuerte Oleaje | Onde Alte |
| Domino Effect | Efecto Dominó | Effetto Domino |
| Extra Strength | Fuerza Brutal | Forza Bruta |
| Baseball Bat | Bate de Béisbol | Mazza da Baseball |
| Pistol / Rifle / Machete / Hammer | Pistola / Rifle / Machete / Martillo | Pistola / Fucile / Machete / Martello |
| Flare | Bengala | Razzo di Segnalazione |
| Ammo | Munición | Munizioni |
| Chum | Carnada | Esca |
| Shark Cage | Jaula Antitiburones | Gabbia Antisqualo |
| Harpoon Gun | Fusil de Pesca | Fucile Subacqueo |
| Hook | Gancho | Gancio |
| Tranq Spear | Arpón Tranquilizante | Arpione Tranquillante |
| Fishing Net / Fishing Pole | Red de Pesca / Caña de Pescar | Rete da Pesca / Canna da Pesca |
| Canister | Bombona | Bombola |

Tutti i testi sono in `src/act2/i18n.ts` (colonna `IT`). Si possono mandare le correzioni come una lista "attuale → corretto", oppure con una PR come per l'Atto I.
