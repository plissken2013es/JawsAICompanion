import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.netlify.JawsCompanion',
  appName: 'Jaws Companion App',
  webDir: 'dist',
  // Black WebView background (not white) while loading and under the camera cutout.
  backgroundColor: '#000000',
  android: {
    backgroundColor: '#000000',
  },
  plugins: {
    SystemBars: {
      // Capacitor 8 on Android 15+ pads the WebView for the bars and the cutout (white strips in
      // landscape). MainActivity already goes immersive and draws under the cutout, so disable it.
      insetsHandling: 'disable',
    },
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
