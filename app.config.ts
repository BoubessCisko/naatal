import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Naatal',
  slug: 'naatal',
  scheme: 'naatal',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.naatal.app',
    infoPlist: {
      NSMicrophoneUsageDescription:
        "Naatal enregistre votre accord vocal pour créer le dossier de preuve.",
      NSCameraUsageDescription:
        "Naatal a besoin de prendre une photo de votre carte d'identité pour vérifier votre identité.",
    },
  },
  android: {
    package: 'com.naatal.app',
    adaptiveIcon: {
      backgroundColor: '#111b21',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['RECORD_AUDIO', 'CAMERA'],
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: ['expo-router', 'expo-font', 'expo-audio', 'expo-sharing'],
  experiments: {
    // typedRoutes désactivé temporairement — à réactiver quand on aura besoin de l'autocomplete
    // sur tous les écrans (sinon force à régénérer .expo/types/router.d.ts à chaque ajout d'écran).
    typedRoutes: false,
  },
};

export default config;
