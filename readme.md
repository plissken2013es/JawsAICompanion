![phaser3-parceljs-template](https://github.com/plissken2013es/JawsAICompanion/blob/main/public/img/jaws_pixel.png)

# Jaws Board game AI Companion. Based on Phaser3 + TypeScript + Parcel
> We're gonna need a bigger boat.

![License](https://img.shields.io/badge/license-MIT-green)

Live demo: https://robojaws.netlify.app/

## Prerequisites

You'll need [Node.js](https://nodejs.org/en/), [npm](https://www.npmjs.com/), and [Parcel](https://parceljs.org/) installed.

It is highly recommended to use [Node Version Manager](https://github.com/nvm-sh/nvm) (nvm) to install Node.js and npm.

For Windows users there is [Node Version Manager for Windows](https://github.com/coreybutler/nvm-windows).

Install Node.js and `npm` with `nvm`:

```bash
nvm install node

nvm use node
```

Replace 'node' with 'latest' for `nvm-windows`.

Then install Parcel:

```bash
npm install -g parcel-bundler
```

## Getting Started

Clone this repository to your local machine:

```bash
git clone https://github.com/plissken2013es/Jaws.git
```

This will create a folder named `Jaws`. You can specify a different folder name like this:

```bash
git clone https://github.com/plissken2013es/Jaws.git my-folder-name
```

Go into your new project folder and install dependencies:

```bash
cd phaser3-typescript-parcel-template # or 'my-folder-name'
npm install
```

Start development server:

```
npm run start
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
    ├── package.json
```

TypeScript files are intended for the `src` folder. `main.ts` is the entry point referenced by `index.html`.

If you want to know how the shark thinks / behaves... go directly to the `JawsAI.ts` code logic.

## Static Assets

Any static assets like images or audio files should be placed in the `public` folder. It'll then be served at http://localhost:8000/images/my-image.png

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

Phaser framework loads those assets like this: `this.image.load('my-image', 'images/my-image.png')`.

## Dev Server Port

You can change the dev server's port number by modifying the `start` script in `package.json`. We use Parcel's `-p` option to specify the port number.

The script looks like this:

```
parcel src/index.html -p 8000
```

Change 8000 to whatever you want.

## Other Notes

[parcel-plugin-clean-easy](https://github.com/lifuzhao100/parcel-plugin-clean-easy) is used to ensure only the latest files are in the `dist` folder. You can modify this behavior by changing `parcelCleanPaths` in `package.json`.

[parcel-plugin-static-files](https://github.com/elwin013/parcel-plugin-static-files-copy#readme) is used to copy static files from `public` into the output directory and serve it. You can add additional paths by modifying `staticFiles` in `package.json`.

## License

[MIT License](https://github.com/plissken2013es/Jaws/blob/master/LICENSE)
