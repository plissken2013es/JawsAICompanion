import Phaser from 'phaser'

import SceneKeys from './consts/SceneKeys'

import Preloader from './scenes/Preloader'
import Intro from './scenes/Intro'
import Game from './scenes/Game'
import LanguageSelection from './scenes/LanguageSelection'

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: 1024,
	height: 640,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0 },
			debug: true
		}
	},
	scale: {
		mode: Phaser.Scale.ScaleModes.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH
	},
	backgroundColor: "#00001a",
	scene: [LanguageSelection, Preloader, Intro, Game]
}

export default new Phaser.Game(config)
