# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Jaws Companion** (repo name RoboJaws) is an interactive digital companion app for the Jaws board game. It's an AI-powered shark decision engine built with **Phaser 3.90**, **TypeScript** and **Vite**, packaged for Android and iOS with **Capacitor 8**. The shark AI guides gameplay with intelligent decision-making across a 12-zone board, with multi-language support (English, Spanish, German, Russian, Italian).

Published on Google Play as `com.netlify.JawsCompanion` ("Jaws Companion App"). Current release: **6.0.6** (versionCode 60600, production, 2026-10-19: Italian translation).

## Commands

```bash
npm start              # Vite dev server on port 8000 (root: src/)
npm run build          # Production build to /dist
npm test               # Vitest, 103 tests in tests/ (jsdom + Phaser stub)
npm run lint           # ESLint on src/
npm run build:android  # vite build + npx cap sync android
```

Release AAB (signed with the upload key, see "Publishing"):

```bash
npm run build:android
cd android && ./gradlew bundleRelease   # → android/app/build/outputs/bundle/release/app-release.aab
```

## Architecture

### Three-tier structure

```
src/scenes/   — UI flow & game loop (9 scenes)
src/objects/  — Game entities: Board, Zone, Hunter, Swimmer, Barrel, Michael + UI widgets
src/utils/    — Business logic: AI, pathfinding, localization, persistence, logging
src/consts/   — Enums and config: ZoneNames, Characters, MapConfig, Graph, SceneKeys, etc.
tests/        — Vitest suites for consts/ and utils/ (no scene tests); tests/setup/phaser.stub.ts
```

### Scene flow

`LanguageSelection → Preloader → StudiosLogo → Intro → InitialOptions → **Game** (main loop) → FinalOptions`

- The language is chosen with **flags**, not from the device locale. No code reads `navigator.language`.
- `Intro` does **not** advance by itself: after the shark and the "JAWS COMPANION" title it waits for a tap. A tap at any time skips it.
- `InitialOptions` only shows its buttons when there is a saved game; otherwise it goes straight to `Game`.
- `PhaseTitle` and `LogScreen` are overlay/utility scenes. `Game.ts` is the primary scene handling all turn phases, UI interactions, and entity coordination.

### Core systems

**JawsAI** (`src/utils/JawsAI.ts`) — The intellectual core. Determines shark mood (`NINJA` / `NORMAL` / `HUNGRY`), selects a mission target (beach, swimmer concentration, hunter proximity), calculates the movement path, manages power tokens (`FEEDING_FRENZY`, `EVASIVE_MOVES`, `OUT_OF_SIGHT`, `SPEED_BURST`), and tracks barrel attachments (win condition).

**DijkstraManager** (`src/utils/DijkstraManager.ts`) — Singleton shortest-path calculator. Uses `JawsGraph` from `src/consts/Graph.ts`, a weighted adjacency graph over 12 zones. Used by both the AI and hunter drag-and-drop validation.

**Board / Zone** (`src/objects/`) — `Board` holds 12 `Zone` objects (zones 1–8 are ocean; N/S/E/W are beaches). Each `Zone` tracks swimmer count, barrel count, and whether Michael (decoy hunter) is present. Zone coordinates and swimmer spawn positions live in `src/consts/MapConfig.ts`.

**LocaleManager** (`src/utils/LocaleManager.ts`) — All UI strings are looked up via key; never hardcoded. Supports EN/ES/DE/RU/IT. Must be used for any new user-facing text. Adding a language touches several files (flavor texts, disclaimer, logo line, flag, credits): the checklist for contributors is the "Translating the app" section of `readme.md`; the Italian one (PR #1, Adriano Barsali, 2026-10-19) is the model.

**Singletons** — `LocalStorage.getInstance()`, `DijkstraManager.getInstance()`, `LogManager.getInstance(logEnabled)`. These are shared state; access only through getInstance.

### IGame interface

`src/objects/IGame.ts` extends `Phaser.Scene` and defines the contract all scenes must implement. Use it when accessing a scene reference from another scene or object.

### Assets

Vite runs with `root: 'src'` and `publicDir: '../public'`: static assets (images, audio, fonts, `scripts/webfont.js`) live in `/public/` and are copied to `/dist/` at build time. They are referenced by string keys set during preload in `src/scenes/Preloader.ts` (flags and fonts in `LanguageSelection.ts`).

### Path alias

`tsconfig.json` maps `~/*` → `./src/*` (resolved by `vite-tsconfig-paths` and the alias in `vitest.config.ts`). Use `~/consts/ZoneNames` style imports inside `src/`.

## Phaser 3.90 pitfalls (the app was upgraded from 3.24 in April 2026)

- **Tween/timer configs only accept `callbackScope`.** Phaser 3.60 removed the per-callback scopes (`onCompleteScope`, `onStartScope`, …) and ignores them silently. With a method callback (`onComplete: this.showJawsTitle`) `this` becomes the tween and the scene crashes **when the animation ends**. This shipped in 6.0.4: the app froze at the end of the intro for anyone who watched it to the end (fixed in 6.0.5). After any Phaser upgrade, run `grep -rE "on[A-Z][a-z]+Scope" src` and watch every animation to its end without tapping.
- **An uncaught error inside the game loop kills the loop**: Phaser requests the next frame after running the current one, so nothing renders and no input is processed afterwards. Symptom: "the app freezes and taps do nothing". Look at the browser console of `npm start` (or of the APK's `assets/public/` served locally), not at logcat: release builds do not forward the WebView console.

## Android (Capacitor 8)

- `capacitor.config.ts`: black `backgroundColor`, `SystemBars.insetsHandling: 'disable'`, `SplashScreen.autoHide: false` (hidden from `Preloader`), `StatusBar.overlaysWebView`.
- `android/app/src/main/java/com/netlify/JawsCompanion/MainActivity.java`: immersive mode (status and navigation bars hidden, re-hidden on focus) and `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES` set **before** `super.onCreate()`. `styles.xml`: black `windowBackground`. Manifest: `sensorLandscape`.
- `src/index.html` **must keep `viewport-fit=cover`** in its viewport meta. With Capacitor 8.3.0, `insetsHandling: 'disable'` only drops the safe-area CSS variables; the WebView is still padded for the camera cutout (white or black strip on the left on Android 15+) unless the page declares `viewport-fit=cover` and the WebView is ≥ 140. Check with `adb shell uiautomator dump`: the WebView bounds must be `[0,0][2400,1080]` on a Pixel 6a in landscape.
- Target/compile SDK 36, min SDK 24 (`android/variables.gradle`). Version in `android/app/build.gradle` (`versionCode` = major·10000 + minor·100 + patch, e.g. 60500).

## Publishing

- **Signing**: `android/app/build.gradle` reads `android/key.properties` (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`), falling back to the `JAWS_STORE_PASSWORD` / `JAWS_KEY_PASSWORD` environment variables. Both `android/key.properties` and `android/app/new-jaws-keystore.jks` are git-ignored: **never commit them**. The keystore holds the **upload key** (alias `upload`, SHA-1 `87:42:5C:0A:30:D5:93:6B:08:1F:60:D1:D4:0A:79:46:22:0C:07:8D`); the app signing key is managed by Google (Play App Signing). A copy of the upload certificate lives in `_____PROYECTOS/JawsDist/upload_certificate.pem`.
- **Upload**: through the Google Play Android Publisher API with the lab's service account (`___AI_experiments/000_play-publisher/`), or by hand in Play Console. Store listings exist in `en-GB` and `es-ES`; release notes go in both.
- Play tracks (2026-10-19): production 6.0.6, internal 6.0.4, beta 4.0.0, alpha 1.1.0 (draft).
- `src/index.html` loads Google Analytics (`gtag`, `G-0LQ57VQD5R`): keep the Play "Data safety" form consistent with it.
- The older Cordova build (6.0.2) and the 2016–2020 sources live in `_____PROYECTOS/JawsDist/`; they are history, not the codebase.

## Web version (Netlify)

**https://robojaws.netlify.app** is NOT deployed from this repo. Netlify auto-deploys the **public** repo [`plissken2013es/JawsDist`](https://github.com/plissken2013es/JawsDist), cloned locally at `_____PROYECTOS/JawsDist/_WebDist/JawsDist`, which holds only a copy of `dist/`. Every release must be copied over by hand, or the web keeps the old build (in October 2026 it still served 6.0.4 with the intro freeze after the app had been fixed).

1. `npm run build` here.
2. In the JawsDist clone: `git rm` the old `assets/index-*.js` / `assets/web-*.js`, then copy `dist/index.html` and `dist/assets/*` (the audio, fonts, images and scripts only change if `public/` changed: compare with `diff -rq dist <JawsDist> -x .git -x 'privacy_policy_*'`, which must come out empty).
3. **Keep the `privacy_policy_*.txt` files** (Jaws, Moncloa, Cuenta Atrás, Zombie Scavenger 2D): they are not in `dist/` and their Netlify URLs are registered in Play listings.
4. Test the clone locally (watch the whole intro, console clean), then commit and push to `main`. Netlify deploys in about 20 s; check that `https://robojaws.netlify.app/` loads the new `assets/index-*.js`.

Last web deploy: 6.0.6, JawsDist commit `2de29be` (2026-10-19). `_____PROYECTOS/JawsDist/_distKeystores` is, despite its name, just an old (2022) clone of the same JawsDist repo with no keystores in it.
