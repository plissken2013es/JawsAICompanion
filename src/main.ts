import Phaser from 'phaser'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import { ScreenOrientation } from '@capacitor/screen-orientation'

import SceneKeys from './consts/SceneKeys'

if (Capacitor.isNativePlatform()) {
	StatusBar.hide()
	ScreenOrientation.lock({ orientation: 'landscape' })
}

import Preloader from './scenes/Preloader'
import StudiosLogo from './scenes/StudiosLogo'
import Intro from './scenes/Intro'
import Game from './scenes/Game'
import LanguageSelection from './scenes/LanguageSelection'
import FinalOptions from './scenes/FinalOptions'
import LogScreen from './scenes/LogScreen'
import InitialOptions from './scenes/InitialOptions'
import Act2Setup from './act2/scenes/Act2Setup'
import Act2Round from './act2/scenes/Act2Round'
import Act2End from './act2/scenes/Act2End'

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: 1024,
	height: 640,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { x: 0, y: 0 },
			debug: true
		}
	},
	scale: {
		mode: Phaser.Scale.ScaleModes.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH
	},
	backgroundColor: "#00001a",
	// Development only: ?timer runs the loop on setTimeout, because the desktop app's browser pane
	// throttles requestAnimationFrame (taps then get lost between frames while testing).
	fps: { forceSetTimeOut: !!(import.meta.env && import.meta.env.DEV) && new URLSearchParams(location.search).has('timer') },
	scene: [LanguageSelection, Preloader, StudiosLogo, InitialOptions, Intro, Game, FinalOptions, Act2Setup, Act2Round, Act2End]
}

const game = new Phaser.Game(config)

// Development only: lets the browser tools and the e2e smoke test reach the game.
if (import.meta.env && import.meta.env.DEV) (window as any).__jawsGame = game

export default game
