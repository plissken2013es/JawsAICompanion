# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RoboJaws** is an interactive digital companion app for the Jaws board game. It's an AI-powered shark decision engine built with **Phaser 3**, **TypeScript**, and **Parcel** (v1). The shark AI guides gameplay with intelligent decision-making across a 12-zone board, with multi-language support (English, Spanish, German, Russian).

## Commands

```bash
npm start        # Dev server on port 8000 with hot reload (parcel src/index.html -p 8000)
npm run build    # Production build to /dist (parcel build src/index.html --out-dir dist)
npm run lint     # ESLint on src/ (eslint ./src --ext .js,.jsx,.ts,.tsx)
```

There are no automated tests.

## Architecture

### Three-tier structure

```
src/scenes/   — UI flow & game loop (9 scenes)
src/objects/  — Game entities: Board, Zone, Hunter, Swimmer, Barrel, Michael + UI widgets
src/utils/    — Business logic: AI, pathfinding, localization, persistence, logging
src/consts/   — Enums and config: ZoneNames, Characters, MapConfig, Graph, SceneKeys, etc.
```

### Scene flow

`LanguageSelection → Preloader → StudiosLogo → InitialOptions → Intro → **Game** (main loop) → FinalOptions`

`PhaseTitle` and `LogScreen` are overlay/utility scenes. `Game.ts` is the primary scene handling all turn phases, UI interactions, and entity coordination.

### Core systems

**JawsAI** (`src/utils/JawsAI.ts`) — The intellectual core. Determines shark mood (`NINJA` / `NORMAL` / `HUNGRY`), selects a mission target (beach, swimmer concentration, hunter proximity), calculates the movement path, manages power tokens (`FEEDING_FRENZY`, `EVASIVE_MOVES`, `OUT_OF_SIGHT`, `SPEED_BURST`), and tracks barrel attachments (win condition).

**DijkstraManager** (`src/utils/DijkstraManager.ts`) — Singleton shortest-path calculator. Uses `JawsGraph` from `src/consts/Graph.ts`, a weighted adjacency graph over 12 zones. Used by both the AI and hunter drag-and-drop validation.

**Board / Zone** (`src/objects/`) — `Board` holds 12 `Zone` objects (zones 1–8 are ocean; N/S/E/W are beaches). Each `Zone` tracks swimmer count, barrel count, and whether Michael (decoy hunter) is present. Zone coordinates and swimmer spawn positions live in `src/consts/MapConfig.ts`.

**LocaleManager** (`src/utils/LocaleManager.ts`) — All UI strings are looked up via key; never hardcoded. Supports EN/ES/DE/RU. Must be used for any new user-facing text.

**Singletons** — `LocalStorage.getInstance()`, `DijkstraManager.getInstance()`, `LogManager.getInstance(logEnabled)`. These are shared state; access only through getInstance.

### IGame interface

`src/objects/IGame.ts` extends `Phaser.Scene` and defines the contract all scenes must implement. Use it when accessing a scene reference from another scene or object.

### Assets

Static assets (images, audio, fonts) live in `/public/` and are copied to `/dist/` at build time via `parcel-plugin-static-files-copy`. They are referenced by string keys set during preload in `src/scenes/Preloader.ts`.

### Path alias

`tsconfig.json` maps `~/*` → `./src/*`. Use `~/consts/ZoneNames` style imports inside `src/`.
