![phaser3-vite-template](https://github.com/plissken2013es/Jaws/blob/main/public/img/jaws_pixel.png)

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
git clone https://github.com/plissken2013es/Jaws.git
```

Go into your new project folder and install dependencies:

```bash
cd phaser3-typescript-parcel-template
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

## License

[MIT License](https://github.com/plissken2013es/Jaws/blob/master/LICENSE)
