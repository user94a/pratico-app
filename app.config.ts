import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Pratico',
  slug: 'pratico-app',
  scheme: 'pratico',
  version: '1.0.3',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'it.extendi.pratico',
    buildNumber: '11',
    userInterfaceStyle: 'light',
    infoPlist: {
      NSCameraUsageDescription: 'Questa app usa la fotocamera per scattare foto dei documenti da allegare.',
      NSPhotoLibraryUsageDescription: 'Questa app accede alla galleria foto per selezionare immagini da allegare ai documenti.',
      NSMicrophoneUsageDescription: 'Questa app potrebbe richiedere l\'accesso al microfono per funzionalità future.',
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'it.extendi.pratico',
    versionCode: 3,
    userInterfaceStyle: 'light',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE'
    ]
  },
  web: {
    favicon: './assets/images/favicon.png'
  },
  extra: {
    eas: {
      projectId: 'd377ca36-f1f2-4347-9c19-5e6027aaf727'
    },
    // Aggiorna questo URL con l'URL del backend su Render una volta deployato
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://pratico-backend-XXXXX.onrender.com/api'
  },
  owner: 'extendi'
});