![Jaws Companion](public/img/jaws_pixel.png)

# Jaws Board game AI Companion. Based on Phaser3 + TypeScript + Vite
> We're gonna need a bigger boat.

![License](https://img.shields.io/badge/license-MIT-green)

Live demo: https://robojaws.netlify.app/

## Prerequisites

You'll need [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed.

It is highly recommended to use [Node Version Manager](https://github.com/nvm-sh/nvm) (nvm) to install Node.js and npm.

For Windows users there is [Node Version Manager for Windows](https://github.com/coreybutler/nvm-windows).

Install Node.js and `npm` with `nvm`:

```bash
nvm install node

nvm use node
```

Replace 'node' with 'latest' for `nvm-windows`.

## Getting Started

Clone this repository to your local machine:

```bash
git clone https://github.com/plissken2013es/JawsAICompanion.git
```

Go into your new project folder and install dependencies:

```bash
cd JawsAICompanion
npm install
```

Start development server:

```
npm start
```

To create a production build:

```
npm run build
```

Production files will be placed in the `dist` folder. Then upload those files to a web server. 🎉

## Project Structure

```
    .
    ├── dist
    ├── node_modules
    ├── public
    ├── src
    │   ├── consts
    │   │   ├── ZoneNames.ts
    │   ├── objects
    │   │   ├── Swimmer.ts    
    │   ├── scenes
    │   │   ├── Intro.ts
    │   ├── utils
    │   │   ├── JawsAI.ts    
    │   ├── index.html
    │   ├── main.ts
    ├── vite.config.ts
    ├── package.json
```

TypeScript files are intended for the `src` folder. `main.ts` is the entry point referenced by `index.html`.

If you want to know how the shark thinks / behaves... go directly to the `JawsAI.ts` code logic.

## Static Assets

Any static assets like images or audio files should be placed in the `public` folder. They'll be served at the root path, e.g. `http://localhost:8000/img/my-image.png`.

Example `public` structure:

```
    public
    ├── img
    │   ├── attack.png
    ├── audio
    │   ├── ...
    ├── fonts
    │   ├── ...
    ├── scripts
    │   ├── ...    
```

Phaser framework loads those assets like this: `this.load.image('my-image', 'img/my-image.png')`.

## Dev Server Port

You can change the dev server port in `vite.config.ts`:

```ts
server: {
    port: 8000
}
```

## Translating the app

The app currently speaks English, Spanish, German, Russian and Italian, and new languages are very welcome. Please open your pull request **on this repository** (`src/`), not on [JawsDist](https://github.com/plissken2013es/JawsDist): JawsDist only holds the compiled build that the web version is deployed from, so changes made there would be lost with the next release and would never reach the Android app.

To add a language (using Italian, `IT`, as the example), this is where the texts live:

- `src/consts/Languages.ts`: add the language code to the enum (`Italian = "IT"`).
- `src/utils/LocaleManager.ts`: the UI texts. Each English text is a key, and you add a line with your code next to the existing translations:
  ```ts
  "End Turn": {
    ES: "Fin Turno",
    DE: "Zug beenden",
    RU: "Конец хода",
    IT: "Fine Turno"
  },
  ```
  Keep the `\n` line breaks: the texts have to fit their boxes on screen.
- `src/utils/FlavorTextsManager.ts`: the movie quotes shown during the game. **Please keep them as close as possible to the actual lines of the film as dubbed in your language**, rather than translating the English quotes: the translators of the other languages matched the dubbed dialogue too.
- `src/scenes/Preloader.ts`: the non-profit disclaimer shown on startup (`legalTextEN`, `legalTextES`, …). Add your own array and its `case` in the `switch`.
- `src/scenes/StudiosLogo.ts`: the "Proudly presents..." line.
- `src/scenes/LanguageSelection.ts` and `public/img/flag_xx.png`: the flag on the language screen (a 128×128 PNG, like the other flags). The flags are placed by hand, so they need re-spacing when you add one.
- `src/scenes/FinalOptions.ts`: the credits. Add yourself as "*Language* translation: *your name*".
- `tests/utils/LocaleManager.test.ts`: a few tests for your language, like the existing ones.

Check your work before opening the pull request:

```bash
npm test        # all tests must pass
npm start       # http://localhost:8000: choose your flag and play a few turns
```

Any text you don't translate falls back to English, so a partial translation won't break anything, but it will show up in English in the app.

## License

[MIT License](LICENSE)
