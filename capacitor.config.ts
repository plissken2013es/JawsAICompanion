import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.netlify.JawsCompanion',
  appName: 'Jaws Companion App',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      backgroundColor: '#000000',
      showDuration: 2000,
      autoHide: false,
    },
    StatusBar: {
      overlaysWebView: true,
    },
  },
}

export default config
